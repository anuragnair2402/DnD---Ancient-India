// Fallback Offline Branching Narrative Database for Mansion Escape
// Mimics the JSON schema of the Gemini AI connector to provide seamless offline playability.

export const rooms = {
  "Front Foyer": {
    name: "Front Foyer",
    description: "You stand in the entrance Foyer. The massive iron-studded gates behind you are slammed shut and sealed with a heavy brass lock. Dust dances in the dim beam of your lantern. To the north lies the central courtyard (Chowk) through a carved archway. A small wooden drawer sits in the corner under a peeling portrait.",
    exits: { north: "Chowk Courtyard", n: "Chowk Courtyard" }
  },
  "Chowk Courtyard": {
    name: "Chowk Courtyard",
    description: "You are in the Chowk, a grand open-air courtyard surrounded by columns. The desert sky above is black and starless. A dry wind whistles through the arches. To the south is the Foyer. Passages lead west to the Zenana Wing, east to the Mardana Wing, north to the Stepwell Baoli, and down into the Rasoda Kitchen.",
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
    description: "The Zenana (Women's Wing) is decorated with tattered silk drapes. Broken brass dressing mirrors line the walls. A faint chimes sound (ghungroos) echo from the corners. To the east is the Chowk Courtyard. A heavy iron trunk lies covered in dust under a stone window.",
    exits: { east: "Chowk Courtyard", e: "Chowk Courtyard" }
  },
  "Mardana Wing": {
    name: "Mardana Wing",
    description: "The Mardana (Men's Reception) is lined with rusted sabers and shields. A large teak writing desk stands in the center. A massive locked mahogany door leads north to the Sheesh Mahal. The exit to the west returns to the Chowk Courtyard.",
    exits: { west: "Chowk Courtyard", w: "Chowk Courtyard", north: "Sheesh Mahal", n: "Sheesh Mahal" }
  },
  "Rasoda Kitchen": {
    name: "Rasoda Kitchen",
    description: "The Rasoda is a dark, subterranean kitchen. Rusted iron stoves and broken clay pots cover the floor. The air is damp and suffocating. A passage leads up to the Chowk Courtyard. A closed wooden pantry cabinet stands in the shadows.",
    exits: { up: "Chowk Courtyard", u: "Chowk Courtyard" }
  },
  "Stepwell Baoli": {
    name: "Stepwell Baoli",
    description: "You descend the long stone steps of the Baoli. The air becomes freezing. A deep basin of black water lies at the bottom. The stairs lead south to the Chowk. A glowing spectral guardian (Yaksha) floats over the water, guarding a shimmering Gold Key.",
    exits: { south: "Chowk Courtyard", s: "Chowk Courtyard" }
  },
  "Sheesh Mahal": {
    name: "Sheesh Mahal",
    description: "The Sheesh Mahal (Palace of Mirrors) is covered in thousands of tiny concave mirrors. Your lantern light reflects in infinite patterns, blinding your eyes. In the center is a crystal pedestal holding the legendary Star of Mewar diamond! The exit is south to the Mardana Wing.",
    exits: { south: "Mardana Wing", s: "Mardana Wing" }
  }
};

export function executeLocalCommand(state, command) {
  const normalizedCommand = command.trim().toLowerCase();
  const room = rooms[state.currentRoom];

  // Helper function for flexible keyword matching
  const match = (keywords) => {
    return keywords.every(kw => normalizedCommand.includes(kw));
  };

  // 1. Check movement command
  if (room.exits[normalizedCommand]) {
    const nextRoomName = room.exits[normalizedCommand];
    const nextRoom = rooms[nextRoomName];
    return {
      location: nextRoom.name,
      storyText: `You travel to the ${nextRoom.name}.\n\n${nextRoom.description}`,
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
        storyText = "The drawer is already open and empty. You have the Bronze Key.";
      } else {
        storyText = "You pull open the damp wooden drawer. It creaks loudly, sending dust into your eyes. Inside, sitting in a velvet pouch, you find a small Bronze Key!";
        stateUpdates = { addInventory: "Bronze Key", setKeyCollected: "bronze" };
        objective = "Find the Silver and Gold Keys.";
      }
    } else if (match(["examine", "portrait"]) || match(["look", "portrait"]) || match(["examine", "painting"]) || match(["look", "painting"])) {
      storyText = "The portrait displays Thakur Vikram Singh, his chest adorned with royal medals, holding a glowing blue diamond. His painted eyes follow you with an intense, unblinking glare. A plaque underneath reads: 'Honor lies in what remains locked.'";
    } else if (match(["take", "portrait"]) || match(["get", "portrait"]) || match(["pull", "portrait"])) {
      storyText = "You pull at the frame. It is bolted solid to the brick wall. The Thakur's face seems to twist in anger, and a cold chill spikes down your neck. Better to leave the dead to their gaze. (Sanity -5)";
      stateUpdates = { sanityChange: -5 };
    }
  }

  else if (state.currentRoom === "Chowk Courtyard") {
    if (match(["examine", "column"]) || match(["look", "column"]) || match(["examine", "pillar"]) || match(["look", "pillar"])) {
      storyText = "The sandstone columns are carved with images of dancing women and huntsmen. Some pillars are cracked, bleeding a dark, sap-like liquid that smells faintly of copper and iron.";
    } else if (match(["examine", "ground"]) || match(["look", "ground"]) || match(["examine", "floor"]) || match(["look", "floor"]) || match(["examine", "fountain"])) {
      storyText = "The marble floor tiles are stained with ancient soot. In the center is a dry fountain, its basin filled with sand and parched snake skins.";
    }
  }

  else if (state.currentRoom === "Zenana Wing") {
    if (match(["use", "crowbar"]) || match(["pry", "trunk", "crowbar"]) || match(["break", "trunk", "crowbar"])) {
      if (state.inventory.includes("Silver Key")) {
        storyText = "The trunk is already broken open and looted.";
      } else if (state.inventory.includes("Iron Crowbar")) {
        storyText = "With a grinding crunch of wood, you force the iron crowbar under the lid. It breaks open! Inside, wrapped in a moth-eaten silk shawl, you find the Silver Key and an extra flask of Oil.";
        stateUpdates = { addInventory: "Silver Key", setKeyCollected: "silver", oilChange: 30, removeInventory: "Iron Crowbar" };
        objective = "Locate the Gold Key in the depths of the stepwell.";
      } else {
        storyText = "You don't have a crowbar in your inventory to pry this open.";
      }
    } else if (match(["use", "glass"]) || match(["magnifying", "glass"]) || match(["use", "magnifying"])) {
      if (state.inventory.includes("Silver Key")) {
        storyText = "The trunk is already open and looted.";
      } else if (state.inventory.includes("Magnifying Glass") || state.playerClass === "Antiquarian") {
        storyText = "You peer closely at the intricate brass lock plate of the trunk using your magnifying glass. You spot a tiny, hidden release pin beneath the decorative scrollwork. Pressing it with a matchstick, you hear a soft click, and the heavy lid swings open! Inside, you find the Silver Key and an extra flask of Oil.";
        stateUpdates = { addInventory: "Silver Key", setKeyCollected: "silver", oilChange: 30 };
        objective = "Locate the Gold Key in the depths of the stepwell.";
      } else {
        storyText = "You don't have a magnifying glass to inspect the lock closely.";
      }
    } else if (match(["use", "bell"]) || match(["ring", "bell"]) || match(["brass", "bell"])) {
      if (state.inventory.includes("Silver Key")) {
        storyText = "The trunk is already open and clean of curses.";
      } else if (state.inventory.includes("Brass Bell") || state.playerClass === "Exorcist (Tantrik)") {
        storyText = "You ring your brass bell over the trunk. The pure, echoing harmonic tone vibrates through the dark room. The faint, glowing spiritual ward surrounding the chest shatters with a sharp pop! The lock snaps open. Inside, you find the Silver Key and an extra flask of Oil.";
        stateUpdates = { addInventory: "Silver Key", setKeyCollected: "silver", oilChange: 30 };
        objective = "Locate the Gold Key in the depths of the stepwell.";
      } else {
        storyText = "You don't have a brass bell to dispel the spiritual ward.";
      }
    } else if (match(["open", "trunk"]) || match(["examine", "trunk"]) || match(["search", "trunk"])) {
      if (state.inventory.includes("Silver Key")) {
        storyText = "The trunk is broken open and empty.";
      } else if (state.inventory.includes("Iron Crowbar")) {
        storyText = "The heavy iron trunk is locked tight. You can use your crowbar ('use crowbar') to pry it open.";
      } else if (state.inventory.includes("Magnifying Glass") || state.playerClass === "Antiquarian") {
        storyText = "The heavy iron trunk is locked. Inspecting the lock plate, you notice a hidden mechanism. You could use your magnifying glass ('use glass') to find a release latch.";
      } else if (state.inventory.includes("Brass Bell") || state.playerClass === "Exorcist (Tantrik)") {
        storyText = "The heavy iron trunk is sealed by a faint glowing spirit ward. You can use your brass bell ('use bell') to dispel the ward.";
      } else {
        storyText = "The heavy iron trunk is locked tight and sealed. It requires a specific tool, like a crowbar, magnifying glass, or brass bell, to open.";
      }
    } else if (match(["examine", "mirror"]) || match(["look", "mirror"]) || match(["examine", "glass"])) {
      storyText = "You look at the silvered dressing glass. Your reflection appears distorted and old. Suddenly, a pale weeping woman passes behind you in the reflection, but when you spin around, there is only dust. (Sanity -10)";
      stateUpdates = { sanityChange: -10 };
    }
  }

  else if (state.currentRoom === "Mardana Wing") {
    if (match(["examine", "saber"]) || match(["look", "saber"]) || match(["examine", "sword"]) || match(["look", "sword"]) || match(["examine", "shield"])) {
      storyText = "You inspect the curved Rajput swords. They are rusted and useless for combat. Touching one triggers a loud, phantom clash of steel in your ears. (Sanity -5)";
      stateUpdates = { sanityChange: -5 };
    } else if (match(["open", "desk"]) || match(["examine", "desk"]) || match(["search", "desk"])) {
      storyText = "You slide open the heavy desk drawer. Inside are dry inkwells and a yellowed letter. The letter reads: 'The Gold Key is guarded by the Yaksha in the depths of the Baoli. Use the sacred ashes to blind it.'";
    } else if (match(["open", "door"]) || match(["unlock", "door"])) {
      storyText = "The massive mahogany door leads to the Sheesh Mahal. It is locked with three keyholes: Bronze, Silver, and Gold. You must have all three keys to enter.";
    }
  }

  else if (state.currentRoom === "Rasoda Kitchen") {
    if (match(["open", "cabinet"]) || match(["open", "pantry"]) || match(["search", "cabinet"]) || match(["search", "pantry"])) {
      if (state.inventory.includes("Sacred Ash")) {
        storyText = "The pantry cabinet stands open and empty.";
      } else {
        storyText = "You open the creaking cabinet. Inside are empty jars, but tucked in the back, you find a container of Sacred Ash and a flask of Lantern Oil!";
        stateUpdates = { addInventory: "Sacred Ash", oilChange: 40 };
      }
    } else if (match(["examine", "pot"]) || match(["search", "pot"]) || match(["search", "jar"]) || match(["examine", "jar"])) {
      storyText = "You search through the clay jars. One jar contains a small desert scorpion which stings your hand! A burning poison spreads. (Sanity -10)";
      stateUpdates = { sanityChange: -10 };
    }
  }

  else if (state.currentRoom === "Stepwell Baoli") {
    if (match(["use", "ash"]) || match(["throw", "ash"]) || match(["sacred", "ash"])) {
      if (state.inventory.includes("Sacred Ash")) {
        storyText = "You throw the Exorcist's Sacred Ash. The powder strikes the spectral Yaksha. It howls in pain, dissolving into a grey mist and dropping the Gold Key onto the stone steps!";
        stateUpdates = { addInventory: "Gold Key", setKeyCollected: "gold", removeInventory: "Sacred Ash" };
        objective = "Unlock the Sheesh Mahal door in the Mardana Wing.";
      } else {
        storyText = "You don't have any Sacred Ash to use.";
      }
    } else if (match(["take", "key"]) || match(["get", "key"]) || match(["take", "gold"]) || match(["get", "gold"])) {
      if (state.inventory.includes("Gold Key")) {
        storyText = "You already took the Gold Key.";
      } else {
        storyText = "You reach for the Gold Key, but the Yaksha guardian screeches, raising a wave of icy stepwell water that slams into you, chilling your soul! (Sanity -20)";
        stateUpdates = { sanityChange: -20 };
      }
    } else if (match(["drink", "water"]) || match(["drink", "well"])) {
      storyText = "You scoop some water from the well. It is cold and tastes of copper, but it clears your mind and calms your racing heart. (Sanity +20)";
      stateUpdates = { sanityChange: 20 };
    }
  }

  else if (state.currentRoom === "Sheesh Mahal") {
    if (match(["take", "diamond"]) || match(["get", "diamond"]) || match(["take", "star"]) || match(["get", "star"])) {
      if (state.inventory.includes("Star of Mewar")) {
        storyText = "You are already holding the Star of Mewar. Make your way to the Foyer and escape!";
      } else {
        storyText = "You grab the Star of Mewar diamond! The mirrors scream as they fracture, but you hold the prize. Now, return to the Foyer and escape!";
        stateUpdates = { addInventory: "Star of Mewar" };
        objective = "Return to the Foyer gate and unlock it to escape!";
      }
    } else if (match(["examine", "mirror"]) || match(["look", "mirror"]) || match(["look", "walls"])) {
      storyText = "You gaze into the infinite mirrors. You see a thousand versions of yourself dying in different rooms of this mansion. The shock fractures your mind. (Sanity -15)";
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

  // 4. Default dark, witty, and ominous fallback response
  const fallbacks = [
    "You wander into a dark alcove, brushing against thick spiderwebs. The cold wind whistling through the carvings laughs at your useless actions. Try something else.",
    "Your hands claw uselessly at the cold stonework. A voice in the shadows whispers: 'A pointless effort.' Focus on the locks and clues.",
    "You speak to the empty dark, but only your echo answers, hollow and cold. The mansion's walls do not care for such commands.",
    "You attempt that action, but the dust rises to settle in your throat, causing you to cough. The spirits find your confusion amusing."
  ];
  const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];

  return {
    location: state.currentRoom,
    storyText: randomFallback,
    objective: state.objective,
    stateUpdates: {}
  };
}
