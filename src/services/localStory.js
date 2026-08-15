// Fallback Offline Branching Narrative Database & Riddle Engine for Mansion Escape

export const GATES = {
  "Front Foyer->Chowk Courtyard": {
    id: "foyer_chowk",
    name: "Archway of the Desert Sun",
    riddle: "I follow your steps under the desert sun, yet in the pitch-black night I am gone. I have no weight, no flesh, no sound. What am I?",
    answers: ["shadow", "a shadow", "the shadow", "shadows"],
    hint: "Think of what the lantern casts behind you.",
    successText: "The sandstone archway hums with warmth as the glowing ward shatters into golden dust. The path to the Chowk Courtyard opens!"
  },
  "Chowk Courtyard->Zenana Wing": {
    id: "chowk_zenana",
    name: "The Silk Gate of the Lost Rani",
    riddle: "I have no voice, yet I speak to your sight; I show your true face, yet create no light. When broken, seven years of sorrow I bring. What am I?",
    answers: ["mirror", "a mirror", "the mirror", "mirrors", "glass", "looking glass"],
    hint: "Think of what decorates the Rani's dressing room.",
    successText: "A soft chime of silver ghungroos echoes as the silk draperies part. The path to the Zenana Wing is clear!"
  },
  "Chowk Courtyard->Mardana Wing": {
    id: "chowk_mardana",
    name: "The Iron Gate of Rajput Warriors",
    riddle: "I am forged in blistering flames, tempered in oil and ice. I have a sharp tongue that speaks in battle and slumbers in a sheath. What am I?",
    answers: ["sword", "a sword", "the sword", "saber", "a saber", "blade", "talwar", "a blade", "steel"],
    hint: "Think of the weapons lining the men's reception.",
    successText: "With a thunderous ring of phantom steel, the iron gate unlatches. The way to the Mardana Wing swings open!"
  },
  "Chowk Courtyard->Rasoda Kitchen": {
    id: "chowk_rasoda",
    name: "The Hearth Gate of the Subterranean Vault",
    riddle: "Feed me dry wood and I live and dance; give me water and I instantly die. What am I?",
    answers: ["fire", "a fire", "the fire", "flame", "flames", "a flame", "hearth"],
    hint: "Think of what once burned in the ancient stoves.",
    successText: "A sudden blast of warm air blows away the thick subterranean cobwebs. The stone stairs descend into the Rasoda Kitchen!"
  },
  "Chowk Courtyard->Stepwell Baoli": {
    id: "chowk_baoli",
    name: "The Gate of Whispering Waters",
    riddle: "I have no legs yet I run forever; I have no mouth yet I murmur deep; I can carve mountains of stone yet have no hands. What am I?",
    answers: ["water", "the water", "a river", "stream", "well", "a well"],
    hint: "Think of what fills the bottom of the deep stepwell.",
    successText: "The icy mist swirls and parts, revealing the ancient stone steps of the Stepwell Baoli!"
  },
  "Mardana Wing->Sheesh Mahal": {
    id: "mardana_sheesh",
    name: "The Cursed Mahogany Gate of the Sheesh Mahal",
    riddle: "I am born in the depths of royal greed, cut with precision and coveted by kings. I shine brightest in the dark, but steal the soul of whoever claims me. What am I?",
    answers: ["diamond", "the diamond", "a diamond", "star of mewar", "gem", "jewel", "the star of mewar"],
    hint: "Think of Thakur Vikram Singh's royal prize.",
    successText: "All three locks click in harmonic unison. The massive mahogany door groans and swings wide, revealing the blinding brilliance of the Sheesh Mahal!"
  }
};

export const rooms = {
  "Front Foyer": {
    name: "Front Foyer",
    description: "You stand in the entrance Foyer. The massive iron-studded gates behind you are slammed shut and sealed with a heavy brass lock. Dust dances in the dim beam of your lantern. To the north lies the central courtyard (Chowk) through the Archway of the Desert Sun. A small wooden drawer sits in the corner under a peeling portrait of Thakur Vikram Singh.",
    exits: { north: "Chowk Courtyard", n: "Chowk Courtyard" }
  },
  "Chowk Courtyard": {
    name: "Chowk Courtyard",
    description: "You are in the Chowk, a grand open-air courtyard surrounded by carved sandstone columns. The desert sky above is pitch black. To the south is the Foyer. Sealed gates lead west to the Zenana Wing, east to the Mardana Wing, north to the Stepwell Baoli, and down into the subterranean Rasoda Kitchen.",
    exits: {
      south: "Front Foyer", s: "Front Foyer",
      west: "Zenana Wing", w: "Zenana Wing",
      east: "Mardana Wing", e: "Mardana Wing",
      north: "Stepwell Baoli", n: "Stepwell Baoli",
      down: "Rasoda Kitchen", d: "Rasoda Kitchen"
    }
  },
  "Zenana Wing": {
    name: "Zenana Wing",
    description: "The Zenana (Women's Wing) is decorated with tattered silk drapes and fractured brass mirrors. Faint ghungroo anklet chimes echo in the air. To the east is the Chowk Courtyard. A heavy iron trunk sits locked under a stone Jharokha window.",
    exits: { east: "Chowk Courtyard", e: "Chowk Courtyard" }
  },
  "Mardana Wing": {
    name: "Mardana Wing",
    description: "The Mardana (Men's Reception) is lined with rusted Rajput sabers and shields. A large teak writing desk stands in the center. To the north lies the locked Mahogany Gate leading into the Sheesh Mahal (requires Bronze, Silver, and Gold keys). To the west is the Chowk Courtyard.",
    exits: { west: "Chowk Courtyard", w: "Chowk Courtyard", north: "Sheesh Mahal", n: "Sheesh Mahal" }
  },
  "Rasoda Kitchen": {
    name: "Rasoda Kitchen",
    description: "The Rasoda is a cold, subterranean kitchen littered with rusted iron stoves and broken clay jars. A stone staircase leads up to the Chowk Courtyard. In the shadows stands a closed pantry cabinet.",
    exits: { up: "Chowk Courtyard", u: "Chowk Courtyard" }
  },
  "Stepwell Baoli": {
    name: "Stepwell Baoli",
    description: "You stand at the bottom steps of the freezing Baoli. A deep pool of black water ripples before you. A glowing spectral guardian (Yaksha) hovers over the water, clutching the shimmering Gold Key! The stairs lead south to the Chowk.",
    exits: { south: "Chowk Courtyard", s: "Chowk Courtyard" }
  },
  "Sheesh Mahal": {
    name: "Sheesh Mahal",
    description: "The Sheesh Mahal (Palace of Mirrors) is encrusted with thousands of tiny convex mirrors, reflecting infinite horrifying echoes of yourself. On an onyx pedestal in the center rests the legendary STAR OF MEWAR diamond! The exit is south to the Mardana Wing.",
    exits: { south: "Mardana Wing", s: "Mardana Wing" }
  }
};

export function checkRiddleAnswer(gateKey, userAnswer) {
  const gate = GATES[gateKey];
  if (!gate) return { correct: true };

  const clean = userAnswer.trim().toLowerCase().replace(/^(answer|the|a)\s+/i, '').trim();
  const rawClean = userAnswer.trim().toLowerCase();

  const isCorrect = gate.answers.some(ans => {
    const cleanAns = ans.toLowerCase();
    return clean === cleanAns || rawClean.includes(cleanAns) || cleanAns.includes(clean);
  });

  return {
    correct: isCorrect,
    gate
  };
}

export function executeLocalCommand(state, command, unlockedGates = {}) {
  const normalizedCommand = command.trim().toLowerCase();
  const room = rooms[state.currentRoom];

  // Helper function for flexible keyword matching
  const match = (keywords) => {
    return keywords.every(kw => normalizedCommand.includes(kw));
  };

  // 1. Check movement command
  if (room.exits[normalizedCommand]) {
    const nextRoomName = room.exits[normalizedCommand];
    const gateKey = `${state.currentRoom}->${nextRoomName}`;
    const reverseGateKey = `${nextRoomName}->${state.currentRoom}`;

    // Check if Sheesh Mahal requires 3 keys
    if (nextRoomName === "Sheesh Mahal") {
      const hasAllKeys = state.inventory.includes("Bronze Key") && 
                         state.inventory.includes("Silver Key") && 
                         state.inventory.includes("Gold Key");
      if (!hasAllKeys) {
        return {
          location: state.currentRoom,
          storyText: "The Mahogany Gate to the Sheesh Mahal is bound with three keyholes (Bronze, Silver, Gold). You must possess all three keys before the gatekeeper will present the final riddle!",
          objective: "Find the Bronze, Silver, and Gold keys across the mansion.",
          stateUpdates: {}
        };
      }
    }

    // Check if gate is locked by riddle
    if (GATES[gateKey] && !unlockedGates[gateKey] && !unlockedGates[reverseGateKey]) {
      const gate = GATES[gateKey];
      return {
        location: state.currentRoom,
        requiresRiddle: true,
        gateKey: gateKey,
        storyText: `[GATE SEALED: ${gate.name.toUpperCase()}]\nAn ancient spiritual ward blocks your path to the ${nextRoomName}.\nA ghostly whisper resonates from the carved stonework:\n\n"${gate.riddle}"\n\n(Type the answer to unseal the gate, or type your next command.)`,
        objective: `Solve the riddle of the ${gate.name} to enter the ${nextRoomName}.`,
        stateUpdates: {}
      };
    }

    // Gate is open — travel to next room
    const nextRoom = rooms[nextRoomName];
    return {
      location: nextRoom.name,
      storyText: `You pass through into the ${nextRoom.name}.\n\n${nextRoom.description}`,
      objective: state.objective,
      stateUpdates: {
        currentRoom: nextRoom.name
      }
    };
  }

  // 2. Fallback check for look/l
  if (normalizedCommand === "look" || normalizedCommand === "l") {
    return {
      location: state.currentRoom,
      storyText: room.description,
      objective: state.objective,
      stateUpdates: {}
    };
  }

  // 3. Room specific keyword routing
  let storyText = "";
  let stateUpdates = {};
  let objective = state.objective;

  if (state.currentRoom === "Front Foyer") {
    if (match(["open", "drawer"]) || match(["pull", "drawer"]) || match(["search", "drawer"])) {
      if (state.inventory.includes("Bronze Key")) {
        storyText = "The drawer is already open and empty. You have the Bronze Key in your inventory.";
      } else {
        storyText = "You pull open the damp wooden drawer. It creaks loudly, scattering decades of dust. Inside, wrapped in decayed velvet, you find the BRONZE KEY!";
        stateUpdates = { addInventory: "Bronze Key", setKeyCollected: "bronze" };
        objective = "Pass through the Chowk and find the Silver and Gold Keys.";
      }
    } else if (match(["examine", "portrait"]) || match(["look", "portrait"]) || match(["examine", "painting"]) || match(["look", "painting"])) {
      storyText = "The portrait depicts Thakur Vikram Singh holding the glowing Star of Mewar diamond. His cold eyes seem to track your movements. An inscription reads: 'Only the worthy who solve the trials of the haveli shall leave with their breath.'";
    } else if (match(["take", "portrait"]) || match(["get", "portrait"]) || match(["pull", "portrait"])) {
      storyText = "You pull at the frame. It is bolted solid. The painted Thakur scowls in fury, and an icy chill stabs through your heart. (Sanity -5)";
      stateUpdates = { sanityChange: -5 };
    }
  }

  else if (state.currentRoom === "Chowk Courtyard") {
    if (match(["examine", "column"]) || match(["look", "column"]) || match(["examine", "pillar"]) || match(["look", "pillar"])) {
      storyText = "The sandstone columns are carved with ancient Rajput battle scenes and dancing spirits. Sand whistles eerily through the arches.";
    } else if (match(["examine", "ground"]) || match(["look", "ground"]) || match(["examine", "floor"]) || match(["look", "fountain"])) {
      storyText = "The courtyard ground is paved with cracked marble. In the center is a dry fountain filled with black sand.";
    }
  }

  else if (state.currentRoom === "Zenana Wing") {
    if (match(["use", "crowbar"]) || match(["pry", "trunk"]) || match(["break", "trunk"])) {
      if (state.inventory.includes("Silver Key")) {
        storyText = "The trunk has already been pried open and looted.";
      } else if (state.inventory.includes("Iron Crowbar")) {
        storyText = "With a violent heave, your iron crowbar splinters the rusted iron latch! The trunk pops open. Inside, nestled in silk, you discover the SILVER KEY and a fresh flask of Lantern Oil!";
        stateUpdates = { addInventory: "Silver Key", setKeyCollected: "silver", oilChange: 30 };
        objective = "Locate the Gold Key in the Stepwell Baoli.";
      } else {
        storyText = "You need a crowbar to force this heavy iron latch open.";
      }
    } else if (match(["use", "glass"]) || match(["magnifying"]) || match(["search", "latch"])) {
      if (state.inventory.includes("Silver Key")) {
        storyText = "The trunk is already unlocked.";
      } else if (state.inventory.includes("Magnifying Glass") || state.playerClass === "Antiquarian") {
        storyText = "Peering through your magnifying glass, your keen eyes spot a hidden spring pin behind the brass lotus engraving. You press it with a needle, and the trunk snaps open! Inside lies the SILVER KEY and a flask of Oil!";
        stateUpdates = { addInventory: "Silver Key", setKeyCollected: "silver", oilChange: 30 };
        objective = "Locate the Gold Key in the Stepwell Baoli.";
      } else {
        storyText = "The lock mechanism is too intricate to decipher with the naked eye.";
      }
    } else if (match(["use", "bell"]) || match(["ring", "bell"])) {
      if (state.inventory.includes("Silver Key")) {
        storyText = "The trunk is already unlocked.";
      } else if (state.inventory.includes("Brass Bell") || state.playerClass === "Exorcist (Tantrik)") {
        storyText = "You ring your brass bell. The sacred harmonic vibrations resonate across the room, shattering the spiritual binding ward! The chest lid swings open, revealing the SILVER KEY and Lantern Oil!";
        stateUpdates = { addInventory: "Silver Key", setKeyCollected: "silver", oilChange: 30 };
        objective = "Locate the Gold Key in the Stepwell Baoli.";
      } else {
        storyText = "You do not have a consecrated brass bell to break the ward.";
      }
    } else if (match(["open", "trunk"]) || match(["examine", "trunk"]) || match(["search", "trunk"])) {
      if (state.inventory.includes("Silver Key")) {
        storyText = "The iron trunk stands open and looted.";
      } else if (state.inventory.includes("Iron Crowbar")) {
        storyText = "The heavy trunk is locked. You can use your crowbar ('use crowbar') to pry it open.";
      } else if (state.inventory.includes("Magnifying Glass") || state.playerClass === "Antiquarian") {
        storyText = "The trunk has a secret mechanism. Use your magnifying glass ('use glass') to uncover the release pin.";
      } else if (state.inventory.includes("Brass Bell") || state.playerClass === "Exorcist (Tantrik)") {
        storyText = "The trunk is bound by a glowing ward. Ring your brass bell ('use bell') to dispel it.";
      } else {
        storyText = "The heavy iron trunk is locked solid. You will need a crowbar, magnifying glass, or ritual bell to open it.";
      }
    } else if (match(["examine", "mirror"]) || match(["look", "mirror"])) {
      storyText = "You peer into the cracked dressing mirror. A pale ghostly Rani glares back from behind your shoulder, wailing into the void before vanishing. (Sanity -10)";
      stateUpdates = { sanityChange: -10 };
    }
  }

  else if (state.currentRoom === "Mardana Wing") {
    if (match(["examine", "saber"]) || match(["look", "saber"]) || match(["examine", "sword"]) || match(["look", "sword"])) {
      storyText = "Ancient Rajput talwars line the walls. Touching the rusted pommel sends a spectral clash of battle screaming through your thoughts. (Sanity -5)";
      stateUpdates = { sanityChange: -5 };
    } else if (match(["open", "desk"]) || match(["examine", "desk"]) || match(["search", "desk"])) {
      storyText = "You search the teak writing desk. Inside is a scroll from the court priest: 'The Yaksha in the Baoli is vulnerable only to the Sacred Ash stored in the subterranean Rasoda pantry.'";
    }
  }

  else if (state.currentRoom === "Rasoda Kitchen") {
    if (match(["open", "cabinet"]) || match(["open", "pantry"]) || match(["search", "cabinet"]) || match(["search", "pantry"])) {
      if (state.inventory.includes("Sacred Ash")) {
        storyText = "The pantry cabinet is open and empty.";
      } else {
        storyText = "You open the creaking cabinet. Tucked inside a clay urn, you discover a pouch of SACRED ASH and a flask of Lantern Oil!";
        stateUpdates = { addInventory: "Sacred Ash", oilChange: 40 };
        objective = "Use the Sacred Ash to subdue the Yaksha at the Stepwell Baoli.";
      }
    } else if (match(["examine", "pot"]) || match(["search", "pot"]) || match(["search", "jar"])) {
      storyText = "You thrust your hand into a dark clay pot. A black desert scorpion stings your finger! Burning venom courses into your veins. (Sanity -10)";
      stateUpdates = { sanityChange: -10 };
    }
  }

  else if (state.currentRoom === "Stepwell Baoli") {
    if (match(["use", "ash"]) || match(["throw", "ash"]) || match(["sacred", "ash"])) {
      if (state.inventory.includes("Sacred Ash")) {
        storyText = "You hurl the Sacred Ash across the water. The glowing powder burns the spectral Yaksha with blinding white light! It screeches in agony, dissolving into mist and dropping the GOLD KEY onto the stone landing!";
        stateUpdates = { addInventory: "Gold Key", setKeyCollected: "gold", removeInventory: "Sacred Ash" };
        objective = "All three keys collected! Head to the Mardana Wing to unlock the Sheesh Mahal.";
      } else {
        storyText = "You don't have any Sacred Ash. Search the Rasoda Kitchen cabinet for it.";
      }
    } else if (match(["take", "key"]) || match(["get", "key"]) || match(["take", "gold"]) || match(["get", "gold"])) {
      if (state.inventory.includes("Gold Key")) {
        storyText = "You already hold the Gold Key.";
      } else {
        storyText = "As you reach for the key, the Yaksha shrieks, blasting a freezing torrent of stepwell water into your chest! (Sanity -20)";
        stateUpdates = { sanityChange: -20 };
      }
    } else if (match(["drink", "water"]) || match(["drink", "well"])) {
      storyText = "You cup the freezing well water to your lips. It is crystal pure, soothing your trembling nerves. (Sanity +20)";
      stateUpdates = { sanityChange: 20 };
    }
  }

  else if (state.currentRoom === "Sheesh Mahal") {
    if (match(["take", "diamond"]) || match(["get", "diamond"]) || match(["take", "star"]) || match(["get", "star"])) {
      if (state.inventory.includes("Star of Mewar")) {
        storyText = "You possess the Star of Mewar. Hurry back to the Front Foyer gates and escape!";
      } else {
        storyText = "You seize the legendary STAR OF MEWAR from the onyx pedestal! A deafening siren shakes the palace as mirrors fracture across all walls. You must now race back to the Front Foyer gates to escape!";
        stateUpdates = { addInventory: "Star of Mewar" };
        objective = "Return to the Front Foyer and type 'escape' or 'unlock gate' to win!";
      }
    } else if (match(["examine", "mirror"]) || match(["look", "mirror"])) {
      storyText = "In the infinite reflections, you see your own corpse wandering the mansion for eternity. The terrifying realization drains your resolve. (Sanity -15)";
      stateUpdates = { sanityChange: -15 };
    }
  }

  // If a room-specific match was found, return it
  if (storyText) {
    return {
      location: state.currentRoom,
      storyText,
      objective,
      stateUpdates
    };
  }

  // 4. Default fallback
  const fallbacks = [
    "Your voice echoes through the empty stone arches. Nothing happens.",
    "You attempt that action, but the thick desert dust only rises to choke your breath. Focus on the keys and gates.",
    "The cold silence of the haveli mocks your effort. Try a different command.",
    "A chilling draft passes through the carved jharokha. The spirits watch in silence."
  ];
  const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];

  return {
    location: state.currentRoom,
    storyText: randomFallback,
    objective: state.objective,
    stateUpdates: {}
  };
}
