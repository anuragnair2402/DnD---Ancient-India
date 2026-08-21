// Multiple Resonance endings + run scoring. Determines which of the finale conditions
// the current state satisfies and produces the narrative + score.

export const ENDINGS = {
  betrayed: {
    key: 'betrayed',
    title: 'THE WEIGHT OF GOLD',
    tone: 'dark-gold',
    text: 'You did not understand the house, and it let you leave thinking you had won.\n\nThe three keys turn in the front gate \u2014 bronze, silver, gold \u2014 and the iron swings wide. You stumble out into the cool desert with the Star of Mewar clutched to your chest, a diamond that caged a Djinn and a family\u2019s soul, now yours.\n\nBehind you, the haveli is silent. If you listen very carefully, as you cross the first dune, you can hear the Rani begin to weep again \u2014 louder now, keener, as though she finally has an audience. The Star weighs a little more with every step. It always will.\n\nThe curse did not end. It found a new carrier.'
  },
  banished: {
    key: 'banished',
    title: 'THE COVENANT BROKEN',
    tone: 'gold',
    text: 'You gathered every thread the house tried to hide \u2014 the Djinn\u2019s true name, the Ember of the Pit, the Star\u2019s own chart, and the Rani\u2019s long-buried grief. In the sanctum that mirrors the vault, you speak the name and feed it to the three fires.\n\nWith a sound like a grand bell cracking, the pact that bound the Djinn to the diamond shatters. The mirrors of the house go dark all at once, and the Star of Mewar falls to dust in your palm. The haveli exhales \u2014 a held breath, finally released.\n\nThe sun rises over a house that is only a house again. You walk out a grown man with empty hands and a whole heart. Somewhere behind you, the Rani\u2019s weeping stops.'
  },
  ally: {
    key: 'ally',
    title: 'THE DJINN UNBOUND',
    tone: 'blue',
    text: 'The rarest of the house\u2019s endings: you freed the Djinn not by destroying the pact, but by completing it with grace.\n\nYou give the Star of Mewar back to the one who was bound inside it. The Djinn steps out of the diamond like a flame leaving a coal, and for one moment it is simply grateful. It names you its equal, which for a Djinn is the highest price it can pay, paid freely.\n\nYou leave with nothing but the true names of every spirit of the house \u2014 which is to say, you leave with everything. The haveli does not haunt you. You have become the one person it will remember in peace.'
  },
  host: {
    key: 'host',
    title: 'THE NEW THAKUR',
    tone: 'red',
    text: 'In the sanctum, you make the offer no one else has dared: you will take the curse into yourself.\n\nThe Djinn regards you for a long, measuring silence. Then it bows. \u201cA house must have a keeper. Very well, mortal \u2014 keep it well.\u201d The covenant passes from the walls into your blood like the cold of a desert night.\n\nThe gates stand open, and for the first time nothing holds you. But as you step outside, you notice the shadows of the house are a little longer than they should be \u2014 and they are following you, loyal as hounds.\n\nYou have escaped the mansion. You have simply not left it behind.'
  }
};

export const RESONANCE_PIECES = ['true_name', 'ember', 'rattle', 'star_chart'];

// Decide the ending. `choice` is a forced player intent when standing at a finale board.
// Returns { key, title, tone, text, score } or null if the current state satisfies no finale.
export function resolveEnding(state, choice = null) {
  const p = state.player;
  const hasAllKeys = p.keys.bronze && p.keys.silver && p.keys.gold;
  const hasStar = p.inventory.includes('star_of_mewar');
  const resonance = RESONANCE_PIECES.every(k => p.rison[k]);

  // At the sanctum the player explicitly chooses among banished/ally/host once the
  // covenant is understood; physical escape with Star = betrayed.
  if ((choice === 'banished' || choice === 'banish') && resonance) return decorate('banished', state);
  if (choice === 'ally' && resonance && !hasStar) return decorate('ally', state);
  if (choice === 'host') return decorate('host', state);

  // Classic quick win: keys + Star through the front gate.
  if (hasAllKeys && hasStar && (state.finale === 'gate')) return decorate('betrayed', state);

  return null;
}

function decorate(key, state) {
  const e = ENDINGS[key];
  const moves = state.world.turn;
  const score = Math.max(0, 2000 - moves * 5 - (100 - state.player.stats.sanity));
  return { key, title: e.title, tone: e.tone, text: e.text, score, moves };
}

// Score a non-finale end (sanity death / midnight hour). Lower is worse.
export function scoreAbandoned(state, cause) {
  const base = cause === 'midnight' ? 100 : 0;
  const disc = Object.keys(state.player.rison).length;
  return base + disc * 50 + Math.max(0, state.world.turn);
}
