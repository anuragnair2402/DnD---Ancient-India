// Room/entity interaction handlers. Each returns { storyText, intents, objective, hooks }.
// hooks: { persona?, riddle?, finale?, pendingTrade? } — consumed by resolver / AI director.

import { ITEMS } from '../world/items.js';
import { ambience } from './ambience.js';

const INV = (ids) => ids;

// --- generic built-in verbs ------------------------------------------------
export function genericUse(state, itemId, target, cmd) {
  const p = state.player;
  const inv = p.inventory;
  switch (itemId) {
    case 'matches':
      if (target && /oil|lamp|wick|brazier/.test(target)) {
        if (state.world.oil <= 0) {
          return { storyText: 'The lantern is dry as a spent prayer. You need oil before a spark has anything to hold.', intents: [] };
        }
        return { storyText: 'You strike a match, and the brass lantern catches with a steady, amber hum. For a moment you are grateful to be alive in a lit world. (Oil -2)', intents: [{ type: 'oil', delta: -2 }] };
      }
      return { storyText: 'You strike a sulfur match. The sudden flare throws stark, dancing shadows across the carved walls before the draft kills it.', intents: [] };
    case 'old_journal':
      return { storyText: ambience.journal(), intents: [] };
    case 'magnifying_glass':
      return { storyText: 'You peer through the brass lens. Everything is clearer, sharper — and the house dislikes being seen this well. On the far wall, you could swear there is a door where the cracks suggest a door.', intents: [] };
    case 'iron_crowbar':
      if (target === 'trunk') {
        if (inv.includes('silver_key')) return { storyText: ambience.trunkOpen(), intents: [] };
        return {
          storyText: 'With a violent heave, your iron crowbar splinters the rusted latch of the Zenana trunk! Inside, nestled in grey silk, lies the SILVER KEY and a flask of oil.',
          intents: [INV_ADD('silver_key'), { type: 'setKey', key: 'silver' }, { type: 'oil', delta: 30 }],
          objective: 'Find the Gold Key in the Fountain Cistern, and learn the house\u2019s true grief to break the pact.'
        };
      }
      return { storyText: 'You heft the iron bar. It settles arguments with locked things. Now, which argument?', intents: [] };
    case 'brass_bell':
      if (target === 'trunk') {
        if (inv.includes('silver_key')) return { storyText: ambience.trunkOpen(), intents: [] };
        return {
          storyText: 'You ring the consecrated bell. The harmonic vibration rattles the spirit-ward bound around the trunk, and the chest lid falls open — inside, the SILVER KEY and a flask of oil.',
          intents: [INV_ADD('silver_key'), { type: 'setKey', key: 'silver' }, { type: 'oil', delta: 30 }],
          objective: 'Find the Gold Key in the Fountain Cistern, and learn the house\u2019s true grief to break the pact.'
        };
      }
      return { storyText: 'The bell\u2019s ring is a small defiance in a house that prefers silence. It echoes too long, as if the walls answer it.', intents: [] };
    case 'sacred_ash':
      return genericAsh(state);
    case 'rope':
      return { storyText: 'You uncoil the rope and test its knots. It is sound, or as sound as anything in this house pretends to be.', intents: [] };
    case 'artisan_key':
    case 'ward':
    case 'herbs':
    case 'silk_cloth':
      return { storyText: ambience.holdItem(ITEMS[itemId]?.name), intents: [] };
    case 'incense_of_calm': {
      return {
        storyText: 'You burn the Incense of Calm. The sweet, bitter smoke fills your lungs and the screaming of the house quietens to a mutter. (Sanity +20)',
        intents: [INV_REMOVE('incense_of_calm'), { type: 'sanity', delta: 20 }]
      };
    }
    default:
      return { storyText: 'You turn the thing over in your hands. It offers no obvious use here — yet.', intents: [] };
  }
}

function genericAsh(state) {
  // handled in fountain_cistern; here generic
  return { storyText: ambience.ash(), intents: [] };
}

export function INV_ADD(id) { return { type: 'addItem', item: id }; }
export function INV_REMOVE(id) { return { type: 'removeItem', item: id }; }
