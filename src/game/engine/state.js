// Authoritative player/world state and the SINGLE mutation surface (applyIntents).
// Nothing — not even the LLM — mutates game truth except through applyIntents, which
// clamps, cap-checks, and validates every proposed delta.

import { sanityTierOf } from '../world/world.js';

export const MAX_INVENTORY = 6;

export function createInitialState() {
  return {
    status: 'creation',           // 'creation'|'playing'|'gameover'|'victory'
    player: {
      name: '',
      classId: 'Mercenary',
      stats: { sanity: 100, maxSanity: 100, resolve: 10, perception: 10, courage: 10, terror: 10 },
      inventory: [],
      keys: { bronze: false, silver: false, gold: false },
      flags: {},                  // learnedDjinnName, freedRani, madeWard, collapsed_tunnel, ...
      craftKnowledge: [],
      rison: {}                   // resonance pieces gathered: true_name, ember, rattle, star_chart
    },
    world: {
      currentRoom: 'front_foyer',
      turn: 1,
      maxTurns: 60,
      oil: 100, maxOil: 100, lit: true,
      runSeed: Math.floor(Math.random() * 99997),
      roomAura: 4,
      unlockedGates: {},
      doors: {
        elementOrder: [],
        observatoryLampsLit: [],
        mirrorsAngled: 0,
        tunnelCollapsed: false,
        sheeshOpened: false,
        sanctumReached: false,
        visited: {}
      },
      entityStates: {
        djinn: { mood: 'idle', known: false, bargainsDone: 0 },
        rani: { mood: 'idle', freed: false },
        yaksha: { mood: 'idle' },
        priest: { mood: 'idle' }
      },
      riddleInstances: {},       // gateId -> {riddle, answer, variants, hint, semanticUsed}
      lastSanityTier: 'lucid',
      objective: 'Search the mansion. Understand the curse, gather the three keys or the deeper truths, and escape before the covenant closes.'
    }
  };
}

// Recompute derived values and detect tier transitions.
export function normalize(s) {
  const st = s.player.stats;
  st.sanity = clamp(st.sanity, 0, st.maxSanity);
  s.world.oil = clamp(s.world.oil, 0, s.world.maxOil);
  // The lantern is honest: no oil, no light. Refilling relights it.
  s.world.lit = s.world.oil > 0;
  const tier = sanityTierOf(st.sanity);
  if (tier !== s.world.lastSanityTier) s.world.tierChangedTo = tier;
  s.world.lastSanityTier = tier;
  return s;
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// Allowed intent keys and their legal transforms. Returns {ok, reason}.
export function validateIntent(s, intent) {
  const o = s.world;
  switch (intent.type) {
    case 'sanity': return { ok: true };
    case 'oil': return { ok: true };
    case 'addItem': {
      if (s.player.inventory.length >= MAX_INVENTORY) return { ok: false, reason: 'Your hands are full. You must drop something first.' };
      if (s.player.inventory.includes(intent.item)) return { ok: false, reason: 'You already carry that.' };
      return { ok: true };
    }
    case 'removeItem': {
      if (!s.player.inventory.includes(intent.item)) return { ok: false, reason: 'You do not carry that.' };
      return { ok: true };
    }
    case 'setKey': return { ok: true }; // keys[bronze|silver|gold]
    case 'spendKey': return { ok: true };
    case 'move': {
      const from = o.currentRoom;
      if (intent.to === from) return { ok: false, reason: 'You are already there.' };
      // Movement legality is enforced by resolver via open exits; here we just accept a validated move.
      return { ok: true };
    }
    case 'unlockGate': return { ok: true };
    case 'setDoor': return { ok: true };
    case 'setEntity': return { ok: true };
    case 'setFlag': return { ok: true };
    case 'learnCraft': return { ok: true };
    case 'gainResonance': return { ok: true };
    case 'turn': return { ok: true, delta: intent.delta || 1 };
    default: return { ok: false, reason: 'Unknown intent type.' };
  }
}

// Apply a validated intent, mutating a deep-cloned state. Caller clones first.
export function applyIntent(s, intent) {
  const p = s.player;
  const o = s.world;
  switch (intent.type) {
    case 'sanity': p.stats.sanity += intent.delta || 0; break;
    case 'oil': o.oil += intent.delta || 0; break;
    case 'addItem': if (!p.inventory.includes(intent.item)) p.inventory.push(intent.item); break;
    case 'removeItem': p.inventory = p.inventory.filter(i => i !== intent.item); break;
    case 'setKey': if (intent.key in p.keys) p.keys[intent.key] = true; break;
    case 'spendKey': if (intent.key in p.keys) p.keys[intent.key] = false; break;
    case 'move': o.currentRoom = intent.to; break;
    case 'unlockGate': o.unlockedGates[intent.gate] = true; break;
    case 'setDoor': o.doors[intent.key] = intent.value; break;
    case 'setEntity': if (o.entityStates[intent.entity]) o.entityStates[intent.entity][intent.prop] = intent.value; break;
    case 'setFlag': p.flags[intent.flag] = intent.value ?? true; break;
    case 'learnCraft': if (!p.craftKnowledge.includes(intent.recipe)) p.craftKnowledge.push(intent.recipe); break;
    case 'gainResonance': p.rison[intent.piece] = true; break;
    case 'turn': o.turn += intent.delta || 1; break;
    default: break;
  }
  return s;
}

// Deep-clone helper.
export function cloneState(s) {
  return JSON.parse(JSON.stringify(s));
}

// Safe multi-intent apply: clone once, validate all, apply all.
export function applyIntents(s, intents) {
  const next = cloneState(s);
  for (const it of intents || []) {
    const check = validateIntent(next, it);
    if (!check.ok) return { state: next, rejected: it, reason: check.reason };
    applyIntent(next, it);
  }
  return { state: normalize(next), rejected: null, reason: null };
}

export function hasItem(s, id) {
  return s.player.inventory.includes(id);
}
