// Free-form narration generation for "examine [thing]". Bounded, one-shot, no state
// mutation; the schema has no state fields, so the model can never change game truth.

import { validators } from '../harness/schema.js';

export function narratePrompt(ctx) {
  const sys = `You are the living voice of a cursed Rajasthani haveli in a horror text adventure. The player will attempt actions or examine things. Respond in a dark, witty, specific, gothic register, 2-4 lines. 
If the action is nonsensical or impossible, describe how the house swallows the attempt or mocks it. 
Never break the fourth wall, never invent solutions or new items. You may hint only at knowledge already visible in the room.

Return STRICT JSON: {"prose":"<2-4 lines of rich, specific description>","hint":null}`;
  
  const attemptStr = ctx.action === 'freeform' 
    ? `attempts to: "${ctx.query}"` 
    : `examines: "${ctx.target}"`;
  
  const user = `The player is in "${ctx.roomName || ctx.room}" and ${attemptStr}.\nRoom description: ${ctx.roomDesc || ''}`;
  return { sys, user };
}

export function validateNarrate(obj) {
  return validators.narrate(obj) ? { prose: obj.prose } : null;
}
