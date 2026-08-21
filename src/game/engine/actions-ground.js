// Ground-floor room interaction handlers. Each returns { storyText, intents, objective, hooks }.
import { ITEMS } from '../world/items.js';
import { ambience } from './ambience.js';

export function groundActions(state, cmd, ctx = {}) {
  const room = state.world.currentRoom;
  const inv = state.player.inventory;
  const verb = cmd.verb || '';
  const target = (cmd.target || '');
  const t = target.replace(/[^a-z0-9\s]/g, '').trim();

  switch (room) {
    case 'front_foyer': {
      // open/look/search drawer -> bronze key
      if (/^(open|search|pull|look|examine)$/.test(verb) && /drawer/.test(t)) {
        if (inv.includes('bronze_key')) return { storyText: 'The drawer is already open and empty. The Bronze Key sits in your inventory, doing its quiet work.', intents: [] };
        return {
          storyText: 'You pull open the damp wooden drawer. It creaks loudly, scattering decades of dust. Inside, wrapped in decayed velvet, you find the BRONZE KEY!',
          intents: [{ type: 'addItem', item: 'bronze_key' }, { type: 'setKey', key: 'bronze' }],
          objective: 'Find the Silver and Gold Keys — or better, learn what truly binds this house.'
        };
      }
      if (/portrait|painting/.test(t)) {
        return { storyText: 'The portrait shows Thakur Vikram Singh holding the Star of Mewar. His cold eyes track you. An inscription reads: "Only the worthy who solve the trials of the haveli shall leave with their breath." Under the frame, in a hand too red to be paint: "…and only the truly worthy shall leave with their heart unburdened."', intents: [] };
      }
      if (/plaque|inscription/.test(t)) return { storyText: 'A brass plaque: "This house was bought with a diamond and a silence. Guard it. — V.S."', intents: [] };
      if (/gates|gate|door|exit/.test(t)) return { storyText: 'The iron gates are sealed by a brass lock that will not answer a hand or a keyless word. Three keyholes, though — bronze, silver, gold.', intents: [] };
      break;
    }

    case 'chowk_courtyard': {
      if (/fountain|well/.test(t)) return { storyText: 'The dry fountain is choked with black sand and sun-bleached snake skins. At its base, something scrawled in charcoal: "Five elements answer in the order the house was made: Fire, Water, Earth, Air, Sky."', intents: [] };
      if (/column|pillar|arch/.test(t)) return { storyText: 'The sandstone columns are carved with battle and dance. Sand whistles through the arches like a held breath.', intents: [] };
      if (/sky/.test(t)) return { storyText: 'Above, the desert sky is a black without stars — eaten whole by the curse. No comfort up there. No navigation either.', intents: [] };
      break;
    }

    case 'zenana_wing': {
      const tok = (verb + ' ' + target + ' ' + (cmd.target2 || '')).toLowerCase();
      if (/silk|curtain|drape|cloth/.test(t) && ['take', 'get', 'tear', 'pull'].includes(verb)) {
        if (inv.includes('silk_cloth')) return { storyText: 'You already carry a length of the Zenana\'s silk.', intents: [] };
        return {
          storyText: 'You tear a length of Rajasthani silk from the nearest archway. It comes away with a sigh of dust and old perfume. The SILK CLOTH is yours.',
          intents: [ai('silk_cloth')]
        };
      }
      if (/trunk|chest/.test(tok) || (verb === 'use' && /crowbar|glass|bell|magnify/.test(tok))) {
        if (inv.includes('silver_key')) return { storyText: ambience.trunkOpen(), intents: [] };
        if (verb === 'use') {
          if (tok.includes('crowbar') && inv.includes('iron_crowbar')) {
            return { storyText: 'With a violent heave your crowbar splinters the rusted latch! Inside: the SILVER KEY and a flask of oil.', intents: [ai('silver_key'), { type: 'setKey', key: 'silver' }, { type: 'oil', delta: 30 }], objective: 'Find the Gold Key in the Fountain Cistern.' };
          }
          if ((tok.includes('glass') || tok.includes('magnify')) && inv.includes('magnifying_glass')) {
            return { storyText: 'Through the lens you find a hidden spring pin behind the brass lotus. It snaps open — the SILVER KEY and a flask of oil.', intents: [ai('silver_key'), { type: 'setKey', key: 'silver' }, { type: 'oil', delta: 30 }], objective: 'Find the Gold Key in the Fountain Cistern.' };
          }
          if (tok.includes('bell') && inv.includes('brass_bell')) {
            return { storyText: 'The consecrated bell shatters the spirit-ward around the trunk. Inside: the SILVER KEY and a flask of oil.', intents: [ai('silver_key'), { type: 'setKey', key: 'silver' }, { type: 'oil', delta: 30 }], objective: 'Find the Gold Key in the Fountain Cistern.' };
          }
          return { storyText: 'The heavy iron trunk is locked. A crowbar, a magnifying glass, or a consecrated bell might open it — depending on your hand.', intents: [] };
        }
        if (verb === 'open' || verb === 'examine' || verb === 'look') {
          if (inv.includes('iron_crowbar')) return { storyText: "It's locked solid. Use your crowbar to force it.", intents: [] };
          if (inv.includes('magnifying_glass')) return { storyText: "A hidden mechanism. Use your glass to find the release.", intents: [] };
          if (inv.includes('brass_bell')) return { storyText: "A ward glows around it. Ring your bell to dispel it.", intents: [] };
          return { storyText: 'The heavy iron trunk is locked solid. You will need a crowbar, a lens, or a bell.', intents: [] };
        }
      }
      if (/mirror|glass/.test(t) && verb !== 'use' && !tok.includes('magnify')) return { storyText: 'You peer into the cracked dressing mirror. A pale figure glares back from behind your shoulder before vanishing. (Sanity -10)', intents: [si(-10)] };
      if (/silk|curtain|drape/.test(t)) return { storyText: 'Tattered crimson and gold silks hang from carved archways, thick with the smell of decayed rosewater and dried jasmine.', intents: [] };
      break;
    }

    case 'mardana_wing': {
      if (/desk|scroll|letter|write/.test(t)) return { storyText: 'Inside the teak desk, a brittle scroll from the court priest: "The Yaksha keeps the deep gate closed. It answers only to the name carved in the vault beneath the cistern. Sacred Ash will part its lesser guard. The deeper name, I sealed where I could not forget it."', intents: [] };
      if (/banner|furniture/.test(t)) return { storyText: 'Dust-sheets drape the furniture in patient shapes. They have been waiting a long time to be the shapes of people.', intents: [] };
      break;
    }

    case 'darbar_hall': {
      if (/dais|throne/.test(t)) return { storyText: 'The dais is empty, but the lamplit seat bears a fresh, uncomfortable warmth, as though someone rose from it the moment you entered.', intents: [] };
      if (/mural|painting/.test(t)) return { storyText: 'The murals tell a story of conquest — and at the very edge, a darker panel: a king offering a diamond to a winged shape of fire. The pact, painted in the house\u2019s own bones.', intents: [] };
      if (/priest|figure|man/.test(t)) {
        return { hooks: { persona: 'priest', mood: 'idle' }, storyText: 'A grey figure in tattered saffron crouches near the wall, muttering. He looks up at you with the terrible clarity of the truly mad.', intents: [{ type: 'setFlag', flag: 'priest_lectured', value: true }] };
      }
      break;
    }

    case 'library': {
      if (/book|shelf|manuscript|read/.test(t)) {
        if (state.player.flags.priest_lectured) {
          return { storyText: 'You trace the shelf of sealed grimoires. One, stamped with a horned seal, is titled "Of the Binding of Fire: the True Name of the Djinn." Reading it would be the act of a madman — or the only way to break a pact.', intents: [], hooks: { whisper: 'true_name_hint' } };
        }
        return { storyText: 'The shelves are a graveyard of unfinished thoughts. A bookmark of pressed desert flowers waits in a book on astronomy, pointing you toward the Observatory.', intents: [] };
      }
      break;
    }

    case 'armory': {
      if (/toolbox|box|bench|drawer/.test(t) && verb !== 'use') {
        if (inv.includes('artisan_key')) return { storyText: 'The armourer\u2019s toolbox stands empty, its strange grooved key already in your care.', intents: [] };
        return {
          storyText: 'You pry open the armourer\u2019s toolbox. Among fallen calipers and tangled wire lies an odd, grooved key — the ARTISAN\u2019S KEY, clearly meant for a smuggler\u2019s lock.',
          intents: [ai('artisan_key')],
          objective: 'Use the Artisan\u2019s Key on the grate in the Fountain Cistern to reach the Tamasha Pit.'
        };
      }
      if (/rack|rope|coil/.test(t) && !inv.includes('rope')) {
        return { storyText: 'Coiled against the weapons rack, almost hidden, you find a ROPE — sound enough to trust with the height of the Observatory well.', intents: [ai('rope')], objective: 'Take the rope to the Observatory to climb to the Rooftop.' };
      }
      if (/talwar|sword|blade/.test(t)) return { storyText: 'You touch a rusted talwar. A spectral clash of battle screams through your thoughts. (Sanity -5)', intents: [si(-5)] };
      if (/shield/.test(t)) return { storyText: 'Round hideshields bear the Mewar sunburst, bleached to ghosts by time.', intents: [] };
      break;
    }

    case 'sheeshqhana': {
      return mirrorPuzzle(state, t, verb);
    }

    default:
      return null;
  }
  return null;
}

function ai(id) { return { type: 'addItem', item: id }; }
function si(d) { return { type: 'sanity', delta: d }; }

function mirrorPuzzle(state, t, verb) {
  const d = state.world.doors;
  // three mirrors; angle each with "angle mirror 1|2|3" -> increments counter
  const m = t.match(/mirror\s*([123]|one|two|three)/);
  const which = m ? (['1', 'one'].includes(m[1]) ? 1 : ['2', 'two'].includes(m[1]) ? 2 : 3) : null;
  if (verb === 'angle' && which) {
    if (d.mirrorsAngled >= 3) return { storyText: 'All three mirrors are already angled to their perfect conspiratorial slant.', intents: [] };
    return {
      storyText: `You angle the ${['first', 'second', 'third'][which - 1]} mirror. A shaft of faint, impossible light now threads the room toward the vanity. (${d.mirrorsAngled + 1}/3)`,
      intents: [{ type: 'setDoor', key: 'mirrorsAngled', value: d.mirrorsAngled + 1 }],
      hooks: {}
    };
  }
  if (/vanity|mirror/.test(t) && verb === 'examine') {
    if (d.mirrorsAngled >= 3) {
      if (state.player.flags.mirror_reveal) return { storyText: 'The vanity drawer is open and empty save for a pressed marigold — a gift to the Rani, who is no longer here to receive it.', intents: [] };
      return {
        storyText: 'The three angled mirrors focus the stray light onto the vanity\u2019s secret drawer. It clicks open. Within: a note in the Rani\u2019s hand — "The garden weeps where the jasmine grows. Only the half-mad may enter. Carry him a kindness." And pressed between the pages, a single marigold.',
        intents: [{ type: 'setFlag', flag: 'mirror_reveal', value: true }],
        hooks: { whisper: 'weeping_garden_hint' }
      };
    }
    return { storyText: 'The vanity is cluttered with the ghost of a woman\u2019s life. Three broken mirrors lie where they fell, as if hurled. Angle them all to catch the stray light.', intents: [] };
  }
  return null;
}
