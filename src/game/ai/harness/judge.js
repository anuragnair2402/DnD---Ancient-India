// The conservative semantic-answer judge. When a player's free-text answer doesn't
// lexically match the riddle's canonical answer+variants, this decides whether it is a
// genuinely valid alternate answer — capped and biased against guessing.

// Local thesaurus of valid alternate answers per canonical concept (offline fallback).
const ALIASES = {
  shadow: ['shadow', 'darkness', 'my shadow', 'silhouette', 'umbra'],
  mirror: ['mirror', 'looking glass', 'glass', 'speculum', 'reflector'],
  sword: ['sword', 'talwar', 'blade', 'saber', 'scimitar', 'kukri', 'steel'],
  fire: ['fire', 'flame', 'blaze', 'ember', 'hearth'],
  water: ['water', 'river', 'stream', 'well', 'rain', 'aqua'],
  light: ['light', 'lamp', 'lantern', 'flame', 'torch', 'glow'],
  stars: ['stars', 'star', 'constellations', 'the sky', 'firmament'],
  diamond: ['diamond', 'gem', 'jewel', 'jewel', 'stone', 'star of mewar', 'karat']
};

function canonicalKey(answer) {
  const a = (answer || '').toLowerCase().trim();
  for (const k of Object.keys(ALIASES)) {
    if (ALIASES[k].includes(a) || a.includes(k)) return k;
  }
  return (answer || '').toLowerCase().trim();
}

// Deterministic conservative judgment: accept only an answer that is an alias of the
// canonical concept AND distinct from the exact lexical match (so it's a "second answer").
export function localJudge(instance, playerAnswer) {
  const raw = (playerAnswer || '').trim().toLowerCase();
  if (!raw) return { correct: false, confidence: 'low' };
  const key = canonicalKey(instance.answer);
  const pool = ALIASES[key] || [];
  const isAlias = pool.some(a => a === raw || raw.includes(a) || a.includes(raw));
  if (!isAlias) return { correct: false, confidence: 'low' };
  // guardrail: not merely the canonical string itself
  const canonical = (instance.answer || '').toLowerCase().trim();
  if (raw === canonical) return { correct: false, confidence: 'low' };
  return { correct: true, confidence: 'high' };
}

// The cap/leash logic applied by the session: at most N semantic accepts per gate.
export const SEMANTIC_CAP = 2;
