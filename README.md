# 👁️ The Djinn of Mewar (Mansion Escape)

**A deterministic, AI-enriched text adventure set in a cursed 19th-century Rajasthani Haveli.**

*The Djinn of Mewar* (internally codenamed "Mansion Escape") is a modern re-imagining of the classic text-adventure genre (Zork, Colossal Cave). It fuses a strict, deterministic game logic engine with optional generative AI (Gemini / WebLLM) to create a highly atmospheric, infinitely replayable psychological horror experience.

---

## 🎮 Game Design Philosophy

### The "Truth Engine" Architecture
Unlike typical LLM "chat games" where the AI is the game master and hallucination breaks the game state, this project uses a strict **Truth Engine**. 
1. **The Game State is King:** The engine (in `src/game/engine/`) handles all commands, movement, inventory, sanity, and logic purely deterministically.
2. **AI as a Narrator, Not a God:** The LLM is injected only as a "flavor engine" via specific hooks (`riddleGen`, `persona`, `narrate`). It makes the world feel alive, but it can *never* mutate the game state, invent items, or break the rules. 
3. **Offline Graceful Degradation:** If the AI is unavailable, the game falls back to a curated pool of handcrafted riddles and dialogue. The game is always 100% playable offline.

### The Attrition Economy
This is not just a puzzle game; it is an attrition simulator. The player manages three critical resources:
*   **Turns (Time):** The Midnight Bell is tolling. Take too long (60 turns, or 50 in New Game+), and you die.
*   **Oil (Visibility):** The lantern burns oil every turn. If it goes out, the darkness takes a heavy toll on your mind.
*   **Sanity (The Currency of Sight):** Sanity is not just a health bar. As you lose Sanity, "The Sight" opens, allowing you to see hidden Veil rooms (like the Echo Gallery). You must willfully drive yourself mad to find the true endings, but if Sanity hits 0, your mind fractures completely.

---

## 🗺️ Documentation

As a lead game designer, I strongly believe in documenting the intended player experience. Please refer to our design documents to understand the narrative branches and systems:

*   [**Player Journey & Outcomes Analysis**](docs/PLAYER_JOURNEY.md) - Details the core loop, fail states, and the 4 possible narrative resolutions (from the false victory to the hidden "true" ending).
*   [**Design Decisions**](design_decisions.md) - The original GDD covering the themes, classes, and architectural specifications.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   NPM / Yarn

### Installation & Execution
```bash
# Install dependencies
npm install

# Run the local dev server
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Running Tests
The Truth Engine is heavily tested to ensure deterministic state mutations and intent validation.
```bash
npm run test
```

---

## 🎭 The Classes

Players can choose their approach to the house, which drastically changes their strategy:

1.  **Mercenary:** High Resolve. Starts with a crowbar, matches, and +50% extra lamp oil. The brute-force path through the physical house.
2.  **Exorcist (Tantrik):** High Courage. Highly resistant to Sanity drain. Can interact safely with the spirits and starts with Sacred Ash to part wards.
3.  **Antiquarian:** High Perception. Can easily spot hidden passages, hidden compartments, and understand the deep lore of the house.

---

*“This house was bought with a diamond and a silence. Guard it.”* — Thakur Vikram Singh, 1888
