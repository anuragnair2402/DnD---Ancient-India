// Meta-progression: persistent almanac/bestiary of discoveries between runs + the
// Higher Resonance (New Game+) modifier. Stored in localStorage — lightweight and safe.

const KEY = 'dndang_haven_almanac_v1';

export function loadAlmanac() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || defaultAlmanac();
  } catch (e) {
    return defaultAlmanac();
  }
}

export function defaultAlmanac() {
  return {
    roomsSeen: [],
    endings: [],          // ending keys unlocked
    memories: [],         // echo vignette memory ids
    discoveryCount: 0,
    bestScore: 0,
    runs: 0,
    higherResonance: false
  };
}

export function saveAlmanac(a) {
  try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) { /* ignore */ }
}

export function recordRun(a, { endings, roomIds, score, memories }) {
  const next = { ...a };
  next.runs = (next.runs || 0) + 1;
  for (const e of endings || []) if (!next.endings.includes(e)) next.endings.push(e);
  for (const r of roomIds || []) if (!next.roomsSeen.includes(r)) next.roomsSeen.push(r);
  for (const m of memories || []) if (!next.memories.includes(m)) next.memories.push(m);
  if (score && score > (next.bestScore || 0)) next.bestScore = score;
  next.discoveryCount = next.roomsSeen.length + next.memories.length;
  return next;
}

export function toggleHigherResonance(a) {
  return { ...a, higherResonance: !a.higherResonance };
}

// Echo vignettes shown on the title screen once unlocked.
export const ECHO_MEMORIES = {
  rani: { title: 'The Rani\u2019s Grief', text: 'She waits by the jasmine with her son\u2019s rattle held in prayer. Some griefs are the only company a house keeps.' },
  priest: { title: 'The Ink That Bound It', text: 'A saffron-robed man writes a name he was never meant to write. He has been writing it for three hundred years.' },
  djinn: { title: 'The Star\u2019s Prisoner', text: 'Inside the diamond, a shape of patient fire watches the world and waits to be asked a question it will enjoy answering.' },
  thakur: { title: 'The Keeper\u2019s Pride', text: 'He bought his dynasty for a stone and called it fate. The stone remembers the price better than he does.' },
  betrayal: { title: 'The Weight of Gold', text: 'Some escapes are just relocations of the curse. The Star always finds a new pocket.' }
};

export function almanacToPrompt(a) {
  return `Runs:${a.runs} Rooms:${a.roomsSeen.length} Memories:${a.memories.length} Endings:${a.endings.join(',')} HigherResonance:${a.higherResonance}`;
}
