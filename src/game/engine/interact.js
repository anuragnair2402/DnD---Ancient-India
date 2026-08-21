// Non-movement command resolution: room interactions, generic item use, crafting,
// entity talk, sanity actions, and free-form examine. All deterministic with AI hooks.
import { groundActions } from './actions-ground.js';
import { deepActions } from './actions-deep.js';
import { genericUse } from './actions.js';
import { resolveRecipe } from '../world/items.js';
import { cannedLine } from '../world/entities.js';
import { randomDecoy, genericExamine, sanityVignette } from '../world/beats.js';
import { ventureMadness } from './checks.js';
import { itemIdFromName } from '../world/items.js';
import { ROOMS } from '../world/world.js';

export function resolveInteract(state, cmd) {
  const room = state.world.currentRoom;
  // room-specific handlers first
  let r = groundActions(state, cmd) || deepActions(state, cmd);
  if (r) return finalize(r);

  // generic item use (carried items used on a target)
  if (cmd.verb === 'use') {
    const id = itemIdFromName(cmd.target || '');
    if (state.player.inventory.includes(id)) {
      const g = genericUse(state, id, cmd.target2 || cmd.target, cmd);
      if (g) return finalize(g);
    }
  }

  // verbs that need something concrete but nothing matched
  if (cmd.verb === 'drop') {
    const id = itemIdFromName(cmd.target || '');
    if (state.player.inventory.includes(id)) {
      return finalize({ storyText: `You set down the ${id.replace(/_/g, ' ')} and feel its absence as a small relief.`, intents: [{ type: 'removeItem', item: id }] });
    }
    return finalize({ storyText: `You are not carrying anything called "${cmd.target || 'that'}".` });
  }
  if (cmd.verb === 'take') {
    return finalize({ storyText: `There is no ${cmd.target || 'that'} here to take.` });
  }
  if (cmd.verb === 'open') {
    return finalize({ storyText: `You study the ${cmd.target || 'object'} for a way in, but it offers you nothing.` });
  }
  if (cmd.verb === 'read') {
    return finalize({ storyText: `There is nothing to read about ${cmd.target || 'that'} here.` });
  }
  if (cmd.verb === 'escape') {
    return { aiRequest: null, storyText: 'Escape requires the three keys in hand and the Star carried — or a truth deeper than gold.', intents: [] };
  }
  return null;
}

export function resolveCraft(state, cmd) {
  const p = state.player;
  // map phrase parts to item ids
  const parts = (cmd.parts || []).map(x => itemIdFromName(x));
  const [a, b] = parts;
  const recipe = resolveRecipe(p.inventory, a, b);
  if (!recipe) {
    return finalize({ storyText: 'You cannot combine those. (Try "combine sacred ash with brass bell", "combine herbs with silk cloth", or "combine oil flask with lantern".)' });
  }
  const intents = (recipe.consumes || []).map(id => ({ type: 'removeItem', item: id }));
  if (recipe.yields) {
    intents.push({ type: 'addItem', item: recipe.yields });
    if (!p.craftKnowledge.includes(recipe.id)) intents.push({ type: 'learnCraft', recipe: recipe.id });
  } else if (recipe.oilChange) {
    intents.push({ type: 'oil', delta: recipe.oilChange });
  }
  const extra = recipe.oilChange && !recipe.yields ? ` (Oil +${recipe.oilChange})` : '';
  return finalize({ storyText: recipe.story + extra, intents, objective: undefined });
}

export function resolveSanity(state, cmd, ctx = {}) {
  const a = cmd.action;
  const st = state.player.stats;
  const room = state.world.currentRoom;

  if (a === 'meditate' || a === 'pray' || a === 'rest') {
    const can = ROOMS[room]?.canMeditate;
    if (!can) {
      return finalize({ storyText: 'You close your eyes and try to still your mind. The house does not allow it here — every corner presses in like a held scream. (Move to a quiet room, like the Courtyard, Library, Observatory, or Cistern.)' });
    }
    return finalize({ storyText: 'You sit and breathe. The pounding of the house recedes to a dull roar; for a few stolen moments you are simply a person again. (Sanity +18, 1 turn)', intents: [{ type: 'sanity', delta: 18 }] });
  }
  if (a === 'surrender') {
    if (st.sanity <= 45) {
      return finalize({
        storyText: 'You let the veil of reason slip. The Sight floods in — the Echo Veil doors of this house now stand open to you, if you choose to pass through them. Your grip on yourself loosens. (Sanity -15) ' + sanityVignette('haunted'),
        intents: [{ type: 'sanity', delta: -15 }, { type: 'setFlag', flag: 'surrendered', value: true }]
      });
    }
    // can surrender to drop into Unsettled too
    return finalize({
      storyText: 'You allow the edge of your sanity to blunt on purpose. The house hums in anticipation. (Sanity -15)\n\n' + sanityVignette(st.sanity - 15 <= 45 ? 'haunted' : 'unsettled'),
      intents: [{ type: 'sanity', delta: -15 }, { type: 'setFlag', flag: 'surrendered', value: true }]
    });
  }
  if (a === 'gaze') {
    const tier = st.sanity <= 20 ? 'fractured' : st.sanity <= 45 ? 'haunted' : 'lucid';
    if (tier === 'lucid') {
      return finalize({ storyText: 'You strain to see what lies beneath the house\u2019s surface. Nothing — your own quiet sanity is the door that is closed to you. To see the other rooms, you must be willing to pay in sanity (try "surrender").' });
    }
    if (tier === 'haunted') {
      return finalize({ storyText: 'You focus your Sight through the cold air. Veins of impossible doorways pulse along the walls — the Weeping Garden, the Echo Corridor, gallery above the roof. They are real. They are here. You could walk into them.', intents: [{ type: 'setFlag', flag: 'sighted', value: true }] });
    }
    return finalize({ storyText: 'You let the Sight run deep. The house becomes a map of memory and wound. Near the roof, in the gallery that should not exist, a scroll glows with a name. Go there, if you have the nerve.', intents: [{ type: 'setFlag', flag: 'sighted', value: true }, { type: 'setFlag', flag: 'deep_sighted', value: true }] });
  }
  if (a === 'whisper') {
    if (st.sanity > 45) {
      return finalize({ storyText: 'You whisper a question into the dark. The house does not answer those who are still too sane to be trusted.', intents: [] });
    }
    return finalize({
      storyText: 'You whisper into the seams of the house. It answers in voices — fragments of the pact, a pressed marigold, a jasmine garden, a name in red ink. The deeper your madness, the more honest its answers. (The house remembers you whispered.)',
      intents: [{ type: 'setFlag', flag: 'whispered', value: true }]
    });
  }
  if (a === 'vent' || a === 'climb') {
    const v = ventureMadness(state);
    return finalize({ storyText: v.storyText, intents: v.intents });
  }
  return null;
}

export function resolveTalk(state, cmd, ctx = {}) {
  // map spoken target names to entity ids
  const raw = (cmd.target || cmd.target2 || '').toLowerCase();
  const entities = { djinn: /djinn|spirit|fire|demon|star/.test(raw) && /djinn|star/.test(raw), rani: /rani|woman|her|queen|figure/.test(raw), yaksha: /yaksha|guardian/.test(raw), priest: /priest|saffron|mad/.test(raw), thakur: /thakur|ghost|king/.test(raw) };
  let ent = null;
  for (const k of Object.keys(entities)) if (entities[k]) { ent = k; break; }
  if (!ent) ent = 'djinn'; // default: address the Djinn

  const line = cannedLine(ent, 'idle');
  return finalize({
    storyText: line ? `\u201c${line}\u201d` : '',
    intents: [],
    aiRequest: { type: 'persona', entity: ent, mood: 'idle', context: { room: state.world.currentRoom, sanity: state.player.stats.sanity, flags: state.player.flags } }
  });
}

// Deterministic free-form examine; the AI (narrate) may replace/append the prose.
export function resolveGenerate(state, cmd) {
  const room = state.world.currentRoom;
  const decoys = (state.world.lastSanityTier === 'haunted' || state.world.lastSanityTier === 'fractured');
  return finalize({
    storyText: decoys ? randomDecoy().onExamine : genericExamine(),
    intents: decoys ? [{ type: 'sanity', delta: -5 }] : [],
    aiRequest: {
      type: 'narrate',
      room,
      roomName: ROOMS[room]?.name,
      target: cmd.target,
      tier: state.world.lastSanityTier,
      roomDesc: ROOMS[room]?.description
    }
  });
}

function finalize(r) {
  if (!r) return null;
  r.tookTurn = true;
  r.intents = r.intents || [];
  return r;
}
