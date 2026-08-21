// Curated riddle catalog — the deterministic fallback and the quality baseline that
// LLM-generated riddles are validated against. Keyed by gate category.
// Each entry: { riddle, answer, variants[], hint }

export const RIDDLE_POOL = {
  shadow: [
    {
      id: 'sh1',
      riddle: 'I follow your steps under the desert sun, yet in the pitch-black night I am gone. I have no weight, no flesh, no sound. What am I?',
      answer: 'shadow',
      variants: ['a shadow', 'the shadow', 'shadows', 'my shadow'],
      hint: 'Think of what the lantern casts behind you.'
    },
    {
      id: 'sh2',
      riddle: 'I flee you at noon and stalk you at dusk; I touch the wall before you do, yet you never feel me. What am I?',
      answer: 'shadow',
      variants: ['a shadow', 'the shadow', 'shadows'],
      hint: 'It is your own darker companion, and it answers to light.'
    }
  ],
  mirror: [
    {
      id: 'mi1',
      riddle: 'I have no voice, yet I speak to your sight; I show your true face, yet create no light. When broken, seven years of sorrow I bring. What am I?',
      answer: 'mirror',
      variants: ['a mirror', 'the mirror', 'mirrors', 'glass', 'looking glass'],
      hint: 'Think of what decorates the Rani\u2019s dressing room.'
    },
    {
      id: 'mi2',
      riddle: 'I hold your every deed and your every flaw, and show them back without judgment. Kings fear me more than the axe. What am I?',
      answer: 'mirror',
      variants: ['a mirror', 'the mirror', 'looking glass'],
      hint: 'The harem is full of broken ones, and each still shows your face.'
    }
  ],
  sword: [
    {
      id: 'sw1',
      riddle: 'I am forged in blistering flames and tempered in oil and ice. I have a sharp tongue that speaks in battle and slumbers in a sheath. What am I?',
      answer: 'sword',
      variants: ['a sword', 'the sword', 'saber', 'blade', 'talwar', 'steel'],
      hint: 'Think of the weapons lining the men\u2019s reception.'
    },
    {
      id: 'sw2',
      riddle: 'My master sleeps when I sleep, and wakes to spill blood at a word. I am a Rajput\u2019s first and final answer. What am I?',
      answer: 'sword',
      variants: ['a sword', 'the sword', 'talwar', 'blade'],
      hint: 'It hangs on the wall, rusted, and dreams of being drawn.'
    }
  ],
  flame: [
    {
      id: 'fl1',
      riddle: 'Feed me dry wood and I live and dance; give me water and I instantly die. What am I?',
      answer: 'fire',
      variants: ['a fire', 'the fire', 'flame', 'flames', 'a flame', 'hearth'],
      hint: 'Think of what once burned in the ancient stoves.'
    },
    {
      id: 'fl2',
      riddle: 'I am born of a spark and end by a sigh. I am a servant that will not be owned. What am I?',
      answer: 'fire',
      variants: ['flame', 'a flame', 'fire'],
      hint: 'The Rasoda\u2019s hearths were its thrones.'
    }
  ],
  water: [
    {
      id: 'wa1',
      riddle: 'I have no legs yet I run forever; I have no mouth yet I murmur deep; I carve mountains of stone yet have no hands. What am I?',
      answer: 'water',
      variants: ['the water', 'a river', 'stream', 'well', 'a well'],
      hint: 'Think of what fills the bottom of the deep stepwell and cistern.'
    },
    {
      id: 'wa2',
      riddle: 'I take the shape of every hand that cups me, yet I belong to no one. I am the door the Yaksha guards. What am I?',
      answer: 'water',
      variants: ['a river', 'the water', 'stream'],
      hint: 'The Fountain Cistern is my body in this house.'
    }
  ],
  light: [
    {
      id: 'li1',
      riddle: 'I am a key that opens no lock, yet every doorway on earth opens for me. I come most willingly to a wick that wants me. What am I?',
      answer: 'light',
      variants: ['a flame', 'fire', 'a lamp', 'the light', 'flame'],
      hint: 'Think of the lantern on your belt and what it truly carries.'
    },
    {
      id: 'li2',
      riddle: 'I am struck from stone and born from oil, and the dark flees me as a coward flees a judge. What am I?',
      answer: 'light',
      variants: ['flame', 'fire', 'a flame', 'the light'],
      hint: 'The descent into the vault is darker than any room above.'
    }
  ],
  celestial: [
    {
      id: 'ce1',
      riddle: 'I am countless, I am ancient, and I am eaten whole by the curse above this roof. Sailors once steered their honest course by me. What am I?',
      answer: 'stars',
      variants: ['the stars', 'star', 'a star', 'constellations', 'the firmament'],
      hint: 'Look at what the oculus refuses to show you.'
    },
    {
      id: 'ce2',
      riddle: 'I burn in the black above though no one lit me, and I measure the hours no clock may keep. What am I?',
      answer: 'stars',
      variants: ['the stars', 'a star'],
      hint: 'The Observatory was built to read them, and they have abandoned this house.'
    }
  ],
  diamond: [
    {
      id: 'di1',
      riddle: 'I am born in the depths of royal greed, cut with precision and coveted by kings. I shine brightest in the dark, but steal the soul of whoever claims me. What am I?',
      answer: 'diamond',
      variants: ['the diamond', 'a diamond', 'star of mewar', 'gem', 'jewel'],
      hint: 'Think of Thakur Vikram Singh\u2019s royal prize.'
    },
    {
      id: 'di2',
      riddle: 'I am a captive star that caged a Djinn; I am the price of a family\u2019s soul. I sit now in the palace of mirrors, waiting. What am I?',
      answer: 'diamond',
      variants: ['the diamond', 'star of mewar', 'gem', 'jewel'],
      hint: 'Its name carries the name of a royal house of the south.'
    }
  ]
};

export function curatedFor(category, seed = 0) {
  const pool = RIDDLE_POOL[category] || RIDDLE_POOL.shadow;
  // Deterministic rotation so a given run re-rolls but a given (category,seed) is stable.
  return pool[(seed % pool.length + pool.length) % pool.length];
}

export function pickRiddle(category, seed = Math.floor(Math.random() * 100)) {
  return curatedFor(category, seed);
}

export function allCurated() {
  return Object.values(RIDDLE_POOL).flat();
}
