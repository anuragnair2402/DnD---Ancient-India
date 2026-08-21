// Procedural riddle generation. The LLM proposes a fresh riddle per gate; it is validated
// by the schema cage and (when online) a round-trip fairness judge. Any failure falls back
// to the curated catalog — so a bad generation can never break the game.

import { validators } from '../harness/schema.js';
import { pickRiddle } from '../../world/riddles-curated.js';

const THEMATIC_DOMAINS = {
  shadow: 'unseen silhouettes, darkness born of light, footsteps without weight',
  mirror: 'silvered glass, twin reflections, silent observers, vanity',
  sword: 'forged Rajput steel, cold blades, severed oaths, royal warfare',
  flame: 'hungry embers, the consuming element, warmth that turns to ash',
  water: 'desert wells, deep subterranean currents, tears, forgotten rivers',
  light: 'lantern oil, rays that pierce the dark, dawn over the desert',
  celestial: 'the night sky, firmament, star charts, cosmic observers',
  diamond: 'crystallized royal gemstones, precious treasures, radiant mineral'
};

export function riddlePrompt(gate) {
  const domain = THEMATIC_DOMAINS[gate.category] || 'ancient Rajasthani occult folklore';
  const sys = `You are an ancient, master Riddle-Weaver and Djinn guarding a cursed 19th-century Rajasthani haveli.
You craft atmospheric, highly fair riddles according to the STRICT LAWS OF RIDDLE-CRAFT:

THE 4 SACRED LAWS OF RIDDLE CRAFT:
1. ABSOLUTE FORBIDDEN LEAKAGE (Cardinal Law):
   - You must NEVER use the answer word or any derivative/stem of the answer word in the riddle text or hint!
   - Example: If the answer is "shadow", the words "shadow", "shade", "shadows", "shadowy" are 100% FORBIDDEN from the riddle and hint.
2. PARADOXICAL CLUES:
   - Structure the riddle using 2-3 atmospheric paradoxes (e.g. what it does vs cannot do, what births it vs what kills it).
   - "I have no voice yet I mimic your face...", "I hunger without a mouth, and die when drinking water..."
3. SINGLE COMMON NOUN TARGET:
   - The answer must be a single common, tangible noun (e.g. shadow, mirror, fire, river, key, sword, smoke, breath, blood, time).
   - NEVER use abstract phrases, math, trivia, numbers, or place names.
4. EVOCATIVE HINT:
   - The hint must provide conceptual perspective without containing the answer root word.

JSON OUTPUT STRUCTURE (Produce strict JSON matching this format):
{
  "riddle": "I run without feet alongside you across the desert sand, yet when the light dies in the oculus, I vanish without a trace. What am I?",
  "answer": "shadow",
  "variants": ["a shadow", "the shadow", "silhouette"],
  "hint": "Look where the lantern light meets the stone floor."
}`;
  const user = `Create a riddle for the ${gate.name}. Domain focus: ${domain}.\n\nProduce your JSON riddle now.`;
  return { sys, user };
}

export function validateGeneratedRiddle(obj, gate) {
  if (!validators.riddle(obj)) return null;
  const answer = (obj.answer || '').trim().toLowerCase();
  const riddle = (obj.riddle || '').trim();
  const hint = (obj.hint || '').trim();

  // 1. Reject echoed prompt placeholders or template instructions
  const banned = ['1-line', 'in-fiction', 'in-fact', 'canonical', 'single noun', 'dark poetry', 'without giving', 'placeholder', '<', '>'];
  if (banned.some(b => hint.toLowerCase().includes(b))) return null;
  if (banned.some(b => riddle.toLowerCase().includes(b))) return null;
  if (riddle.toLowerCase().startsWith('gate:') || (gate && riddle.toLowerCase() === gate.name?.toLowerCase())) return null;
  if (riddle.length < 20 || hint.length < 5 || answer.length < 2) return null;

  // 2. Reject if answer or riddle contains digits/numbers
  if (/\d+/.test(answer) || /\d{3,}/.test(riddle) || /\d{3,}/.test(hint)) return null;

  // 3. CARDINAL LEAK CHECK: Answer (or stem) MUST NOT appear inside the riddle text or hint!
  const answerCandidates = [answer, ...(obj.variants || [])].map(w => String(w).toLowerCase().replace(/^(a|an|the)\s+/, '').trim());
  for (const cand of answerCandidates) {
    if (cand.length >= 3) {
      const stem = cand.replace(/s$|es$|ing$|ed$/, '');
      const regex = new RegExp(`\\b${stem}`, 'i');
      if (regex.test(riddle)) {
        console.warn(`[Riddle Rejected]: Answer word "${cand}" (stem: "${stem}") leaked into riddle text: "${riddle}"`);
        return null; // Reject leaked riddle!
      }
    }
  }

  return {
    riddle,
    answer,
    variants: (obj.variants || []).map(v => String(v).toLowerCase()).slice(0, 5),
    hint
  };
}

// Round-trip fairness gate: ensure the generated riddle is solvable + unambiguous.
export function fairnessPrompt(riddleObj) {
  const sys = `You are a strict Master Editor of puzzle craftsmanship.
Evaluate the given riddle and answer against these 3 criteria:
1. Does the riddle text strictly AVOID saying the answer word or any of its stems? (If the riddle contains its own answer, reject immediately).
2. Is the answer uniquely solvable and fair from the clues provided?
3. Is it a well-crafted poetic riddle and not trivia or nonsense?

Return STRICT JSON: {"fair": true | false, "reason": "<1 sentence>"}`;
  const user = `RIDDLE: "${riddleObj.riddle}"\nANSWER: "${riddleObj.answer}"\nIs it fair, uniquely solvable, and free of answer leakage?`;
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
