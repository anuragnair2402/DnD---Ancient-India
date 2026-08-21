// Schema validators for every LLM JSON contract. These are the "shape" cage: a response
// that does not match is rejected and the floor falls back to deterministic content.

function isStr(x) { return typeof x === 'string'; }
function isBool(x) { return typeof x === 'boolean'; }

export const validators = {
  // Procedural riddle: { riddle, answer, variants[], hint }
  riddle(obj) {
    if (!obj || typeof obj !== 'object') return false;
    if (!isStr(obj.riddle) || obj.riddle.length < 8 || obj.riddle.length > 600) return false;
    if (!isStr(obj.answer) || !obj.answer.trim() || obj.answer.length > 40) return false;
    if (!Array.isArray(obj.variants) || !obj.variants.every(isStr)) return false;
    if (!isStr(obj.hint) || obj.hint.length < 2) return false;
    return true;
  },
  // Riddle fairness gate: { fair, reason }
  riddleFair(obj) {
    return !!(obj && obj.fair !== undefined && isBool(obj.fair));
  },
  // Semantic answer judge: { correct, confidence }
  verdict(obj) {
    if (!obj || typeof obj !== 'object') return false;
    if (!isBool(obj.correct)) return false;
    const conf = obj.confidence;
    if (conf !== undefined && !['high', 'med', 'low'].includes(conf)) return false;
    return true;
  },
  // Persona dialogue: { line, mood, offer?, reveal? }
  persona(obj) {
    if (!obj || typeof obj !== 'object') return false;
    if (!isStr(obj.line) || !obj.line.trim()) return false;
    if (obj.mood !== undefined && !isStr(obj.mood)) return false;
    if (obj.offer !== undefined && obj.offer !== null) {
      if (typeof obj.offer !== 'object') return false;
      if ((obj.offer.given !== undefined && !isStr(obj.offer.given)) ||
          (obj.offer.receive !== undefined && !isStr(obj.offer.receive))) return false;
    }
    return true;
  },
  // Narration: { prose, hint? }
  narrate(obj) {
    if (!obj || typeof obj !== 'object') return false;
    return isStr(obj.prose) && obj.prose.trim().length >= 3;
  }
};

// World cage: an LLM "offer" may only reference legal items/mechanics. Called by the
// session before a bargain is presented/executed.
export const LEGAL_OFFER_IDS = new Set([
  'oil_flask', 'matches', 'bronze_key', 'silver_key', 'gold_key', 'rattle', 'herbs',
  'silk_cloth', 'sacred_ash', 'incense_of_calm', 'star_of_mewar', 'true_name_scroll',
  'ember', 'stone_of_sight', 'rope', 'artisan_key', 'ward', 'magnifying_glass',
  'old_journal', 'iron_crowbar', 'brass_bell', 'sanity'
]);

export function legalOffer(offer) {
  if (!offer || typeof offer !== 'object') return false;
  if (offer.given && !LEGAL_OFFER_IDS.has(offer.given)) return false;
  if (offer.receive && !LEGAL_OFFER_IDS.has(offer.receive)) return false;
  return true;
}
