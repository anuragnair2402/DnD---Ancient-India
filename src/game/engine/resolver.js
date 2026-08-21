// The Truth Engine's entry point. Takes raw input + state, returns a normalized result
// the UI/AI-director apply. Fully deterministic gameplay, with AI hooks for enrichment.

import { classify, COMMAND } from './parser.js';
import { applyIntents } from './state.js';
import { resolveInteract, resolveCraft, resolveSanity, resolveTalk, resolveGenerate } from './interact.js';
import { ROOMS, GATES, isVeilDoor, sanityTierOf } from '../world/world.js';
import { sanityVignette, randomFallback } from '../world/beats.js';
import { ambientSanityCost, oilCost } from './checks.js';
import { resolveEnding, RESONANCE_PIECES } from './endings.js';
import { itemName } from '../world/items.js';
import { pickRiddle } from '../world/riddles-curated.js';

// Lexical riddle answer match (deterministic). AI judge is a second layer used by the UI.
export function checkRiddleAnswer(instance, answer) {
  const clean = (answer || '').trim().toLowerCase().replace(/^(answer|the|a)\s+/i, '').trim();
  const raw = (answer || '').trim().toLowerCase();
  if (!instance) return { correct: false };
  const pool = [instance.answer, ...(instance.variants || [])];
  for (const a of pool) {
    const c = a.toLowerCase();
    if (clean === c || raw === c || raw.includes(c)) return { correct: true };
  }
  return { correct: false };
}

export function resolveCommand(state, raw, ctx = {}) {
  const cmd = classify(raw);
  const room = ROOMS[state.world.currentRoom];

  // ── 0. Front-gate escape (classic quick win) -------------------
  const escapeInput = ['escape', 'unlock gate', 'open gate', 'unlock gates', 'open gates'];
  if (escapeInput.includes(cmd.input) && state.world.currentRoom === 'front_foyer') {
    const p = state.player;
    const ok = p.keys.bronze && p.keys.silver && p.keys.gold && p.inventory.includes('star_of_mewar');
    if (ok) {
      // gate escape intent flows through the same single surface as everything else
      const r = resolveEnding({ ...state, finale: 'gate' }, null);
      if (r) return { ...emptyResult(), storyText: 'You slide the three keys into the iron gate and step out into the desert night.', finale: r, playMode: 'victory' };
    }
    const missing = [];
    if (!p.keys.bronze) missing.push('Bronze'); if (!p.keys.silver) missing.push('Silver'); if (!p.keys.gold) missing.push('Gold');
    const noStar = !p.inventory.includes('star_of_mewar');
    let why = '';
    if (missing.length > 0 && noStar) {
      why = `; you still lack: ${missing.join(', ')} Key(s), and you do not carry the Star`;
    } else if (missing.length > 0) {
      why = `; you still lack: ${missing.join(', ')} Key(s)`;
    } else if (noStar) {
      why = '; you do not carry the Star of Mewar';
    }
    return { ...emptyResult(), storyText: `The gate will not open for you yet${why}. There is another, deeper way out of this house — but it is harder than the door.`, intents: [], tookTurn: false };
  }

  // ── 0b. Finale choices at the sanctum / resonance ---------------
  const board = ctx.board; // passed when a finale board is active
  if (board && cmd.kind === COMMAND.SYSTEM) {
    const ch = cmd.input;
    if (['banish', 'ally', 'host'].includes(ch)) {
      const ending = resolveEnding(state, ch);
      if (ending) return { ...emptyResult(), storyText: '', finale: ending, playMode: 'victory' };
      return { ...emptyResult(), storyText: 'The covenant is not yet unravelled enough for that choice. You lack the truth this ending demands.', intents: [] };
    }
  }

  switch (cmd.kind) {
    case COMMAND.MOVEMENT: return moveCommand(state, cmd.dir);
    case COMMAND.SYSTEM: return systemCommand(state, cmd);
    case COMMAND.INVENTORY: return systemCommand(state, cmd);
    case COMMAND.SANITY_ACTION: return withTurn(resolveSanity(state, cmd, ctx));
    case COMMAND.CRAFT: return withTurn(resolveCraft(state, cmd));
    case COMMAND.TALK: return withTurn(resolveTalk(state, cmd, ctx));
    case COMMAND.TRADE_ACCEPT: return acceptOffer(state, cmd, ctx);
    case COMMAND.TRADE_DECLINE: return declineOffer(state, ctx);
    case COMMAND.INTERACT: {
      const r = resolveInteract(state, cmd);
      if (r && r.storyText) return withTurn(r);
      if (['examine', 'x', 'inspect', 'search'].includes(cmd.verb)) return withTurn(resolveGenerate(state, cmd));
      return withTurn({ storyText: roomFallback(state), intents: [], cracks: true });
    }
    case COMMAND.GENERATE: return withTurn(resolveGenerate(state, cmd));
    default: break;
  }
  return withTurn({ storyText: roomFallback(state), intents: [] });
}

// ── Movement ─────────────────────────────────────────────────────
// Item / progression-gated doors: 'from->to' -> required item id (or null => blocked by flag)
const DOOR_REQS = {
  'fountain_cistern->charnel_vault': 'ward',
  'fountain_cistern->smugglers_tunnel': 'artisan_key',
  'charnel_vault->djinn_sanctum': 'stone_of_sight',
  'observatory->rooftop': 'rope'
};

function moveCommand(state, dir) {
  const room = ROOMS[state.world.currentRoom];
  const target = room.exits[dir] || room.exits[longDir(dir)];
  if (!target) {
    return { ...emptyResult(), storyText: `You cannot go ${dir} from here.`, intents: [], tookTurn: false };
  }
  if (target === 'smugglers_tunnel' && state.player.flags.tunnel_entered) {
    return { ...emptyResult(), storyText: 'The tunnel entrance is buried under tons of fallen stone. There is no going back that way.', intents: [], tookTurn: false };
  }
  const from = state.world.currentRoom;
  const gate = GATES[`${from}->${target}`];

  // Echo Veil doors require a low sanity tier to perceive/pass
  const veilTier = isVeilDoor(from, target, state);
  if (veilTier) {
    const tier = sanityTierOf(state.player.stats.sanity);
    const needed = veilTier; // 'haunted' | 'fractured'
    const allow = needed === 'haunted' ? ['haunted', 'fractured'].includes(tier) : tier === 'fractured';
    if (!allow) {
      return { ...emptyResult(), storyText: `You strain toward ${ROOMS[target].name}, but for you the door is not there. (This path opens to those who ${needed === 'fractured' ? 'are fully Fractured' : 'have descended into the Sight'}.)`, intents: [], tookTurn: false };
    }
    // veil travel costs sanity (the Sight is not free)
    return doEnter(state, from, target, { veil: true });
  }

  // Item / progression-gated doors
  const req = DOOR_REQS[`${from}->${target}`];
  if (req) {
    if (!state.player.inventory.includes(req)) {
      return { ...emptyResult(), storyText: `The way to ${ROOMS[target].name} is barred. (Requires: ${itemName(req)}.)`, intents: [], tookTurn: false };
    }
  }

  // Riddle gate
  if (gate && !state.world.unlockedGates[`${from}->${target}`]) {
    return requireRiddle(state, from, target, gate);
  }

  // Three-key Mahogany gate + final riddle to Sheesh Mahal
  if (target === 'sheesh_mahal') {
    const keys = state.player.keys;
    if (!(keys.bronze && keys.silver && keys.gold)) {
      const missing = [];
      if (!keys.bronze) missing.push('Bronze'); if (!keys.silver) missing.push('Silver'); if (!keys.gold) missing.push('Gold');
      return { ...emptyResult(), storyText: `The Mahogany Gate to the Sheesh Mahal bears three keyholes (Bronze, Silver, Gold). You are missing: ${missing.join(', ')}.`, intents: [], tookTurn: false };
    }
    if (!state.world.unlockedGates['mardana_wing->sheesh_mahal']) {
      return requireRiddle(state, from, target, GATES['mardana_wing->sheesh_mahal']);
    }
    return doEnter(state, from, target, { intents: [{ type: 'spendKey', key: 'bronze' }, { type: 'spendKey', key: 'silver' }, { type: 'spendKey', key: 'gold' }] });
  }

  return doEnter(state, from, target, {});
}

function longDir(d) {
  const map = { n: 'north', s: 'south', e: 'east', w: 'west', u: 'up', d: 'down',
    nw: 'northwest', sw: 'southwest', ne: 'northeast', se: 'southeast' };
  return map[d] || d;
}

function requireRiddle(state, from, target, gate) {
  const instance = ensureRiddleInstance(state, from, target, gate);
  return {
    ...emptyResult(),
    storyText: `[GATE SEALED: ${gate.name.toUpperCase()}]\nAn ancient ward blocks your path to ${ROOMS[target].name}. A ghostly whisper rises from the stone:\n\n\u201c${instance.riddle}\u201d\n\n(Type the answer to unseal the gate.)`,
    objective: `Solve the riddle of the ${gate.name} to enter ${ROOMS[target].name}.`,
    gateHit: { from, to: target, gateId: `${from}->${target}` },
    riddle: instance,
    tookTurn: false
  };
}

// Ensure a riddle instance exists on state (curated fallback unless AI pre-seeded).
function ensureRiddleInstance(state, from, to, gate) {
  const key = `${from}->${to}`;
  if (state.world.riddleInstances[key]) return state.world.riddleInstances[key];
  const seed = (state.world.runSeed + Object.keys(state.world.riddleInstances).length);
  const r = pickRiddle(gate.category, seed);
  state.world.riddleInstances[key] = { gateId: key, riddle: r.riddle, answer: r.answer, variants: [...r.variants], hint: r.hint, semanticUsed: 0, source: 'curated' };
  return state.world.riddleInstances[key];
}

function doEnter(state, from, target, opts = {}) {
  const room = ROOMS[target];
  const extra = [...(opts.intents || [])];
  let story = `You pass through into ${room.name}.\n\n${room.description}`;
  if (opts.veil) {
    const cost = 4; // a fixed, modest tax for using the Sight (readable, not lethal)
    extra.push({ type: 'sanity', delta: -cost });
    story = `[THE SIGHT PARTS]\n${story}\n\n(Passing through the veil costs you ${cost} sanity.)\n${sanityVignette(sanityTierOf(state.player.stats.sanity))}`;
  }
  if (target === 'sheesh_mahal' && extra.some(i => i.type === 'spendKey')) {
    story = `The three keys — Bronze, Silver, Gold — burn away in the locks as the Mahogany Gate swings wide.\n\n${story}`;
  }
  return {
    ...emptyResult(),
    storyText: story,
    objective: updateObjective(state, target),
    intents: [{ type: 'move', to: target }, ...extra],
    tookTurn: true
  };
}

function updateObjective(state, target) {
  return state.world.objective;
}

// ── System commands ──────────────────────────────────────────────
function systemCommand(state, cmd) {
  const a = cmd.action || cmd.input;
  switch (a) {
    case 'look': case 'l': {
      const room = ROOMS[state.world.currentRoom];
      return { ...emptyResult(), storyText: room.description + (state.world.lastSanityTier !== 'lucid' ? sanityVignette(state.world.lastSanityTier) : ''), intents: [], tookTurn: false };
    }
    case 'inventory': case 'i': {
      const inv = state.player.inventory;
      const text = inv.length ? `You are carrying:\n${inv.map(id => '• ' + itemName(id)).join('\n')}` : 'Your hands are empty.';
      return { ...emptyResult(), storyText: text, intents: [], tookTurn: false };
    }
    case 'stats': case 'status': case 'score': {
      const st = state.player.stats;
      const keys = state.player.keys;
      const pieces = RESONANCE_PIECES.map(p => state.player.rison[p] ? '●' : '○').join(' ');
      return { ...emptyResult(), storyText: `=== EXPLORER RECORD ===\nClass: ${state.player.classId}\nSanity: ${st.sanity}%  Resolve: ${st.resolve}  Perception: ${st.perception}  Courage: ${st.courage}\nOil: ${state.world.oil}%  Turn: ${state.world.turn}/${state.world.maxTurns}\nKeys: ${keys.bronze?'B':'·'}${keys.silver?'S':'·'}${keys.gold?'G':'·'}   Resonance: ${pieces}\nObjective: ${state.world.objective}`, intents: [], tookTurn: false };
    }
    case 'objective': case 'journal': case 'codex': case 'almanac':
      return { ...emptyResult(), storyText: `Objective: ${state.world.objective}`, intents: [], tookTurn: false, flashCodex: a === 'codex' || a === 'almanac' };
    case 'help':
      return { ...emptyResult(), storyText: '', intents: [], tookTurn: false, flashHelp: true };
    case 'restart':
      return { ...emptyResult(), storyText: '', intents: [], tookTurn: false, flashRestart: true };
    default:
      const fb = roomFallback(state);
      const text = (a === 'unknown' && cmd.input) ? `Unrecognized input "${cmd.input}".\n\n${fb}` : fb;
      return { ...emptyResult(), storyText: text, intents: [], tookTurn: false };
  }
}

function roomFallback(state) {
  return randomFallback();
}

// ── Trades ───────────────────────────────────────────────────────
function acceptOffer(state, cmd, ctx) {
  const offer = ctx.pendingOffer;
  if (!offer) return { ...emptyResult(), storyText: 'There is no offer before you to accept.', intents: [] };
  // execute legally through intents
  const intents = [];
  if (offer.given) intents.push({ type: 'removeItem', item: offer.given });
  if (offer.receive) intents.push({ type: 'addItem', item: offer.receive });
  if (offer.sanityCost) intents.push({ type: 'sanity', delta: offer.sanityCost });
  if (offer.flag) intents.push({ type: 'setFlag', flag: offer.flag, value: true });
  intents.push({ type: 'setEntity', entity: 'djinn', prop: 'bargainsDone', value: (state.world.entityStates.djinn.bargainsDone || 0) + 1 });
  const story = offer.acceptText || `The ${offer.byName || 'Djinn'} accepts your part of the bargain and honours theirs.`;
  return { ...emptyResult(), storyText: story, intents, tookTurn: true, offerResolved: true };
}

function declineOffer(state, ctx) {
  if (!ctx.pendingOffer) return { ...emptyResult(), storyText: 'There is no offer to decline.', intents: [] };
  const offer = ctx.pendingOffer;
  const intents = [];
  if (offer.flag) intents.push({ type: 'setFlag', flag: offer.flag, value: true });
  return { ...emptyResult(), storyText: 'You keep your hands and your secrets. The bargain goes unsealed.', intents, tookTurn: true, offerResolved: true };
}

function withTurn(r) {
  if (!r) return emptyResult();
  r.tookTurn = r.tookTurn !== false;
  return r;
}

function emptyResult() {
  return { storyText: '', objective: undefined, intents: [], tookTurn: false, gateHit: null, riddle: null, aiRequest: null, needsJudge: null, pendingOffer: null, parce: null };
}

// ── End-of-turn ambient costs (called by the driver after applying intents) ──
export function ambientCosts(state) {
  return {
    oil: oilCost(state),
    sanity: ambientSanityCost(state)
  };
}
