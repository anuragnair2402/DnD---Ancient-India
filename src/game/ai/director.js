// The Director: builds the GameSession AI hooks (riddleJudge, persona, narrate, personaOffer)
// for the current provider mode. Every hook is asynchronous and degrades to deterministic
// offline behavior. The Truth Engine's session remains authoritative regardless.

import { resolveMode } from './providers/provider.js';
import { geminiGenerateJson } from './providers/gemini.js';
import { webllmGenerateJson } from './providers/webllm.js';
import { judgePrompt, riddlePrompt, fairnessPrompt, validateGeneratedRiddle, curatedFallback } from './generators/riddleGen.js';
import { personaPrompt, validatePersona } from './generators/persona.js';
import { narratePrompt, validateNarrate } from './generators/narrate.js';
import { validators } from './harness/schema.js';
import { localJudge, SEMANTIC_CAP } from './harness/judge.js';
import { cannedLine } from '../world/entities.js';

const CONSTITUTION = 'You are the living fiction of a Rajasthani-occult horror text adventure. Never break the fourth wall. Never invent items, keys, or solutions. Return only valid JSON. Keep in a dark, witty, specific register.';

export function createDirector(config = {}, opts = {}) {
  const mode = resolveMode(config);
  const geminiKey = (config && config.geminiApiKey) || '';

  async function llm(system, user, o = {}) {
    if (mode === 'gemini' && geminiKey) return geminiGenerateJson(geminiKey, system, user, o);
    if (mode === 'webllm') return webllmGenerateJson(system, user, o);
    throw new Error('no online provider');
  }

  const hooks = {
    // Procedural riddle: generate -> schema cage -> round-trip fairness gate -> curated fallback.
    // docs/03 §3.2: any doubt or unavailability falls back to the curated catalog for that gate.
    async riddleFor(gate, seed) {
      if (mode === 'offline') return curatedFallback(gate, seed);
      try {
        const { sys, user } = riddlePrompt(gate, seed);
        const obj = await llm(sys, user, { temperature: 0.9, maxTokens: 300 });
        const riddle = validateGeneratedRiddle(obj);
        if (!riddle) return curatedFallback(gate, seed);
        // Judge-pass A (canonical): independent fairness check; on any doubt, curated.
        const fairQ = fairnessPrompt(riddle);
        const fairObj = await llm(fairQ.sys, fairQ.user, { temperature: 0.1, maxTokens: 80 });
        if (!validators.riddleFair(fairObj) || !fairObj.fair) return curatedFallback(gate, seed);
        return { ...riddle, source: 'generated' };
      } catch (e) {
        return curatedFallback(gate, seed);
      }
    },

    // Semantics judge: accepts a legitimate alternate answer, conservatively.
    async riddleJudge(instance, playerAnswer) {
      if (mode === 'offline') return localJudge(instance, playerAnswer);
      try {
        const { sys, user } = judgePrompt(instance, playerAnswer);
        const obj = await llm(sys, user, { temperature: 0.2, maxTokens: 120 });
        if (!validators.verdict(obj)) return { correct: false, confidence: 'low' };
        if (obj.correct && obj.confidence !== 'high') return { correct: false, confidence: 'low' };
        return { correct: !!obj.correct, confidence: obj.confidence || 'low' };
      } catch (e) {
        return localJudge(instance, playerAnswer);
      }
    },

    // Persona: entity in-character speech.
    async persona(entityId, mood, context = {}) {
      if (mode === 'offline') return cannedLine(entityId, mood);
      try {
        const built = personaPrompt(entityId, mood, context);
        if (!built) return cannedLine(entityId, mood);
        const obj = await llm(CONSTITUTION + '\n' + built.sys, built.user, { temperature: 0.9, maxTokens: 200 });
        const v = validatePersona(obj);
        return v ? v.line : cannedLine(entityId, mood);
      } catch (e) {
        return cannedLine(entityId, mood);
      }
    },

    // Narration: free-form examine enrichment.
    async narrate(ctx) {
      if (mode === 'offline') return null;
      try {
        const { sys, user } = narratePrompt(ctx);
        const obj = await llm(CONSTITUTION + '\n' + sys, user, { temperature: 0.9, maxTokens: 200 });
        const v = validateNarrate(obj);
        return v ? v.prose : null;
      } catch (e) {
        return null;
      }
    },

    // Persona offer: a bargain in legal terms (or null).
    async personaOffer(entityId, state) {
      // offline canonical bargain — deterministic and always legal
      if (entityId === 'djinn') {
        if (state.player.inventory.includes('oil_flask') && !state.player.flags.djinn_oil_offered) {
          return {
            given: 'oil_flask',
            giveName: 'a flask of lamp oil',
            sanityCost: 15,
            wantedText: 'the calm of a moment not spent in the dark',
            acceptText: `You hand the oil flask into the shimmer. It drinks it dry with a soft, satisfied sound, and for a long, strange moment the screaming of the house is simply... quiet. (Sanity +15)`,
            flag: 'djinn_oil_offered'
          };
        }
      }
      return null;
    }
  };

  return { mode, hooks };
}

export function seedDirector(config) {
  return createDirector(config);
}

export { SEMANTIC_CAP };
