// Gemini AI Integration Service for Mansion Escape
import { GoogleGenerativeAI } from '@google/generative-ai';

// System instructions describing the parser behavior, setting, and tone.
const SYSTEM_INSTRUCTIONS = `
You are a text-adventure parser and narrator for "Mansion Escape", a 1980s-style horror interactive fiction game.
The game is set in a haunted 19th-century Rajasthani mansion of Thakur Vikram Singh (architecturally a traditional royal "haveli" mansion), filled with local desert spirits, curses, locked doors, and shifting halls.

You must adopt a dark, witty, and ominous tone, delivering dry humor and Rajput-gothic descriptions. Mock the player's mistakes or greed, and describe their sanity loss with chilling sensory details.

Your job is to parse the player's typed command and return a response strictly formatted as a JSON object.
You must analyze the player's current location, inventory, and stats to determine if their action succeeds, fails, or triggers a specific consequence.

The mansion has three keys: Bronze, Silver, and Gold. The final objective is to retrieve the legendary "Star of Mewar" diamond from the Sheesh Mahal (Palace of Mirrors) and unlock the iron Foyer gates.

State updates:
- If an action wastes time or fails physically, you can reduce their sanity or lantern oil.
- You can add items to their inventory (e.g. "Bronze Key", "Lantern Oil", "Sacred Ash", "Star of Mewar").
- You can consume/remove items from their inventory (e.g. "Sacred Ash", "Iron Crowbar").
- Keys collected can be updated by setting "setKeyCollected" to "bronze", "silver", or "gold".

If the player's command is completely nonsense or grammatically garbage (e.g. "gdsghsk"), respond with:
"That is not a verb I recognize." or "I beg your pardon?"
Do not apply turn or stat penalties for syntax-errors.

You MUST respond ONLY with a single JSON object matching this schema. Do not enclose it in markdown blocks (like triple-backticks).
{
  "storyText": "Ominous description of what happens after their action, written in a dark, witty style.",
  "objective": "Current quest objective.",
  "stateUpdates": {
    "sanityChange": -10, // optional integer adjustment
    "oilChange": 0,       // optional integer adjustment (e.g. +30 or -10)
    "addInventory": "Bronze Key", // optional string item name to add
    "removeInventory": "Iron Crowbar", // optional string item name to remove
    "setKeyCollected": "bronze", // optional string 'bronze'|'silver'|'gold'
    "currentRoom": "Zenana Wing" // optional string to force a room movement
  }
}
`;

export async function generateStoryResponse(apiKey, state, command) {
  // Initialize the SDK
  const ai = new GoogleGenerativeAI(apiKey);
  const model = ai.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json'
    }
  });

  // Construct the prompt with the current player state snapshot
  const prompt = `
System Instruction Context: ${SYSTEM_INSTRUCTIONS}

Current Player State:
- Location: ${state.currentRoom}
- Stats: Sanity ${state.stats.sanity}/100, Resolve ${state.stats.resolve}, Perception ${state.stats.perception}, Courage ${state.stats.courage}, Terror ${state.stats.terror}
- Oil Reserve: ${state.oilReserve}%
- Keys Collected: Bronze=${state.keysCollected.bronze}, Silver=${state.keysCollected.silver}, Gold=${state.keysCollected.gold}
- Current Inventory: [${state.inventory.join(', ')}]
- Turn count: ${state.turn}/50
- Current Objective: ${state.objective}

Player Command: "${command}"

Evaluate the command and return the JSON response.
`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    // Parse to ensure it is valid JSON, cleaning markdown blocks if present
    let cleaned = responseText.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/i, '');
      cleaned = cleaned.replace(/\n?```$/, '');
    }
    return JSON.parse(cleaned.trim());
  } catch (e) {
    console.error("Gemini API error:", e);
    throw e;
  }
}

