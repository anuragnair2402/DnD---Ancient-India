// Items catalog, combine recipes, and item APIs for the Truth Engine + Voice Engine bargains.
// item ids are stable keys used across state, engine, ai harness, and UI.

export const ITEM_API = {
  addInv: 'addItem',
  removeInv: 'removeItem'
};

// ---------- Item definitions ----------
// Each item: { id, name, kind, desc, combineWith?, yields?, usedOn?, consumable? }
export const ITEMS = {
  bronze_key: { id: 'bronze_key', name: 'Bronze Key', kind: 'key', desc: 'A corroded bronze key that smells of old iron and desert rain.' },
  silver_key: { id: 'silver_key', name: 'Silver Key', kind: 'key', desc: 'A silver key chased with the Mewar sunburst, cool to the touch.' },
  gold_key:   { id: 'gold_key',   name: 'Gold Key',   kind: 'key', desc: 'A heavy gold key that seems to hum with a faint, patient heat.' },

  matches:         { id: 'matches',         name: 'Matches',         kind: 'tool', desc: 'A nearly-empty box of sulfur matches. A tiny, certain claim against the dark.' },
  oil_flask:       { id: 'oil_flask',       name: 'Oil Flask',       kind: 'fuel', desc: 'A clay flask of rendered lamp oil. Your lantern drinks greedily.' },
  magnifying_glass:{ id: 'magnifying_glass',name: 'Magnifying Glass',kind: 'tool', desc: 'A brass-rimmed lens that finds what the naked eye refuses.' },
  old_journal:     { id: 'old_journal',     name: 'Old Journal',     kind: 'lore', desc: 'The research notes of a collector who came before you. Margins full of hands.' },
  iron_crowbar:    { id: 'iron_crowbar',    name: 'Iron Crowbar',    kind: 'tool', desc: 'A curved bar of honest violence. It settles arguments with locked things.' },
  brass_bell:      { id: 'brass_bell',      name: 'Brass Bell',      kind: 'ritual', desc: 'A consecrated bell. Its ring has weight the dead can feel.' },
  sacred_ash:      { id: 'sacred_ash',      name: 'Sacred Ash',      kind: 'ritual', desc: 'Ash from a priest\u2019s hearth fire. It carries memory of flame.' },
  rope:            { id: 'rope',            name: 'Rope',            kind: 'tool', desc: 'A coiled hemp rope, frayed but stubborn. Found coiled in the Armory.' },
  artisan_key:     { id: 'artisan_key',     name: 'Artisan\u2019s Key', kind: 'key', desc: 'A strange, grooved key for a smuggler\u2019s lock, left among the armory tools.' },
  herbs:           { id: 'herbs',           name: 'Dried Herbs',     kind: 'alchemy', desc: 'Datura, marigold, and something bitter you cannot name. The Rani\u2019s garden grows them.' },
  silk_cloth:      { id: 'silk_cloth',      name: 'Silk Cloth',      kind: 'alchemy', desc: 'A torn length of Rajasthani silk, still faintly perfumed.' },
  rattle:          { id: 'rattle',          name: 'Child\u2019s Rattle', kind: 'relic', desc: 'A tiny silver rattle, warm as though a small hand just set it down.' },

  ward:            { id: 'ward',            name: 'Warding Charm',   kind: 'crafted', desc: 'Ash pressed into a bell-tone ring. The dead give it a wide berth.' },
  incense_of_calm: { id: 'incense_of_calm', name: 'Incense of Calm', kind: 'crafted', desc: 'Herbs sewn into silk. Burn it to quiet the screaming of the house.' },
  star_of_mewar:   { id: 'star_of_mewar',   name: 'Star of Mewar',   kind: 'relic', desc: 'The diamond that caged a Djinn. Light swims inside it like a captured storm.' },
  true_name_scroll:{ id: 'true_name_scroll',name: 'True-Name Scroll',kind: 'lore', desc: 'A brittle scroll bearing the Djinn\u2019s true name, written in red ink that never dried.' },
  ember:           { id: 'ember',           name: 'Ember of the Pit',kind: 'relic', desc: 'A coal that never cools, plucked from the Tamasha Pit. It whispers in a language of heat.' },
  stone_of_sight:  { id: 'stone_of_sight',  name: 'Stone of Sight', kind: 'relic', desc: 'A cabochon cut from the Charnel\u2019s heart. Held to the eye, it shows the veins of the house.' }
};

// What a fresh character starts with per class.
export const CLASS_STARTERS = {
  Antiquarian:       { resolve: 7,  perception: 15, courage: 8, terror: 10, items: ['magnifying_glass', 'old_journal', 'matches'] },
  'Exorcist (Tantrik)': { resolve: 8, perception: 9, courage: 15, terror: 10, items: ['sacred_ash', 'brass_bell', 'matches'] },
  Mercenary:         { resolve: 15, perception: 8, courage: 7, terror: 10, items: ['iron_crowbar', 'matches', 'oil_flask'] }
};

// ---------- Combine recipes ----------
// { id, a, b, yields, requiresFlag?, story }
export const RECIPES = [
  {
    id: 'craft_ward',
    a: 'sacred_ash',
    b: 'brass_bell',
    consumes: ['sacred_ash', 'brass_bell'],
    yields: 'ward',
    story: 'You press the Sacred Ash into the cup of the brass bell and intone the words you half-remember. The ash fuses to the metal in a ring of soot and silence. A Warding Charm hangs in your hand, and the air around it goes respectfully still.'
  },
  {
    id: 'craft_incense',
    a: 'herbs',
    b: 'silk_cloth',
    consumes: ['herbs', 'silk_cloth'],
    yields: 'incense_of_calm',
    story: 'You crush the herbs into the fold of raw silk and knot it shut. The Incense of Calm is ready — it will quiet a mind that the mansion is slowly unstitching.'
  },
  {
    id: 'refill_oil',
    a: 'oil_flask',
    b: 'lantern',
    consumes: ['oil_flask'],
    yields: null, // side effect: +oil handled by engine
    oilChange: 40,
    story: 'You pour the rendered oil into the brass lantern. It drinks deep and steadies into a calm, hungry flame. (Oil +40)'
  }
];

// Resolve a combine command. Returns {yields, consumes, oilChange, story} or null if invalid.
export function resolveRecipe(iventory, a, b) {
  const names = [a, b].sort();
  for (const r of RECIPES) {
    const needed = [r.a, r.b].sort();
    if (names[0] === needed[0] && names[1] === needed[1]) {
      const hasAll = r.consumes.every(id => iventory.includes(id));
      if (hasAll) return r;
    }
  }
  return null;
}

export function itemName(id) {
  return ITEMS[id] ? ITEMS[id].name : id;
}

export function itemIdFromName(name) {
  const n = name.trim().toLowerCase().replace(/^(the|a|an|my)\s+/i, '').trim();
  if (!n) return null;
  // exact, then token/substring (lenient so "crowbar" -> iron_crowbar, "ash" -> sacred_ash)
  for (const id of Object.keys(ITEMS)) {
    if (ITEMS[id].name.toLowerCase() === n) return id;
    if (id === n) return id;
  }
  for (const id of Object.keys(ITEMS)) {
    const nm = ITEMS[id].name.toLowerCase();
    const words = nm.split(/\W+/).filter(w => w.length >= 3);
    if (words.some(w => w === n)) return id;
    if (id.split('_').includes(n)) return id;
  }
  return null;
}
