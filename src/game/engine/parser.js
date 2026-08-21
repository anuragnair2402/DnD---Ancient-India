// Command parser: normalizes raw input into a structured command object the resolver
// can act on. Classification is deterministic — the resolver decides truth.

const DIRS = ['north', 'south', 'east', 'west', 'up', 'down', 'n', 's', 'e', 'w', 'u', 'd',
  'northwest', 'southwest', 'northeast', 'southeast', 'nw', 'sw', 'ne', 'se'];

export function normalize(raw) {
  return (raw || '').trim().toLowerCase().replace(/[^a-z0-9\s'_]/g, '').replace(/\s+/g, ' ').trim();
}

export const COMMAND = {
  MOVEMENT: 'movement',
  SYSTEM: 'system',
  RIDDLE_ANSWER: 'riddle_answer',
  CRAFT: 'craft',
  TALK: 'talk',
  TRADE_ACCEPT: 'trade_accept',
  TRADE_DECLINE: 'trade_decline',
  INTERACT: 'interact',
  GENERATE: 'generate',   // free-form examine / gaze / whisper (AI-enhanced, offline fallback)
  SANITY_ACTION: 'sanity_action',
  INVENTORY: 'inventory'
};

export function classify(raw) {
  const input = normalize(raw);
  if (!input) return { kind: COMMAND.SYSTEM, input, action: 'empty' };

  // movement
  if (DIRS.includes(input)) return { kind: COMMAND.MOVEMENT, input, dir: input };
  const moveMatch = input.match(/^(?:go|walk|head|move)\s+(north|south|east|west|up|down|n|s|e|w|u|d|northwest|southwest|northeast|southeast|nw|sw|ne|se)$/);
  if (moveMatch) return { kind: COMMAND.MOVEMENT, input, dir: moveMatch[1] };
  if (input === 'climb') return { kind: COMMAND.SANITY_ACTION, input, action: 'climb' };

  // system
  const sys = ['help', 'restart', 'look', 'l', 'inventory', 'i', 'stats', 'status', 'score', 'objective', 'codex', 'almanac', 'journal'];
  if (sys.includes(input) || input.startsWith('help ')) {
    const act = input.startsWith('help') ? 'help' : (input === 'l' ? 'look' : (input === 'i' ? 'inventory' : input));
    return { kind: COMMAND.SYSTEM, input, action: act };
  }

  // sanity actions
  const san = ['meditate', 'pray', 'surrender', 'gaze', 'whisper', 'vent', 'rest'];
  if (san.includes(input)) return { kind: COMMAND.SANITY_ACTION, input, action: input };

  // accept / decline a pending offer
  if (input === 'accept' || input === 'accept offer' || input.startsWith('accept ')) return { kind: COMMAND.TRADE_ACCEPT, input, target: input.replace(/^accept\s*/, '') };
  if (input === 'decline' || input === 'decline offer' || input.startsWith('decline ')) return { kind: COMMAND.TRADE_DECLINE, input };

  // combine / craft
  const craftMatch = input.match(/^(?:combine|craft|mix|make)\s+(.+)$/);
  if (craftMatch) return { kind: COMMAND.CRAFT, input, parts: craftMatch[1].split(/\s+(?:with|and|&)\s+/) };

  // talk / trade with an entity by name
  const talkMatch = input.match(/^(?:talk|speak|ask|question|appeal|entreat)\s+(?:to\s+|with\s+)?(.+)$/);
  if (talkMatch) return { kind: COMMAND.TALK, input, target: talkMatch[1] };
  const giveMatch = input.match(/^(?:give|offer|present|trade)\s+(.+?)\s+(?:to|with)\s+(.+)$/);
  if (giveMatch) return { kind: COMMAND.TALK, input, itemPhrase: giveMatch[1], target: giveMatch[2], mode: 'give' };

  // generative / sensory — unhandled objects fall through to free-form examine later
  if (input === 'examine' || input === 'inspect') return { kind: COMMAND.GENERATE, input, action: 'examine', target: '' };

  // common interaction verbs
  const inter = ['examine', 'x', 'inspect', 'search', 'take', 'get', 'open', 'use', 'read', 'unlock', 'light', 'strike', 'drink', 'climb', 'press', 'ring', 'angle', 'pull', 'drop', 'throw', 'enter', 'leave', 'return', 'escape'];
  for (const v of inter) {
    if (input.startsWith(v + ' ') || input === v) {
      const rest = input.slice(v.length).trim();
      // "use X on Y" / "use X with Y"
      const useSplit = rest.split(/\s+(?:on|with|in|at)\s+/);
      return {
        kind: COMMAND.INTERACT,
        input,
        verb: v,
        target: rest.split(/\s+(?:on|with|in|at)\s+/)[0] || null,
        target2: useSplit.length > 1 ? useSplit[1] : null
      };
    }
  }

  return { kind: COMMAND.SYSTEM, input, action: 'unknown' };
}
