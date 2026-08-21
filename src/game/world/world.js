// World model: room graph, layered map, gates, secret doors, sanity (Echo Veil) doors,
// and item/puzzle-gated passages. This is pure data + small navigation helpers.
// The Truth Engine (engine/) is the only thing allowed to mutate world/player state.

export const LAYERS = { UPPER: 'upper', GROUND: 'ground', UNDER: 'under', VEIL: 'veil' };

export const ROOMS = {
  // ────────────────────────── GROUND ──────────────────────────
  'front_foyer': {
    id: 'front_foyer', name: 'Front Foyer', layer: LAYERS.GROUND, aura: 4, canMeditate: false,
    description: 'The entrance foyer, grand even in ruin. The iron-studded gates behind you are slammed shut and sealed with a cold brass lock. Dust hangs in the beam of your lantern, thick as incense. North, the Archway of the Desert Sun leads toward the Chowk. A small wooden drawer sits beneath a peeling portrait of the Thakur.',
    exits: { north: 'chowk_courtyard', n: 'chowk_courtyard' },
    objects: ['drawer', 'portrait', 'plaque', 'gates']
  },
  'chowk_courtyard': {
    id: 'chowk_courtyard', name: 'Chowk Courtyard', layer: LAYERS.GROUND, aura: 3, canMeditate: true,
    description: 'The Chowk, an open courtyard ringed by carved sandstone columns. The sky above is a void of black. A dry fountain stands at its heart, choked with desert sand and sun-bleached snake skins. Sealed spirit-gates lead west to the Zenana, east to the Mardana, and north to the Darbar Hall; stone stairs descend into the Rasoda Kitchen.',
    exits: {
      south: 'front_foyer', s: 'front_foyer',
      west: 'zenana_wing', w: 'zenana_wing',
      east: 'mardana_wing', e: 'mardana_wing',
      north: 'darbar_hall', n: 'darbar_hall',
      down: 'rasoda_kitchen', d: 'rasoda_kitchen',
      northwest: 'weeping_garden', nw: 'weeping_garden'
    },
    objects: ['fountain', 'column', 'pillar', 'ground', 'sky'],
    veilExit: { door: 'weeping_garden', tier: 'haunted' }
  },
  'darbar_hall': {
    id: 'darbar_hall', name: 'Darbar Hall', layer: LAYERS.GROUND, aura: 6, canMeditate: true,
    description: 'The Darbar Hall, the throne room where the Thakur once held audience. A lamplit dais sits empty at the far end; faded murals of hunting and conquest stare down. Doors lead south to the Chowk, west into the Library, east into the Armory. A narrow spiral stair climbs toward the tower.',
    exits: { south: 'chowk_courtyard', s: 'chowk_courtyard', west: 'library', w: 'library', east: 'armory', e: 'armory', up: 'tower_stair', u: 'tower_stair' },
    objects: ['dais', 'throne', 'mural', 'stair']
  },
  'library': {
    id: 'library', name: 'Library', layer: LAYERS.GROUND, aura: 5, canMeditate: true,
    description: 'A two-storey library gone to grey. Rotting shelves hold crumbling manuscripts; a reading table is scattered with the bones of an interrupted study. The only exit steps east to the Darbar Hall. Somewhere among the stacks, the air moves where there is no window.',
    exits: { east: 'darbar_hall', e: 'darbar_hall', west: 'echo_corridor', w: 'echo_corridor' },
    objects: ['shelves', 'table', 'books', 'manuscript'],
    veilExit: { door: 'echo_corridor', tier: 'haunted' }
  },
  'armory': {
    id: 'armory', name: 'Armory', layer: LAYERS.GROUND, aura: 2, canMeditate: false,
    description: 'The Armory, hung with rusted talwars and round hideshields. A heavy weapons rack stands against the wall, and a tool bench holds the leavings of a hurried armourer. West leads back to the Darbar Hall; a southern pass links to the Mardana Wing.',
    exits: { west: 'darbar_hall', w: 'darbar_hall', south: 'mardana_wing', s: 'mardana_wing' },
    objects: ['rack', 'bench', 'talwar', 'shield', 'toolbox']
  },
  'mardana_wing': {
    id: 'mardana_wing', name: 'Mardana Wing', layer: LAYERS.GROUND, aura: 5, canMeditate: false,
    description: 'The Mardana, the men\u2019s reception, lined with faded banners and the cold shapes of furniture under dust-sheets. West returns to the Chowk; a corridor runs east into the Armory. North, sealed behind a gate of three keyholes, waits the Sheesh Mahal. A heavy teak writing desk squats in the centre.',
    exits: { west: 'chowk_courtyard', w: 'chowk_courtyard', east: 'armory', e: 'armory', north: 'sheesh_mahal', n: 'sheesh_mahal', south: 'sheeshqhana', s: 'sheeshqhana' },
    objects: ['desk', 'banner', 'furniture', 'chest', 'panel', 'passage']
  },
  'sheeshqhana': {
    id: 'sheeshqhana', name: 'Sheeshqhana (Harem)', layer: LAYERS.GROUND, aura: 8, canMeditate: false,
    description: 'The Sheeshqhana, the private palace of the women of the house. Tattered silk dividers hang in the gloom and the walls are crusted with broken mirrors. A single vanity holds a tarnished hand-mirror and the memory of jasmine. The hidden panel you slipped through leads back north to the Mardana.',
    exits: { north: 'mardana_wing', n: 'mardana_wing' },
    objects: ['vanity', 'mirror', 'divider'],
    puzzle: 'mirror_angle'
  },
  'zenana_wing': {
    id: 'zenana_wing', name: 'Zenana Wing', layer: LAYERS.GROUND, aura: 6, canMeditate: false,
    description: 'The Zenana, the womens\u2019 wing, hung with tattered crimson and gold silk. Faint ghungroo chimes needle the silence. A heavy iron trunk sits locked beneath a stone jharokha window. East returns to the Chowk; in the far corner, behind the drapes, the wall seems thinner than it should.',
    exits: { east: 'chowk_courtyard', e: 'chowk_courtyard', north: 'echo_corridor', n: 'echo_corridor' },
    objects: ['trunk', 'silk', 'mirror', 'dressing table', 'jharokha'],
    veilExit: { door: 'echo_corridor', tier: 'haunted' }
  },
  'sheesh_mahal': {
    id: 'sheesh_mahal', name: 'Sheesh Mahal', layer: LAYERS.GROUND, aura: 9, canMeditate: false,
    description: 'The Palace of Mirrors — thousands of convex mirrors crust every surface, flinging ten thousand versions of you into the dark. On an onyx pedestal at the centre rests the Star of Mewar, a light the size of a heartbeat. The exit lies south, back through the Mahogany Gate.',
    exits: { south: 'mardana_wing', s: 'mardana_wing' },
    objects: ['pedestal', 'mirror', 'reflection'],
    finale: 'star'
  },

  // ────────────────────────── UPPER ──────────────────────────
  'tower_stair': {
    id: 'tower_stair', name: 'Tower Stair', layer: LAYERS.UPPER, aura: 5, canMeditate: false,
    description: 'A narrow spiral stair rising through the thickness of the tower wall. Wind moans down from above, carrying the smell of rain that never comes. Below lies the Darbar Hall; above, after a dizzying climb, the Maharaja\u2019s Observatory.',
    exits: { down: 'darbar_hall', d: 'darbar_hall', up: 'observatory', u: 'observatory' },
    objects: ['stair', 'wall', 'wind']
  },
  'observatory': {
    id: 'observatory', name: 'Maharaja\u2019s Observatory', layer: LAYERS.UPPER, aura: 4, canMeditate: true,
    description: 'The Observatory: an open chamber of brass astrolabes and a huge, dead telescope. The ceiling is a great oculus through which no stars shine \u2014 the curse has eaten them. A stone well, dry as a skull, drops into blackness. A ring of unlit lamps hangs above a carved zodiac dial. The stair descends; a rope could carry you up onto the roof.',
    exits: { down: 'tower_stair', d: 'tower_stair', up: 'rooftop', u: 'rooftop' },
    objects: ['telescope', 'astrolabe', 'well', 'lamp', 'dial', 'zodiac'],
    climbRequires: 'rope',
    puzzle: 'element_lock'
  },
  'rooftop': {
    id: 'rooftop', name: 'Rooftop & the Stars', layer: LAYERS.UPPER, aura: 3, canMeditate: true,
    description: 'The flat roof of the haveli, wind-raked and open to a sky of impossible black. Here, where the house is thinnest, the walls whisper. A parapet rings the edge. Below, through the well, the Observatory waits. In the exact centre, the stars you cannot see are nonetheless \u2014 — present.',
    exits: { down: 'observatory', d: 'observatory', east: 'echo_gallery', e: 'echo_gallery' },
    objects: ['parapet', 'sky', 'well'],
    veilExit: { door: 'echo_gallery', tier: 'haunted' }
  },
  'echo_gallery': {
    id: 'echo_gallery', name: 'Echo Gallery', layer: LAYERS.VEIL, aura: 10, canMeditate: false,
    description: 'An impossible gallery that runs along the roof of a house that has no second floor here \u2014 or rather, it has one, and you are finally seeing it. Portraits hang that you have never seen before. At the far end, a single scroll glows faintly in a brass stand: a True Name, written in ink that never dried.',
    exits: { south: 'rooftop', s: 'rooftop' },
    objects: ['portrait', 'scroll', 'stand'],
    veil: true
  },

  // ────────────────────────── SUBTERRANEAN ──────────────────────────
  'rasoda_kitchen': {
    id: 'rasoda_kitchen', name: 'Rasoda Kitchen', layer: LAYERS.UNDER, aura: 5, canMeditate: false,
    description: 'The Rasoda, the vast subterranean kitchen of the haveli, cold and black with centuries of hearth-grease. Brick ovens gape like mouths. A pantry cabinet stands shut against the wall, and an eastward passage leads toward the cistern. Stone stairs climb back to the Chowk.',
    exits: { up: 'chowk_courtyard', u: 'chowk_courtyard', east: 'fountain_cistern', e: 'fountain_cistern' },
    objects: ['cabinet', 'pantry', 'stove', 'pot', 'jar', 'hearth']
  },
  'fountain_cistern': {
    id: 'fountain_cistern', name: 'Fountain Cistern', layer: LAYERS.UNDER, aura: 7, canMeditate: true,
    description: 'A great cistern fed by a long-dead spring. Black, mirror-still water fills the chamber to the brim, and a spectral guardian \u2014 a Yaksha \u2014 hovers over the deep, clutching a shivering gold light. West is the Rasoda; east, behind a ward-seal, the Charnel Vault; a smuggler\u2019s tunnel lurks behind a rusted grate to the north.',
    exits: { west: 'rasoda_kitchen', w: 'rasoda_kitchen', east: 'charnel_vault', e: 'charnel_vault', north: 'smugglers_tunnel', n: 'smugglers_tunnel' },
    objects: ['water', 'well', 'grate', 'yaksha']
  },
  'charnel_vault': {
    id: 'charnel_vault', name: 'Charnel Vault', layer: LAYERS.UNDER, aura: 9, canMeditate: false,
    description: 'The Charnel Vault, where the bones of the house were laid. Rows of ossuary niches watch you with hollow patience. At the back, on a black stone, lies a cabochon cut from the very heart of the dark: the Stone of Sight. West returns to the cistern; a hidden seam in the far wall bears a symbol like an open eye.',
    exits: { west: 'fountain_cistern', w: 'fountain_cistern', east: 'djinn_sanctum', e: 'djinn_sanctum' },
    objects: ['niche', 'stone', 'ossuary', 'eye']
  },
  'smugglers_tunnel': {
    id: 'smugglers_tunnel', name: 'Smuggler\u2019s Tunnel', layer: LAYERS.UNDER, aura: 6, canMeditate: false,
    description: 'A low, sweating tunnel that once carried salt and stolen gold under the desert. It runs one way, east, into the dark of the Tamasha Pit. Behind you, with a groan of shifting stone, the entrance collapses \u2014 there is no going back the way you came.',
    exits: { east: 'tamasha_pit', e: 'tamasha_pit' },
    objects: ['tunnel', 'rubble', 'wall'],
    oneWay: true
  },
  'tamasha_pit': {
    id: 'tamasha_pit', name: 'Tamasha Pit', layer: LAYERS.UNDER, aura: 8, canMeditate: false,
    description: 'A vast ceremonial pit where once the court staged its entertainments — and its sacrifices. In the centre a coal brazier glows with a fire that should have died centuries ago. At its heart rests the Ember of the Pit. A stone stair claws back up toward the Charnel level.',
    exits: { west: 'charnel_vault', w: 'charnel_vault' },
    objects: ['brazier', 'coal', 'pit', 'stair'],
    entity: 'yaksha'
  },
  'djinn_sanctum': {
    id: 'djinn_sanctum', name: 'Djinn\u2019s Sanctum', layer: LAYERS.UNDER, aura: 12, canMeditate: false,
    description: 'The mirror of the vault, and the true heart of the house. Here the pact was written. In the centre, three braziers hold the fires of three choices, and a smooth onyx board reflects you upside-down. The Djinn is here. It has been waiting longer than you have been alive. The seam you entered through still breathes cold air behind you, west toward the Charnel.',
    exits: { west: 'charnel_vault', w: 'charnel_vault' },
    objects: ['board', 'brazier', 'pact', 'mirror'],
    finale: 'resonance'
  },

  // ────────────────────────── ECHO VEIL ──────────────────────────
  'weeping_garden': {
    id: 'weeping_garden', name: 'The Weeping Garden', layer: LAYERS.VEIL, aura: 8, canMeditate: false,
    description: 'A courtyard garden that the sane cannot see \u2014 dense with dead marigolds and a single living jasmine. At its centre kneels a figure in white whose weeping is older than the sickness in your blood. The Rani. There is a child\u2019s rattle half-buried in the wet earth at the garden\u2019s edge.',
    exits: { north: 'chowk_courtyard', n: 'chowk_courtyard' },
    objects: ['jasmine', 'earth', 'rattle', 'rani'],
    veil: true,
    entity: 'rani'
  },
  'echo_corridor': {
    id: 'echo_corridor', name: 'Echo Corridor', layer: LAYERS.VEIL, aura: 7, canMeditate: true,
    description: 'A narrow, impossible corridor that threads between the Zenana and the Library, unseen by daylight minds. It smells of rain and cold silk, and a small shrine to a forgotten household god stands in an alcove — a place to steady a fraying mind.',
    exits: { west: 'zenana_wing', w: 'zenana_wing', east: 'library', e: 'library' },
    objects: ['shrine', 'alcove', 'god'],
    veil: true
  }
};

// ────────────── Riddle gates (first traversal triggers a spirit-gate riddle) ──────────────
// categoryPool -> world/riddles-curated.js provides curated fallbacks; riddleGen.js remixes.
export const GATES = {
  'front_foyer->chowk_courtyard': {
    id: 'gate_shadow', name: 'Archway of the Desert Sun', category: 'shadow',
    successText: 'The sandstone archway hums with warmth as the ward shatters into golden dust. The path to the Chowk Courtyard opens!'
  },
  'chowk_courtyard->zenana_wing': {
    id: 'gate_mirror', name: 'The Silk Gate of the Lost Rani', category: 'mirror',
    successText: 'A soft chime of silver ghungroos echoes as the silk draperies part. The path to the Zenana Wing is clear!'
  },
  'chowk_courtyard->mardana_wing': {
    id: 'gate_sword', name: 'The Iron Gate of Rajput Warriors', category: 'sword',
    successText: 'With a thunderous ring of phantom steel, the iron gate unlatches. The way to the Mardana Wing swings open!'
  },
  'chowk_courtyard->darbar_hall': {
    id: 'gate_flame', name: 'The Gate of the Smoking Hearth', category: 'flame',
    successText: 'A sudden blast of warm air parts the hanging dust. The Darbar Hall welcomes you with its dead audience.'
  },
  'chowk_courtyard->rasoda_kitchen': {
    id: 'gate_water', name: 'The Stair of Whispering Waters', category: 'water',
    successText: 'The icy mist swirls and parts, revealing the stone stairs descending to the Rasoda Kitchen.'
  },
  'rasoda_kitchen->fountain_cistern': {
    id: 'gate_lamp', name: 'The Hearth Gate of the Vault', category: 'light',
    successText: 'The thick subterranean cobwebs burn away at a gesture of warmth. The corridor to the Fountain Cistern lies open.'
  },
  'observatory->rooftop': {
    id: 'gate_star', name: 'The Gate of the Devoured Stars', category: 'celestial',
    successText: 'The zodiac dial hums as every carved symbol aligns at once. Above, the dead sky accepts a living climber.'
  },
  'mardana_wing->sheesh_mahal': {
    id: 'gate_diamond', name: 'The Cursed Mahogany Gate', category: 'diamond',
    successText: 'All three locks click in harmonic unison. The massive mahogany door groans and swings wide, revealing the blinding Sheesh Mahal!'
  }
};

// Gates that additionally gate on possession of ritual pieces (resonance items).
export const RESONANCE_REQUIREMENTS = {
  'charnel_vault->djinn_sanctum': ['stone_of_sight']
};

// Door kinds / requirement helpers ---------------------------------------------
export function hasGate(from, to) {
  return Object.prototype.hasOwnProperty.call(GATES, `${from}->${to}`);
}

export function isVeilDoor(from, to, state) {
  const room = ROOMS[from];
  if (room && room.veilExit && room.veilExit.door === to) {
    return room.veilExit.tier; // 'haunted' | 'fractured'
  }
  return false;
}

export function sanityTierOf(sanity) {
  if (sanity >= 70) return 'lucid';
  if (sanity >= 45) return 'unsettled';
  if (sanity >= 20) return 'haunted';
  return 'fractured';
}
