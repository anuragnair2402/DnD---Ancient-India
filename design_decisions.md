# Design Decisions: Mansion Escape

This document serves as the official design record and architectural outline for the AI-Powered Retro Adventure Game **Mansion Escape** (formerly DharmaQuest). It details the theme shift, visual direction, reference inspiration, gameplay mechanics, plot outline, and AI integration guidelines established during **Phase 1: Research & Definition**.

---

## 1. Reference Collection & Inspiration

To build a premium retro escape-room adventure game, we draw inspiration from the gold standard of 1980s and 1990s haunted house titles and text-based interactive mystery games:

### Classic Text Adventures
*   **Zork I: The Great Underground Empire (Infocom, 1980):** 
    *   *Inspiration:* The layout and mechanics of a true command-line text adventure. A fixed header bar displays the current location, score/sanity, and moves/turns. Text scrolls vertically as you type commands.
    *   *Application:* The interface will be a pure text terminal emulator. The top status bar is locked, the text history scrolls, and the bottom contains a prompt cursor `>` where players type actions (e.g., `open drawer`, `go south`).
*   **The Lurking Horror (Infocom, 1987):** 
    *   *Inspiration:* The claustrophobic feeling of exploring a dark, shifting structure with unseen terrors. High focus on sound, environmental cues, and survival.
    *   *Application:* Mansion Escape will describe rooms through sensory details—the scent of decaying sandalwood, the damp wind whistling through stone *Jharokhas* (carved windows of the mansion), and distant anklet chimes (ghungroos).

---

## 2. Text Conversation Flow (Based on Zork Analysis)

Analyzing `zorktranscript.md` reveals a highly structured, immersive loop between the player and the system:
1.  **Room Entry / Description:** The game always starts by providing a clear, evocative description of the environment, notable items in the area (e.g. *"On the table is an elongated brown sack..."*), and visible exits.
2.  **Command Echo:** The player's typed command is prepended with a `>` and printed directly into the scrolling log (e.g., `> open mailbox`), serving as a permanent record of player intent.
3.  **State-Aware Feedback:**
    *   Verbal confirmation of success (e.g. `Taken.`, `Dropped.`, `The lamp is now on.`).
    *   Inventory size limits (e.g. `Your load is too heavy. You will have to leave something behind.`).
    *   Lethal/dangerous state changes (e.g. `It is pitch black. You are likely to be eaten by a grue.`, `The trap door crashes shut, and you hear someone barring it.`).
4.  **Action Resolution:** Physical combat, puzzles, or movements result in dynamic environmental changes (e.g., a troll turning to ash, a rug moving to reveal a trapdoor).

The Mansion Escape parser will adhere strictly to this loop, logging player commands directly and returning short, impactful text blocks that maintain the room state.

---

## 3. Overall Game Theme: Haunted Rajasthani Mansion

Instead of a generic western gothic manor, the game is set in a **haunted Rajasthani-style mansion** (historically built as a traditional royal "haveli"). The setting is saturated in Rajasthani folklore, desert spirits, forgotten curses, and traditional palace architecture.

*   **The World:** An expansive 19th-century royal mansion—featuring the *Chowk* (central open-air courtyard), *Zenana* (women's quarters), *Mardana* (men's reception), *Sheesh Mahal* (palace of mirrors), *Bhuyanra* (underground vault), and the *Baoli* (stepwell).
*   **The Threat:** The mansion of Thakur Vikram Singh is cursed. The Thakur made a dark pact with a desert Djinn to protect his royal diamond, the *Star of Mewar*. The mansion is alive, shifting its halls, locked by three mystical locks: Bronze, Silver, and Gold.
*   **The Mission:** The player is an antiquarian/adventurer who snaked in for the diamond. The heavy iron gates slammed shut. The player has **exactly 50 turns** to search the rooms, gather the keys or lift the curse, and escape before they starve, go mad, or are claimed by the mansion's ghost.

---

## 4. Tone and Style Guidelines: Dark, Witty, and Ominous

To evoke the gothic, haunted atmosphere of the Rajasthani desert, the AI narrator must maintain a **dark, witty, and ominous tone**. It should deliver grim warnings, dry sarcasms, and spooky local lore.

### Key Tone Directives
*   **Ominous Descriptions:** Emphasize the living, hungry nature of the mansion. Use references to creeping shadows, dust settling like ash, and sounds that are just out of sight.
*   **Dark Wit & Sarcasm:** Mock the player's greed, foolishness, or errors in a dry, Victorian-meet-Rajput style.
*   **Vivid Consequences:** When Sanity or Lantern Oil drops, describe the creeping sensory degradation (cold drafts, whispers, visual static).

### Sample Responses to Commands
| Player Command | Tone Response |
| :--- | :--- |
| `go north` (into locked door) | "You slam your shoulder against the heavy teakwood gate. It groans but remains locked, solid as a tombstone. A dry voice whispers from the keyhole: *'Patience is a virtue the dead have in abundance.'*" |
| `take portrait` (unmovable) | "You claw at the heavy painting of Thakur Vikram Singh. His painted eyes seem to narrow in disgust, and the canvas grows ice-cold. You decide it is best to leave the dead to their frames." |
| `open drawer` (empty) | "You slide the wooden drawer open. A small cloud of dust escapes, accompanied by a faint sigh. Nothing but cobwebs and the lingering scent of decayed jasmine remains." |
| `use crowbar on ghost` | "You swing the heavy iron bar at the weeping apparition. It slices through her form with a hollow hiss. She pauses, looks at the iron bar, and then at you. Your material weapon seems to have only insulted her. (Sanity -10)" |
| `gdsghsk` (senseless input) | "You mutter a string of ancient gibberish. The stone arches echo your confusion. The mansion's resident spirits find your bewilderment... amusing. Focus your mind." |

---

## 5. Visual Direction & Styling

Mansion Escape will feature a premium, retro-inspired interface mimicking the screenshots of Zork with a modern glassmorphic CRT flair, focusing entirely on **pure text representation** without graphical pixel-art assets or illustrations to stay true to 1980s interactive fiction:

### Color Palette (Monochromatic Amber CRT)
To replicate the classic phosphor screen look, we use a warm, amber-monochrome color system with dark glass frames:
```css
:root {
  --bg-deep: hsl(20, 20%, 3%);          /* Dark onyx black */
  --bg-panel: hsl(20, 15%, 8%);         /* Aged backing */
  --terminal-amber: hsl(40, 95%, 55%);  /* Classic Amber phosphor text glow */
  --terminal-dim: hsl(40, 50%, 35%);    /* Dimmer amber for logs / borders */
  --sanity-red: hsl(0, 80%, 50%);       /* Warn indicators */
}
```

### UI Features
*   **Header Status Bar:** Locked at the very top of the viewport. It displays:
    `[Room Name]                   Sanity: [X]%           Moves: [Y]/50`
    in a clean, high-contrast, inverse-background bar (white/light amber text on dark background, or vice-versa).
*   **Instruction Button:** A discrete, retro-styled `[HELP]` or `[COMMANDS]` action button positioned on the right side of the status bar or near the command prompt. Clicking it opens a modal overlay displaying a quick-reference guide of valid commands, movements, and item interaction syntax.
*   **Scrolling Terminal Feed:** A vertical log container. When a command is entered, it prints `> [player command]` followed by the room response, pushing older text upward.
*   **Phosphor CRT Filter:** Overlay scanlines, screen curvature reflections, and minor text jitter/flicker.
*   **Interactive Command Prompt:** A text input field at the bottom starting with a fixed `>` cursor that focuses automatically on click.

---

## 6. Core Gameplay Loop & Parser Mechanics

Rather than selecting buttons, the player interacts using typed text commands.

### Navigation Commands
The client parser processes direction commands directly to update the player's position:
*   `go north` / `n`
*   `go south` / `s`
*   `go east` / `e`
*   `go west` / `w`
*   `go up` / `u`
*   `go down` / `d`

### General Utility Commands
*   `look` / `l`: Re-describes the current room.
*   `inventory` / `i`: Lists current carrying items.
*   `help`: Lists basic commands and movement hints (equivalent to clicking the Instruction Button).
*   `restart`: Resets the game session (triggers confirmation modal).

### Interaction & Item Verbs
Commands containing action verbs are evaluated by the AI (or local fallback tree) against the current room state:
*   `take [item]` / `get [item]`
*   `drop [item]`
*   `open [object]` (e.g., `open drawer`, `open chest`)
*   `examine [object/item]` / `x [object/item]`
*   `use [item] on [object]` (e.g., `use crowbar on trunk`, `use bell`)
*   `unlock [object]` (e.g., `unlock bronze gate`)

---

## 7. Player State & Progression Model

```javascript
const initialPlayerState = {
  name: "",
  class: "",          // 'antiquarian' | 'exorcist' | 'mercenary'
  stats: {
    sanity: 100,      // Mental health (0 = Madness / Game Over)
    maxSanity: 100,
    resolve: 10,      // Physical force
    perception: 10,   // Finding hidden keys / reading clues
    courage: 10,      // Repelling spirits
    terror: 10        // Threat multiplier
  },
  inventory: [],      // Max 6 slots
  oilReserve: 100,    // Lantern oil (decreases by 2% per turn)
  keysCollected: {
    bronze: false,
    silver: false,
    gold: false
  },
  turn: 1,            // Current turn (maximum 50)
  currentRoom: "Front Foyer",
  objective: "Find the Bronze, Silver, and Gold Keys to unlock the gate.",
  status: "creation"
};
```

### Character Classes & Gameplay Design Decisions
To make class selection a meaningful strategic choice rather than a single viable path, each class is designed with a unique gameplay mechanic to overcome the key bottlenecks:

*   **Antiquarian (The Scholar's Path):** 
    *   *Stats:* Resolve: 7, Perception: 15, Courage: 8.
    *   *Starting Gear:* `Magnifying Glass`, `Old Journal`, `Matches`.
    *   *Gameplay Mechanic:* High Perception. Instead of needing a crowbar, they can use the `Magnifying Glass` on the Zenana trunk to discover a hidden, intricate latch mechanism and safely unlock it.
*   **Exorcist (The Spiritual Path):** 
    *   *Stats:* Resolve: 8, Perception: 9, Courage: 15.
    *   *Starting Gear:* `Sacred Ash`, `Brass Bell`, `Matches`.
    *   *Gameplay Mechanic:* High Courage & Ward Dispelling. They start with the `Sacred Ash` directly (bypassing the subterranean Rasoda Kitchen run if desired). They can use the `Brass Bell` to ring a harmonic resonance that shatters the spirit-binding ward locking the Zenana trunk.
*   **Mercenary (The Brute Force Path):** 
    *   *Stats:* Resolve: 15, Perception: 8, Courage: 7.
    *   *Starting Gear:* `Iron Crowbar`, `Matches`, `Oil Flask` (+50% starting oil).
    *   *Gameplay Mechanic:* High Resolve. They can use the `Iron Crowbar` to physically break the lock on the Zenana trunk.

---

## 8. Path-to-Victory Progression (Multi-Class Mechanics)
*   **The Trunk Bottleneck (Zenana Wing):** 
    *   *Mercenary:* `use crowbar` to pry it open.
    *   *Antiquarian:* `use glass` (or `search trunk` with high Perception) to locate the hidden latch.
    *   *Exorcist:* `use bell` (or `ring bell`) to shatter the spiritual ward.
*   **The Guardian Bottleneck (Stepwell Baoli):**
    *   *Exorcist:* Can immediately head to the Baoli and `use ash` (already in starting inventory) to claim the Gold Key early.
    *   *Antiquarian / Mercenary:* Must first descend to the subterranean Rasoda Kitchen to retrieve the `Sacred Ash` from the pantry cabinet before confronting the Yaksha.

---

## 8. Plot Outline: "Mansion Escape: The Star of Mewar"

*   **Turn 1-10: Entering the Foyer & Courtyard:**
    The antiquarian slips through a broken Jharokha. The entrance gate slams shut. Whispers echo from the pillars. The player must find a source of light (matches/oil) and search the Foyer to unlock the door into the main Courtyard (Chowk).
*   **Turn 11-25: Exploring the Wings:**
    The player explores three primary wings:
    *   *The Zenana (Women's Wing):* Haunted by the weeping Rani. Searching the dressing tables reveals the **Bronze Key**, but triggers illusions of mirrors shattering.
    *   *The Mardana (Men's Wing):* Guarded by the phantom of Thakur Vikram Singh. The player needs courage to stand their ground or the crowbar to break a chest containing the **Silver Key**.
    *   *The Rasoda (Ancient Kitchen):* Dark and littered with old brass pots. Searching here reveals lantern oil and dry matches, but risks snake bites or scorpion stings.
*   **Turn 26-40: The Depths & Sheesh Mahal:**
    *   *The Stepwell (Baoli):* Down in the dark damp steps, the player can drink water to restore Sanity, but must avoid the water spirit (Yaksha) to retrieve the **Gold Key**.
    *   *The Sheesh Mahal (Palace of Mirrors):* Reflects the player’s worst fears. High sanity is required here; otherwise, hallucinations cause physical sanity damage. Inside is the vault control.
*   **Turn 41-49: Opening the Gate / Banishment:**
    With all three keys, the player returns to the Foyer to unlock the massive iron gate. If they choose to find the Thakur's hidden diary, they can banish the Djinn to cleanse the mansion, escaping with both their life and the *Star of Mewar* diamond.
*   **Turn 50: The Midnight Hour:**
    If the gate is not opened by Turn 50, the desert Djinn manifests in the Foyer, dragging the player's soul into the mirrors of the Sheesh Mahal.

---

## 9. AI Prompt & Parser Architecture

The Gemini AI receives the parsed action and state details. It is directed to behave as a standard text-adventure parser:
1.  Verify if the verb is valid for the current situation.
2.  If the input command is nonsense or unsupported, respond with a retro text-adventure error (e.g., `That is not a verb I recognize.` or `You cannot do that here.`) and apply appropriate minor penalties.
3.  Format output strictly as JSON.
4.  Maintain a **dark, witty, and ominous tone** reflecting a cursed 19th-century Rajasthani mansion.

### Sample AI Prompt Frame
```
System Prompt:
You are a text-adventure parser and storyteller for a haunted Rajasthani mansion escape game.
The player has typed a command. Based on the player's location, stats, and inventory, determine what happens.
You must adopt a dark, witty, and ominous tone, delivering dry humor and grim, ghostly descriptions of the environment.

Reply only with a valid JSON object matching this schema:
{
  "storyText": "Ominous description of what happens after their action, written in a dark, witty style.",
  "objective": "Current task in the mansion.",
  "stateUpdates": {
    "sanityChange": -10, // Optional stat adjustments
    "oilChange": 0,
    "addInventory": "Bronze Key", // Optional items to add
    "removeInventory": "Oil Flask", // Optional items to consume
    "setKeyCollected": "bronze" // 'bronze'|'silver'|'gold'
  }
}
```

---

## 10. Technical Architecture, State Management, and AI Guardrails

### 10.1. Command Input & Validation
*   The input uses standard keyboard listeners. Pressing `Enter` triggers submission.
*   Common movement commands are resolved by the client's local parser immediately without firing API requests, preserving turns and tokens.

### 10.2. Generative Guardrails for Text Input
*   If the user enters random characters or insensible commands (e.g. `gdsghsk`), the prompt instructs the AI to respond:
    `That is not a verb I recognize.`
    No turns are consumed for unrecognizable syntax, just like Zork (e.g. Zork's `That isn't available.` or `I beg your pardon?`). This makes the game feel highly nostalgic and fair.

### 10.3. State & Context Memory
*   React holds the state.
*   Local storage is used for a reload warning. A warning modal prevents accidental resets.
*   We use a short-memory sliding window: only the current state structure and the immediate last command are sent to the AI to prevent token bloat and hallucination.

### 10.4. Instruction Button & Modal Flow
*   An **Instruction Overlay Modal** is rendered on top of the CRT view.
*   It displays a categorized cheat sheet of verbs, items, and movements.
*   It is triggered by clicking the `[HELP]` button on the top status header or by typing the `help` command in the terminal.
*   Pressing `Esc` or clicking `[CLOSE]` closes the modal, focusing the input field automatically.
