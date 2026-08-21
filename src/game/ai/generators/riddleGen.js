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

export function riddlePrompt(gate) {
  const sys = `You are an ancient Djinn guarding a cursed Rajasthani haveli. You speak only in atmospheric, poetic riddles.
Rules:
1. Write a 1-3 line atmospheric riddle in dark poetry.
2. The answer must be a single common noun (e.g. shadow, mirror, fire, river, key, smoke, blood, time).
3. Do NOT include numbers, trivia, or placeholders.
4. Output strict JSON in this exact structure:
{
  "riddle": "I have no voice, yet I mimic your face in the glass. When the light fades, I vanish. What am I?",
  "answer": "mirror",
  "variants": ["a mirror", "the mirror", "glass", "looking glass"],
  "hint": "Think of what decorates the vanity tables of the haveli."
}`;
  const user = `Create a riddle for the ${gate.name}. Theme: ${CATEGORY_HINTS[gate.category] || 'an occult relic'}.\n\nProduce your JSON riddle now.`;
  return { sys, user };
}

export function validateGeneratedRiddle(obj, gate) {
  if (!validators.riddle(obj)) return null;
  const answer = (obj.answer || '').trim().toLowerCase();
  const riddle = (obj.riddle || '').trim();
  const hint = (obj.hint || '').trim();

  // Reject echoed prompt placeholders or template instructions
  const banned = ['1-line', 'in-fiction', 'in-fact', 'canonical', 'single noun', 'dark poetry', 'without giving', 'placeholder', '<', '>'];
  if (banned.some(b => hint.toLowerCase().includes(b))) return null;
  if (banned.some(b => riddle.toLowerCase().includes(b))) return null;
  if (riddle.toLowerCase().startsWith('gate:') || (gate && riddle.toLowerCase() === gate.name?.toLowerCase())) return null;
  if (riddle.length < 20 || hint.length < 5 || answer.length < 2) return null;

  // Reject if answer or riddle contains digits/numbers
  if (/\d+/.test(answer) || /\d{3,}/.test(riddle) || /\d{3,}/.test(hint)) return null;

  return {
    riddle,
    answer,
    variants: (obj.variants || []).map(v => String(v).toLowerCase()).slice(0, 5),
    hint
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
