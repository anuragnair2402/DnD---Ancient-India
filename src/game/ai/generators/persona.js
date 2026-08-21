// Persona dialogue generation. Builds entity prompts from personality cards, validates
// output with the schema cage, and returns null on any failure (callsite falls back to
// the deterministic canned lines).

import { ENTITIES } from '../../world/entities.js';
import { validators } from '../harness/schema.js';

export function personaPrompt(entityId, mood, context = {}) {
  const card = ENTITIES[entityId];
  if (!card) return null;
  const sys = `You are ${card.name} inside a cursed Rajasthani horror text adventure. Constitution — stay in character, in register: ${card.register}. Tics: ${card.tics.join('; ')}. What you want: ${card.goals}. NEVER break the fourth wall, NEVER hand over a key answer unsolicited, never reveal solutions the player has not earned.

Return STRICT JSON only:
{"line":"<1-3 lines of in-character speech, witty and specific, no filler>","mood":"idle|offer|mocked|pleased|wrathful","offer":<null or {"given":"itemId","receive":"itemId|sanity"} >,"reveal":<null or "almanac memory id">}`;
  const user = `Situation — ${context.situation || 'the player is in your house asking for your attention. You may speak.'}
Player state: room=${context.room || 'unknown'}, sanity=${context.sanity ?? '?'}.`;
  return { sys, user, card };
}

export function validatePersona(obj) {
  if (!validators.persona(obj)) return null;
  const mood = ['idle', 'offer', 'mocked', 'pleased', 'wrathful'].includes(obj.mood) ? obj.mood : 'idle';
  return {
    line: obj.line,
    mood,
    offer: obj.offer && typeof obj.offer === 'object' && obj.offer.given ? obj.offer : null,
    reveal: obj.reveal || null
  };
}
