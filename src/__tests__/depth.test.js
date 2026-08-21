import { describe, it, expect } from 'vitest';
import { GameSession } from '../game/engine/session.js';
import { createInitialState } from '../game/engine/state.js';
import { createDirector } from '../game/ai/director.js';
import { CLASS_STARTERS } from '../game/world/items.js';

function start(cls = 'Mercenary') {
  const st = createInitialState();
  st.player.classId = cls;
  st.player.stats = { ...st.player.stats, ...CLASS_STARTERS[cls], maxSanity: 100 };
  st.player.inventory = [...CLASS_STARTERS[cls].items];
  return new GameSession(st, createDirector({}).hooks);
}

describe('The deeper covenant — full Resonance playthrough (offline)', () => {
  it('gathers all four truths and banishes the Djinn', async () => {
    const s = start('Mercenary');

    // Foyer -> Chowk -> Darbar -> Armory (artisan key + rope)
    await s.submit('open drawer');
    await s.submit('go north'); await s.submit('shadow');
    await s.submit('go north'); await s.submit('flame');
    await s.submit('go east');
    await s.submit('examine toolbox');       // artisan_key
    await s.submit('examine rack');          // rope

    // -> Observatory: element lock => star_chart
    await s.submit('go west');
    await s.submit('go up');
    await s.submit('go up');
    for (const el of ['fire', 'water', 'earth', 'air', 'sky']) await s.submit(`press ${el}`);
    expect(s.state.player.rison.star_chart).toBe(true);

    // Descend into the Sight -> Echo Gallery (true name) while Haunted
    for (let i = 0; i < 4; i++) await s.submit('surrender');
    await s.submit('go up'); await s.submit('stars');     // rooftop riddle gate
    await s.submit('go east');                            // echo_gallery
    await s.submit('drop oil_flask');                     // free a slot
    await s.submit('take scroll');
    expect(s.state.player.rison.true_name).toBe(true);

    // Descend to Chowk, steady the mind, then take the Rani's grief (rattle)
    await s.submit('go south');                           // gallery -> rooftop
    await s.submit('go down'); await s.submit('go down'); // obs, tower
    await s.submit('go down'); await s.submit('go south');// darbar -> chowk
    await s.submit('drop matches');                       // free a slot
    await s.submit('meditate');                           // steadier for the Veil
    await s.submit('go northwest');                       // weeping_garden
    await s.submit('take rattle');
    expect(s.state.player.rison.rattle).toBe(true);

    // -> Rasoda -> Cistern -> Pit (ember)
    await s.submit('go north');                           // garden -> chowk
    await s.submit('go down'); await s.submit('water');   // rasoda
    await s.submit('go east'); await s.submit('light');   // cistern
    await s.submit('go north'); await s.submit('go east');// tunnel -> pit
    await s.submit('drop rope');                          // free a slot
    await s.submit('take ember');
    expect(s.state.player.rison.ember).toBe(true);

    // -> Charnel -> Stone of Sight
    await s.submit('go west');
    await s.submit('drop crowbar');                       // free a slot
    await s.submit('examine stone');
    expect(s.state.player.inventory).toContain('stone_of_sight');

    // -> Sanctum and banish
    await s.submit('go east');                            // charnel -> sanctum
    expect(s.state.world.currentRoom).toBe('djinn_sanctum');

    const out = await s.submit('banish');
    expect(out.playMode).toBe('victory');
    expect(out.finale.key).toBe('banished');
  });

  it('parses JSON with markdown fences or surrounding noise cleanly', () => {
    const { parseJson } = require('../game/ai/providers/gemini.js');
    expect(parseJson('{"riddle": "hello"}')).toEqual({ riddle: 'hello' });
    expect(parseJson('```json\n{"riddle": "hello"}\n```')).toEqual({ riddle: 'hello' });
    expect(parseJson('Here is the output: {"riddle": "hello"} Hope it helps!')).toEqual({ riddle: 'hello' });
  });
});

