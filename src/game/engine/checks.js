// Attribute roll-gates, sanity tier behavior, madness events, and venture danger.
// Pure functions over engine state; mutations go through state.applyIntents.

import { sanityTierOf } from '../world/world.js';

// Soft attribute check: pass chance scaled by attribute, plus a flat luck die.
// Returns { success, margin }. Used for secret doors, decoy disbelief, spirit checks.
export function rollCheck(stat, difficulty = 10, luck = Math.random()) {
  const target = Math.max(1, stat - difficulty + 10);
  const success = luck * 100 < target * 5 || stat >= difficulty + 5;
  return { success, margin: Math.round(target) };
}

export function tierOf(state) {
  return sanityTierOf(state.player.stats.sanity);
}

// Per-turn ambient sanity drain driven by room "aura" (dark, heavy places tax the mind),
// reduced by courage (psychic armor) and by a lit lantern (familiar light is soothing).
export function ambientSanityCost(state) {
  const aura = state.world.roomAura || 4; // injected by resolver from room def
  const tier = tierOf(state);
  const courage = state.player.stats.courage || 8;
  let cost = aura * 0.18; // 0.5..2.2 per turn in aura 3..12
  if (!state.world.lit) cost += 1.0;      // darkness is a tax
  if (tier === 'fractured') cost += 0.5;  // the Sight burns
  cost -= courage * 0.07;                  // strong courage stalms the leak
  return Math.max(0, Math.round(cost * 10) / 10);
}

// Oil burn per turn: base + more when moving through unlit heavy rooms.
export function oilCost(state) {
  let cost = 2;
  if (!state.world.lit) cost = 0;           // if the lamp is out, no oil burns (but sanity tax rises)
  if ((state.world.roomAura || 0) > 6) cost = 3;
  return cost;
}

// A "venture" the player can opt into that gambles sanity for a reward/access.
// Returns a resolved outcome { storyText, intents, happened }.
export function ventureMadness(state, opts = {}) {
  const roll = Math.random();
  const courage = state.player.stats.courage || 8;
  const risky = roll > (courage / 20); // lower courage => high chance of bad
  if (!risky) {
    return {
      happened: true,
      storyText: 'You let the madness take the wheel for one heartbeat. For that one heartbeat, the house showed you a route the sane cannot trace — you feel steadier for having chosen it. (Sanity -5, forward path revealed)',
      intents: [
        { type: 'sanity', delta: -5 },
        { type: 'setFlag', flag: 'ventured_madness', value: true }
      ]
    };
  }
  // bad outcome
  const loss = 12 + Math.floor(Math.random() * 8);
  return {
    happened: true,
    storyText: `You reach into the dark of your own skull to ask it for directions. It answers with a scream. Visions of yellow eyes and a falling well wrench through you before you claw your way back. (Sanity -${loss})`,
    intents: [
      { type: 'sanity', delta: -loss },
      { type: 'setFlag', flag: 'ventured_madness', value: true }
    ]
  };
}

// Madness Event: triggered by specific high-aura actions or a Fractured-state risk.
// Random flavor + a real mechanical cost (sanity toward 0 or a forced drop).
export function madnessEvent(state) {
  const events = [
    { text: 'The floor drops away from under your certainty. For a long second you are falling through every floor of the haveli at once. (Sanity -15)', loss: 15 },
    { text: 'You see your own reflection walking away from you down a hall that has no mirror. (Sanity -15)', loss: 15 },
    { text: 'The walls intone your name in the Thakur\u2019s voice. It knows what you have not decided yet. (Sanity -12)', loss: 12 },
    { text: 'A child\u2019s laugh runs past you on the stairs, and for a moment you are holding something small and silver that you do not remember taking. (Sanity -18)', loss: 18 }
  ];
  const ev = events[Math.floor(Math.random() * events.length)];
  return {
    storyText: `[MADNESS EVENT] ${ev.text}`,
    intents: [{ type: 'sanity', delta: -ev.loss }]
  };
}
