// Procedural riddle generation. The LLM proposes a fresh riddle per gate; it is validated
// by the schema cage and (when online) a round-trip fairness judge. Any failure falls back
// to the curated catalog — so a bad generation can never break the game.

import { validators } from '../harness/schema.js';
import { pickRiddle } from '../../world/riddles-curated.js';

const CATEGORY_HINTS = {
  shadow: 'a shadow/presence thing',
  mirror: 'something in a palace of mirrors',
  sword: 'a Rajput weapon',
  flame: 'something of fire or the hearth',
  water: 'something of rivers, wells, or the deep',
  light: 'something of lamps and light',
  celestial: 'the stars or the sky',
  diamond: 'a great jewel'
};

export function riddlePrompt(gate, seed) {
  const sys = `You are an ancient, malevolent Djinn who speaks in poetic, metaphorical riddles. You guard the doors of a cursed 19th-century Rajasthani haveli.
Your riddles must NEVER be direct trivia questions (e.g. do not ask "What is the place where..."). Instead, they must be highly poetic, atmospheric, and use paradox or metaphor (e.g., "I hunger but have no mouth...", "I wear a silver face...").
The riddle must be challenging but fair, answerable by a single common noun.

Return STRICT JSON only:
{"riddle":"<the riddle, 1-3 sentences of dark poetry>","answer":"<single canonical answer>","variants":["<2-4 alternate accepted wordings>"],"hint":"<a 1-line in-fiction hint>"}`;
  const user = `Gate: ${gate.name}\nTheme/category: ${CATEGORY_HINTS[gate.category] || 'an occult object'}\nSeed: ${seed}\n\nSpeak your riddle.`;
  return { sys, user };
}

export function validateGeneratedRiddle(obj) {
  if (!validators.riddle(obj)) return null;
  return {
    riddle: obj.riddle,
    answer: (obj.answer || '').trim().toLowerCase(),
    variants: (obj.variants || []).map(v => String(v).toLowerCase()).slice(0, 5),
    hint: obj.hint
  };
}

// Round-trip fairness gate: ensure the generated riddle is solvable + unambiguous.
export function fairnessPrompt(riddleObj) {
  const sys = `You are a strict editor of puzzle quality. Given a riddle and its intended answer, decide whether the answer is the UNIQUELY-intended single concept AND whether the riddle is solvable and not ambiguous. Be conservative.

Return STRICT JSON: {"fair":true|false,"reason":"<1 sentence>"}`;
  const user = `RIDDLE: "${riddleObj.riddle}"\nANSWER: "${riddleObj.answer}"\nIs it fair and uniquely answerable?`;
  return { sys, user };
}

// Judge prompt for alternate answers ("two different answers").
export function judgePrompt(riddleObj, playerAnswer) {
  const sys = `You are a riddle judge in an escape game, with a strict and conservative disposition. Decide whether the player's answer is a LEGITIMATE, equally-correct answer to THIS riddle — not a synonym-fudge and not a guess. When in doubt, answer false.

Return STRICT JSON: {"correct":true|false,"confidence":"high|med|low"}`;
  const user = `RIDDLE: "${riddleObj.riddle}"\nINTENDED ANSWER: "${riddleObj.answer}"\nPLAYER'S ANSWER: "${playerAnswer}"\nIs it a valid alternate answer?`;
  return { sys, user };
}

export function curatedFallback(gate, seed) {
  const r = pickRiddle(gate.category, seed);
  return { riddle: r.riddle, answer: r.answer, variants: [...r.variants], hint: r.hint, source: 'curated' };
}
