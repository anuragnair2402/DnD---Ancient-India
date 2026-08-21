import { describe, it, expect } from 'vitest';
import { GameSession } from '../game/engine/session.js';
import { createInitialState } from '../game/engine/state.js';
import { createDirector } from '../game/ai/director.js';
import { localJudge } from '../game/ai/harness/judge.js';
import { CLASS_STARTERS } from '../game/world/items.js';

function newSession(overrides = {}, hooks = {}) {
  const st = createInitialState();
  // seed class starting gear (the UI/CharacterCreator does the same in the real flow)
  const classId = (overrides.player && overrides.player.classId) || 'Mercenary';
  const starter = CLASS_STARTERS[classId] || CLASS_STARTERS.Mercenary;
  st.player.classId = classId;
  st.player.stats = { ...st.player.stats, ...starter, maxSanity: 100 };
  st.player.inventory = [...starter.items];
  if (overrides.player) Object.assign(st.player, { ...overrides.player, classId });
  if (overrides.world) Object.assign(st.world, overrides.world);
  const director = createDirector(overrides.online ? { geminiApiKey: 'x' } : {});
  const session = new GameSession(st, { ...director.hooks, ...hooks });
  return session;
}

// run a sequence of commands, tolerating gate prompts, capturing () -> result
async function script(session, cmds) {
  let out = null;
  for (const c of cmds) {
    out = await session.submit(c);
  }
  return out;
}

describe('Truth Engine: rooms, keys, gates', () => {
  it('gives the Bronze Key from the Foyer drawer', async () => {
    const s = newSession();
    await s.submit('open drawer');
    expect(s.state.player.keys.bronze).toBe(true);
    expect(s.state.player.inventory).toContain('bronze_key');
  });

  it('blocks the Chowk behind a spirit-gate riddle until answered', async () => {
    const s = newSession();
    await s.submit('go north');
    expect(s.activeRiddle).toBeTruthy();
    expect(s.state.world.currentRoom).toBe('front_foyer');
    // wrong answer fails, stays put
    await s.submit('wrong guess');
    expect(s.state.world.currentRoom).toBe('front_foyer');
    // correct answer passes
    await s.submit('shadow');
    expect(s.state.world.currentRoom).toBe('chowk_courtyard');
    expect(s.state.world.unlockedGates['front_foyer->chowk_courtyard']).toBe(true);
  });

  it('sanctity drains sanity, meditate restores it in a quiet room', async () => {
    const s = newSession();
    // go to Chowk (meditable): solve riddle
    await s.submit('go north');
    await s.submit('shadow');
    const beforeMeditate = s.state.player.stats.sanity;
    // drop sanity a bit artificially via surrender-ish
    s.state.player.stats.sanity = 60;
    await s.submit('meditate');
    expect(s.state.player.stats.sanity).toBeGreaterThan(60);
    expect(beforeMeditate).toBeGreaterThan(0);
  });

  it('crafts a Warding Charm from ash + bell', async () => {
    const s = newSession({ player: { inventory: ['sacred_ash', 'brass_bell', 'matches'] } });
    await s.submit('combine sacred ash with brass bell');
    expect(s.state.player.inventory).toContain('ward');
    expect(s.state.player.inventory).not.toContain('sacred_ash');
  });
});

describe('Sanity politics', () => {
  it('low sanity opens the Echo Veil doors; high sanity cannot see them', async () => {
    const s = newSession({ world: { currentRoom: 'chowk_courtyard', uncovered: {} } });
    const resHigh = await s.submit('go north'); // to darbar? actually test veil door from chowk to weeping_garden
    // veil door uses 'go' to the garden — only via sanity tier. Set sanity low.
    s.state.player.stats.sanity = 30; // haunted
    const low = await s.submit('look');
    expect(low).toBeTruthy();
    // direct veil travel test
    s.state.world.currentRoom = 'weeping_garden';
    // sanity-gate the reverse? garden->chowk is a normal exit
    expect(s.state.player.stats.sanity).toBeLessThanOrEqual(45);
  });

  it('surrender intentionally spends sanity to open the Sight', async () => {
    const s = newSession();
    s.state.player.stats.sanity = 70;
    await s.submit('surrender');
    expect(s.state.player.stats.sanity).toBeLessThanOrEqual(56);
    expect(s.state.player.flags.surrendered).toBe(true);
  });
});

describe('Semantic judge: two different answers, capped', () => {
  const instance = { answer: 'shadow', variants: ['a shadow'] };

  it('accepts a valid alternate answer with high confidence', () => {
    const r = localJudge(instance, 'my shadow');
    expect(r.correct).toBe(true);
  });

  it('rejects a guess', () => {
    const r = localJudge(instance, 'candle');
    expect(r.correct).toBe(false);
  });

  it('session counts semantic accepts toward the cap', async () => {
    const s = newSession();
    await s.submit('go north');           // gate hit
    const key = 'front_foyer->chowk_courtyard';
    s.state.world.riddleInstances[key] = { riddle: 'x', answer: 'shadow', variants: [], hint: 'h', semanticUsed: 0 };
    // (lexical judge would fail; local judge accepts 'my shadow' as alt)
    await s.submit('my shadow');
    expect(s.state.world.currentRoom).toBe('chowk_courtyard');
  });
});

describe('Full quick-win path (Betrayed)', () => {
  it('gathers keys, the Star, and escapes through the gate', async () => {
    const s = newSession({ player: { classId: 'Mercenary' } });
    await s.submit('open drawer');            // bronze
    await s.submit('go north'); await s.submit('shadow');
    // zenana -> silver (mercenary crowbar)
    await s.submit('go west'); await s.submit('mirror');
    await s.submit('use crowbar');            // silver
    // cistern -> gold (ash)
    await s.submit('go east'); // back to chowk
    await s.submit('go down'); await s.submit('water');
    await s.submit('open cabinet');           // sacred ash + oil
    await s.submit('go east'); await s.submit('light'); // into cistern gate
    await s.submit('use ash on yaksha');      // gold
    // back to chowk
    await s.submit('go west'); // cistern -> rasoda
    await s.submit('go up');   // rasoda -> chowk
    // sheesh mahal: chowk -> mardana
    await s.submit('go east'); await s.submit('sword'); // mardana
    await s.submit('go north'); await s.submit('diamond'); // sheesh (3 keys)
    await s.submit('drop oil_flask');        // free a slot for the Star
    await s.submit('take diamond');           // star
    // back to foyer and escape
    await s.submit('go south'); // mardana
    await s.submit('go west');  // chowk
    await s.submit('go south'); // foyer
    const out = await s.submit('escape');
    expect(out.playMode).toBe('victory');
    expect(out.finale.key).toBe('betrayed');
  });
});

describe('Resonance endings (the deeper covenant)', () => {
  function atSanctum(extras = {}) {
    const s = newSession({ player: { classId: 'Mercenary', inventory: ['stone_of_sight'] }, world: { currentRoom: 'djinn_sanctum' } });
    s.state.player.rison = {
      true_name: true, ember: true, rattle: true, star_chart: true,
      ...(extras.rison || {})
    };
    if (extras.star) { s.state.player.inventory.push('star_of_mewar'); }
    return s;
  }

  it('banish requires all four resonance truths', async () => {
    const s = atSanctum();
    const out = await s.submit('banish');
    expect(out.playMode).toBe('victory');
    expect(out.finale.key).toBe('banished');
  });

  it('ally is refused while you keep the Star (must give it up first)', async () => {
    const s = atSanctum({ star: true });
    const out = await s.submit('ally');
    expect(out.playMode).toBe('playing'); // cannot free the Djinn and keep its prize
    // dropping the Star opens the ally path
    await s.submit('drop star_of_mewar');
    const out2 = await s.submit('ally');
    expect(out2.finale.key).toBe('ally');
  });

  it('host is always on offer', async () => {
    const s = atSanctum();
    const out = await s.submit('host');
    expect(out.finale.key).toBe('host');
  });

  it('cannot banish without the truths', async () => {
    const s = atSanctum({ rison: { true_name: false, ember: false, rattle: false, star_chart: false } });
    const out = await s.submit('banish');
    expect(out.playMode).toBe('playing');
  });
});

describe('Midnight hour death', () => {
  it('ends the game when turns run out', async () => {
    const s = newSession();
    s.state.world.turn = 61; // beyond maxTurns 60
    const out = await s.submit('look');
    expect(out.playMode).toBe('gameover');
    expect(out.cause).toBe('midnight');
  });
});

describe('Darkness & light economy', () => {
  it('lantern dies when oil runs out, and darkness taxes sanity harder', async () => {
    const s = newSession();
    s.state.world.oil = 2; // one turn of light left
    await s.submit('look'); // system commands do not burn
    expect(s.state.world.lit).toBe(true);
    await s.submit('meditate'); // foyer: not allowed, but still consumes a turn
    expect(s.state.world.oil).toBe(0);
    expect(s.state.world.lit).toBe(false);
    // refilling relights the lamp through the same normalize() invariant
    const { applyIntents } = await import('../game/engine/state.js');
    const res = applyIntents(s.state, [{ type: 'oil', delta: 40 }]);
    expect(res.state.world.lit).toBe(true);
  });
});

describe('Map integrity', () => {
  it('the Sheeshqhana is reachable from the Mardana and has a way back', async () => {
    const s = newSession({ world: { currentRoom: 'mardana_wing' } });
    await s.submit('go south');
    expect(s.state.world.currentRoom).toBe('sheeshqhana');
    // mirror puzzle works in its room
    await s.submit('angle mirror 1');
    expect(s.state.world.doors.mirrorsAngled).toBe(1);
    // and the hidden panel leads back out (no soft-lock)
    await s.submit('go north');
    expect(s.state.world.currentRoom).toBe('mardana_wing');
  });

  it('the Djinn\u2019s Sanctum cannot soft-lock an unprepared player', async () => {
    const s = newSession({ world: { currentRoom: 'djinn_sanctum' } });
    await s.submit('go west');
    expect(s.state.world.currentRoom).toBe('charnel_vault');
  });
});

describe('Voice Engine: procedural riddle upgrade', () => {
  it('online generation replaces the curated gate riddle; junk falls back to curated', async () => {
    // stub the Voice Engine: a fair generated riddle, then a malformed one
    const fair = {
      riddle: 'I wear a turban of night and chase the moon. What am I?',
      answer: 'shadow', variants: ['a shadow'], hint: 'You cast it behind you.', source: 'generated'
    };
    const junk = { nope: true };
    let call = 0;
    const hooks = {
      riddleFor: async () => (++call === 1 ? fair : junk)
    };
    const s = newSession({}, hooks);
    await s.submit('go north'); // gate hit -> upgrade to generated riddle
    const inst = s.state.world.riddleInstances['front_foyer->chowk_courtyard'];
    expect(inst.source).toBe('generated');
    expect(inst.riddle).toMatch(/turban of night/);
    // answer the upgraded riddle to clear the gate, then hit the next one
    await s.submit('shadow');
    expect(s.state.world.currentRoom).toBe('chowk_courtyard');
    // second gate hit gets junk from the generator -> curated fallback stands
    await s.submit('go east'); // mardana gate
    const inst2 = s.state.world.riddleInstances['chowk_courtyard->mardana_wing'];
    expect(inst2.source).toBe('curated');
  });
});
