// Upper, subterranean, Echo-Veil and finale room handlers.
import { ambience } from './ambience.js';

const ai = (id) => ({ type: 'addItem', item: id });
const si = (d) => ({ type: 'sanity', delta: d });

const ELEMENT_ORDER = ['fire', 'water', 'earth', 'air', 'sky'];

export function deepActions(state, cmd, ctx = {}) {
  const room = state.world.currentRoom;
  const inv = state.player.inventory;
  const verb = cmd.verb || '';
  const target = (cmd.target || '').replace(/[^a-z0-9\s]/g, '').trim();

  switch (room) {
    case 'tower_stair': {
      if (/well|rope/.test(target)) return ropeClimb(state);
      if (/stair|wall|wind/.test(target)) return { storyText: 'The spiral stair climbs through the raw thickness of the tower. The wind sounds like a decision being un-made.', intents: [] };
      break;
    }

    case 'observatory': {
      if (/well|rope/.test(target)) return ropeClimb(state);
      if (/dial|element|shrine|zodiac/.test(target) || ELEMENT_ORDER.some(e1 => target.includes(e1))) return elementLock(state, verb, target);
      if (/lamp|light|constell/.test(target)) return lampsPuzzle(state);
      if (/telescope/.test(target)) return { storyText: 'The great telescope is dead, its lens grey as a closed eye. Whatever it was built to watch has been cancelled from the sky.', intents: [] };
      if (/astrolabe/.test(target)) return { storyText: 'You spin the tarnished astrolabe. It is set to a year you cannot name, pointing at a star that no longer exists.', intents: [] };
      break;
    }

    case 'rooftop': {
      if (/sky|star/.test(target)) return { storyText: 'You stare up into the black. For a heartbeat the black winks — a single star, defiant, before it is swallowed again. It is the Observatory\u2019s doing. The stars answer only to the one who reads them in order.', intents: [] };
      if (/parapet|edge/.test(target)) return { storyText: 'The parapet is low, and the desert rolls away in every direction, black and patient. You are very high up in a house that should not have an upstairs here.', intents: [] };
      break;
    }

    case 'echo_gallery': {
      if (/scroll/.test(target) && ['take', 'get', 'examine', 'read'].includes(verb)) {
        if (inv.includes('true_name_scroll')) return { storyText: 'The brass stand is empty. The true name is already on your person, inscribed in your memory like a small dangerous fire.', intents: [] };
        return {
          storyText: 'You lift the scroll from its brass stand. Red ink, still wet after centuries, spells a name it does not forgive you for reading aloud — even silently. The name of the Djinn. (Read it at the sanctum to unbind the pact.)',
          intents: [ai('true_name_scroll'), { type: 'setFlag', flag: 'learnedDjinnName', value: true }, { type: 'gainResonance', piece: 'true_name' }],
          objective: 'Carry the true name to the Djinn\u2019s Sanctum beneath the house.'
        };
      }
      if (/portrait/.test(target)) return { storyText: 'Portraits of a family you have glimpsed carrying grief for generations. In the last one, a woman in white weeps beside a small jasmine bush.', intents: [] };
      break;
    }

    case 'rasoda_kitchen': {
      if (/cabinet|pantry/.test(target) && verb !== 'use') {
        if (inv.includes('sacred_ash')) return { storyText: 'The pantry cabinet stands open and empty, its urn of Sacred Ash already in your care.', intents: [] };
        return {
          storyText: 'You open the creaking cabinet. Inside a clay urn you find a pouch of SACRED ASH and a flask of Lantern Oil.',
          intents: [ai('sacred_ash'), { type: 'oil', delta: 40 }],
          objective: 'Carry the Sacred Ash to the Fountain Cistern; it will part the Yaksha\u2019s lesser guard for the Gold Key.'
        };
      }
      if (/pot|jar/.test(target)) return { storyText: 'You thrust your hand into a clay pot. A black scorpion stings your finger — burning venom! (Sanity -10)', intents: [si(-10)] };
      if (/stove|hearth/.test(target)) return { storyText: 'Cold iron hearths sit in a row, bearded with generations of grey ash. The priest\u2019s words echo: the house was made Fire, Water, Earth, Air, Sky.', intents: [] };
      break;
    }

    case 'fountain_cistern': {
      const tok = (verb + ' ' + target + ' ' + (cmd.target2 || '')).toLowerCase();
      if (/water|well/.test(target) && !/yaksha/.test(tok)) return { storyText: 'The black water is mirror-still and bottomless. Cupped and drunk, it is pure and cold, steadying you. (Sanity +15)', intents: [si(15)] };
      if (/yaksha|guardian|spirit|ghost/.test(tok)) {
        if (verb === 'use' && tok.includes('ash')) {
          if (!inv.includes('sacred_ash')) return { storyText: 'You have no Sacred Ash. Search the Rasoda pantry cabinet.', intents: [] };
          return {
            storyText: 'You hurl the Sacred Ash across the water. The powder burns the spectral Yaksha with blinding white light — it screeches, dissolves to mist, and drops the GOLD KEY onto the stone landing!',
            intents: [{ 'type': 'removeItem', item: 'sacred_ash' }, ai('gold_key'), { type: 'setKey', key: 'gold' }],
            objective: 'Gather all three keys to open the Sheesh Mahal — or pursue the deeper resonance to break the pact itself.'
          };
        }
        if (verb === 'take' || verb === 'get') {
          if (inv.includes('gold_key')) return { storyText: 'You already hold the Gold Key.', intents: [] };
          return { storyText: 'You reach for the gold light — the Yaksha shrieks and blasts freezing well water into your chest. (Sanity -20)', intents: [si(-20)] };
        }
        if (verb === 'talk' || verb === 'ask') return { hooks: { persona: 'yaksha', mood: 'idle' }, storyText: 'The Yaksha regards you with the patience of water. It will open the deep gate to one who carries the name carved in the vault beneath.', intents: [] };
        return { storyText: 'The Yaksha hovers over the deep, great and patient, clutching a shivering gold light. It is bound by rules older than speech.', intents: [] };
      }
      if (verb === 'use' && (tok.includes('artisan_key') || tok.includes('artisan'))) {
        if (inv.includes('artisan_key')) {
          return { storyText: 'You fit the Artisan\u2019s Key into the smuggler\u2019s grate. It turns with a dry snap, and a dark tunnel opens east. (It will collapse behind you.)', intents: [{ type: 'setFlag', flag: 'tunnel_unlocked', value: true }], objective: 'Descend into the Smuggler\u2019s Tunnel toward the Tamasha Pit.' };
        }
        return { storyText: 'You need the Artisan\u2019s Key from the Armory to turn this grate.', intents: [] };
      }
      if (verb === 'use' && tok.includes('ward')) {
        if (inv.includes('ward')) {
          return { storyText: 'You press the Warding Charm to the ward-sealed door of the Charnel Vault. The seal splits like ice, and the ossuary cold breathes out.', intents: [{ type: 'setFlag', flag: 'charnel_open', value: true }], objective: 'Enter the Charnel Vault and find the Stone of Sight.' };
        }
        return { storyText: 'A Warding Charm (ash + bell) would part the Charnel seal.', intents: [] };
      }
      if (/grate|tunnel|charnel|ward/.test(target) && verb !== 'use') {
        return { storyText: 'The cistern holds two locked ways: east bound by a ward (a Warding Charm parts it), north behind a smuggler\u2019s grate (an Artisan\u2019s Key opens it).', intents: [] };
      }
      break;
    }

    case 'charnel_vault': {
      if (/stone|sight|niche/.test(target) && ['take', 'get', 'examine', 'lift'].includes(verb)) {
        if (inv.includes('stone_of_sight') || state.player.flags.took_stone) return { storyText: 'The niche is empty; the Stone of Sight is already in your keeping. The far wall\u2019s eye-symbol waits for you to see with it.', intents: [] };
        return {
          storyText: 'You lift the cabochon Stone of Sight from the black stone. Held to the eye, it shows the veins of the house — and the hidden seam in the far wall, marked with a symbol like an open eye.',
          intents: [ai('stone_of_sight')],
          objective: 'Use the Stone of Sight to open the hidden seam of the Charnel Vault toward the Djinn\u2019s Sanctum.'
        };
      }
      if (/eye|seam|wall/.test(target) && verb === 'use') {
        if (inv.includes('stone_of_sight')) {
          if (state.world.doors.sanctumReached) return { storyText: 'The seam is already open. The Djinn\u2019s Sanctum waits within.', intents: [] };
          return {
            storyText: 'You press the Stone of Sight to the eye-symbol. The wall dissolves inward like a held breath let go. Beyond lies a chamber that is the mirror of the vault — the DJINN\u2019S SANCTUM.',
            intents: [{ type: 'setDoor', key: 'sanctumReached', value: true }],
            objective: 'Enter the Djinn\u2019s Sanctum and choose how the covenant ends.'
          };
        }
        return { storyText: 'The eye-symbol in the far wall is stubbornly shut. Something is needed to see it open — perhaps a Stone of Sight.', intents: [] };
      }
      break;
    }

    case 'smugglers_tunnel': {
      return { storyText: 'The low tunnel runs east into the dark. Behind you the stone has already slouched shut — there is no going back to the cistern this way.', intents: [], hooks: { tunnelNote: true } };
    }

    case 'tamasha_pit': {
      if (/brazier|coal|ember|fire/.test(target) && ['take', 'get', 'examine', 'reach'].includes(verb)) {
        if (inv.includes('ember') || state.player.flags.took_ember) return { storyText: 'The brazier glows with its undying coal, but its heart — the Ember of the Pit — is already carried by you.', intents: [] };
        return {
          storyText: 'You reach into the eternal fire — it does not burn you, as though it has been waiting for a hand brave enough to take it. You withdraw the EMBER OF THE PIT, hot but harmless.',
          intents: [ai('ember'), { type: 'gainResonance', piece: 'ember' }],
          objective: 'Escape the Pit and carry the Ember onward. Three truths remain: the name, the grief, the sky.'
        };
      }
      if (/pit|stair|wall/.test(target)) return { storyText: 'The great ceremonial pit swallows sound. A stone stair claws back up toward the Charnel level.', intents: [] };
      break;
    }

    case 'sheesh_mahal': {
      if (verb === 'take' || verb === 'get') {
        if (/diamond|star|jewel/.test(target)) {
          if (inv.includes('star_of_mewar')) return { storyText: 'You already hold the Star of Mewar. Flee to the Front Foyer gates.', intents: [] };
          return {
            storyText: 'You seize the legendary STAR OF MEWAR from the onyx pedestal. A deafening ring shakes the palace of mirrors as ten thousand reflections applaud your greed. Flee to the Front Foyer gates and escape!',
            intents: [ai('star_of_mewar')],
            objective: 'Return to the Front Foyer and type ESCAPE with the three keys and the Star — or seek the deeper covenant beneath.'
          };
        }
      }
      if (/mirror|reflection|glass/.test(target)) return { storyText: 'In the infinite mirrors you see your own corpse wandering the house for eternity. (Sanity -15)', intents: [si(-15)] };
      if (/pedestal|diamond|star/.test(target) && verb !== 'take') return { storyText: 'The Star of Mewar rests on the onyx pedestal, a light the size of a heartbeat, waiting to be claimed.', intents: [] };
      break;
    }

    case 'weeping_garden': {
      if (/rattle|earth|ground/.test(target) && ['take', 'get', 'search', 'unearth'].includes(verb)) {
        if (inv.includes('rattle') || state.player.rison.rattle) return { storyText: 'The silver rattle is already gathered. The Rani waits, patient as a held breath, to see what you will do with her son\u2019s voice.', intents: [] };
        return {
          storyText: 'You kneel and brush away the wet earth. A tiny silver rattle — warm as though a small hand just set it down — lies beneath the jasmine. His rattle.',
          intents: [ai('rattle'), { type: 'gainResonance', piece: 'rattle' }],
          objective: 'You hold the Rani\u2019s son\u2019s rattle. You may give it back to her (freeing her grief) or keep it as a part of the covenant\u2019s unraveling. A choice with a cost either way.'
        };
      }
      if (/rani|figure|woman|her/.test(target)) {
        return { hooks: { persona: 'rani', mood: 'idle' }, storyText: 'The Rani kneels by the jasmine, weeping. She looks at your hands, then at your eyes. She has been waiting to see what kind of person broke into her home.', intents: [] };
      }
      break;
    }

    case 'echo_corridor': {
      if (/shrine|god|altar|meditate/.test(target)) {
        if (verb === 'meditate' || verb === 'pray' || /shrine/.test(target)) {
          return { storyText: 'You kneel at the forgotten household shrine. The murmur of the house gentles to a lullaby, and your mind sets like a calm sea. (Sanity +25, 1 turn)', intents: [si(25)] };
        }
        return { storyText: 'A small shrine to a household god nobody remembers greets the weary. Kneeling here steadies a fraying mind.', intents: [] };
      }
      break;
    }

    case 'djinn_sanctum': {
      return finaleCommand(state, verb, target);
    }

    default:
      return null;
  }
  return null;
}

// --- sub-handlers ---
function ropeClimb(state) {
  const hasRope = state.player.inventory.includes('rope');
  if (!hasRope) return { storyText: 'The well is too deep and the walls too sheer to climb without a rope. Something in the Armory might help.', intents: [] };
  return { storyText: 'You secure the rope and climb. Above, against all reason, the rooftop — and a sky that is trying very hard to hide one star from you.', intents: [], hooks: { ropeUsed: true } };
}

function elementLock(state, verb, target) {
  const d = state.world.doors;
  // "press fire" / "use fire key" etc.
  const el = ELEMENT_ORDER.find(e => target.includes(e));
  if (!el) return { storyText: 'The zodiac dial bears five carved symbols: Fire, Water, Earth, Air, Sky. They must be pressed in the order the house was made.', intents: [] };
  const idx = ELEMENT_ORDER.indexOf(el);
  const expected = d.elementOrder.length;
  if (idx !== expected) {
    return { storyText: `You press the ${el} symbol. The dial shudders and resets — ${ELEMENT_ORDER[idx] === el ? 'the wrong element at this step' : 'that is not what the house expects next'}. The order must be Fire, Water, Earth, Air, Sky. (Sanity -4)`, intents: [si(-4), { type: 'setDoor', key: 'elementOrder', value: [] }] };
  }
  const next = [...d.elementOrder, el];
  if (next.length === ELEMENT_ORDER.length) {
    if (state.player.flags.star_chart_known) return { storyText: 'The dial stays aligned in its completed, correct order.', intents: [] };
    return {
      storyText: 'You press the final element. The zodiac dial hums, and a hidden chart slides from the brass housing — the STAR CHART of the pact, mapping the routing of the curse across the house\u2019s fires and mirrors. (Resonance: sky understood.)',
      intents: [{ type: 'setDoor', key: 'elementOrder', value: next }, { type: 'gainResonance', piece: 'star_chart' }, { type: 'setFlag', flag: 'star_chart_known', value: true }],
      objective: 'Three truths remain: the true name, the Ember of the Pit, the Rani\u2019s grief.'
    };
  }
  return { storyText: `${el[0].toUpperCase() + el.slice(1)} locks into place. The dial holds its alignment (${next.length}/5).`, intents: [{ type: 'setDoor', key: 'elementOrder', value: next }] };
}

function lampsPuzzle(state) {
  // constellation order: light the lamps in the order of the hidden star chart (placeholder puzzle:
  // simply requires element lock done + lighting them completes the roof access)
  return { storyText: 'The ring of unlit lamps hangs above the zodiac dial. Of what use are lamps to a sky that has stolen all its stars? Perhaps the dial\u2019s order is the true key.', intents: [] };
}

function finaleCommand(state, verb, target) {
  // At the sanctum: read pact -> context; banish / ally / host choices
  const p = state.player;
  if (/pact|board|inscription|read/.test(target) || verb === 'read') {
    return {
      storyText: 'The onyx board reflects you upside-down. Around its rim, words in the priest\u2019s red hand: "To end the covenant, one must name the Djinn its true name, give it its fire, its grief, and its sky — and then choose. Destroy it. Free it. Or become it." (Type "banish", "ally", or "host" to choose — when you have gathered the truth.)',
      intents: [],
      hooks: { finaleBoard: RESONANCE_CHECK(state) }
    };
  }
  if (verb === 'banish' || verb === 'ally' || verb === 'host') {
    return { hooks: { finaleChoice: verb }, storyText: '', intents: [] };
  }
  return null;
}

export function RESONANCE_CHECK(state) {
  const p = state.player;
  return {
    name: p.rison.true_name || p.flags.learnedDjinnName,
    ember: !!p.rison.ember,
    grief: !!p.rison.rattle,
    sky: !!p.rison.star_chart,
    hasStar: p.inventory.includes('star_of_mewar'),
    hasAllKeys: p.keys.bronze && p.keys.silver && p.keys.gold
  };
}
