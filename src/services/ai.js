// In-Browser WebLLM (Qwen 2.5) & Gemini Cloud AI Integration Service for Mansion Escape
import { GoogleGenerativeAI } from '@google/generative-ai';

// Default lightweight model that runs fast and fits inside browser WebGPU cache
export const DEFAULT_LOCAL_MODEL = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";
export const HIGHER_QUALITY_MODEL = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC";

let mlcEngine = null;
let isInitializing = false;

// System instructions describing the parser behavior, setting, and tone.
export const SYSTEM_INSTRUCTIONS = `You are an interactive text-adventure parser and dark narrator for "Mansion Escape", a 1980s retro horror game set in a haunted 19th-century royal Rajasthani haveli of Thakur Vikram Singh.
The mansion is cursed, shifting, and locked by three keys: Bronze, Silver, and Gold. In order to enter each new wing of the haveli, the player must solve ancient spirit gate riddles.

You must adopt a dark, witty, and ominous Rajput-gothic tone. Deliver chilling sensory details, eerie local folklore (ghungroos, desert Djinn, Yakshas, mirrors of Sheesh Mahal), and dry wit.

You MUST parse the player's action and return ONLY a valid JSON object matching this schema:
{
  "storyText": "Chilling, atmospheric narrative response to the player's command.",
  "objective": "Current quest objective.",
  "stateUpdates": {
    "sanityChange": -5,
    "oilChange": 0,
    "addInventory": "Bronze Key",
    "removeInventory": "Matches",
    "setKeyCollected": "bronze",
    "currentRoom": "Zenana Wing"
  }
}
Note: stateUpdates fields are optional. Only include fields that actually change. Do NOT enclose output in markdown blocks. Output pure JSON only.`;

// Check if browser supports WebGPU
export function isWebGPUSupported() {
  return typeof navigator !== 'undefined' && Boolean(navigator.gpu);
}

// Initialize WebLLM engine with progress feedback
export async function initWebLLMEngine(modelId = DEFAULT_LOCAL_MODEL, onProgress = null) {
  if (mlcEngine) return mlcEngine;
  if (isInitializing) {
    while (isInitializing) {
      await new Promise(r => setTimeout(r, 150));
    }
    if (mlcEngine) return mlcEngine;
  }

  if (!isWebGPUSupported()) {
    throw new Error("WebGPU is not supported on this browser/device. Please use Chrome, Edge, Safari 17+, or Arc with WebGPU enabled.");
  }

  isInitializing = true;
  try {
    const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
    
    mlcEngine = await CreateMLCEngine(modelId, {
      initProgressCallback: (report) => {
        if (onProgress) {
          onProgress(report);
        }
      }
    });
    return mlcEngine;
  } finally {
    isInitializing = false;
  }
}

export function isWebLLMReady() {
  return Boolean(mlcEngine);
}

// Helper to clean and parse JSON from LLM output
function parseJsonOutput(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/i, '');
    cleaned = cleaned.replace(/\n?```$/, '');
  }
  return JSON.parse(cleaned.trim());
}

// Generate story response using local in-browser WebLLM
export async function generateLocalWebLLMResponse(state, command) {
  if (!mlcEngine) {
    throw new Error("WebLLM Engine is not initialized.");
  }

  const prompt = `Current Player State:
- Location: ${state.currentRoom}
- Sanity: ${state.stats.sanity}/100, Resolve: ${state.stats.resolve}, Perception: ${state.stats.perception}, Courage: ${state.stats.courage}
- Oil Reserve: ${state.oilReserve}%
- Keys: Bronze=${state.keysCollected.bronze}, Silver=${state.keysCollected.silver}, Gold=${state.keysCollected.gold}
- Inventory: [${state.inventory.join(', ')}]
- Turn: ${state.turn}/50
- Objective: ${state.objective}

Player Command: "${command}"

Evaluate the command and respond with the required JSON object.`;

  const response = await mlcEngine.chat.completions.create({
    messages: [
      { role: "system", content: SYSTEM_INSTRUCTIONS },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 350
  });

  const rawContent = response.choices[0]?.message?.content || '{}';
  return parseJsonOutput(rawContent);
}

// Generate story response using Gemini Cloud API
export async function generateGeminiResponse(apiKey, state, command) {
  const ai = new GoogleGenerativeAI(apiKey);
  const model = ai.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json'
    }
  });

  const prompt = `System Instruction Context: ${SYSTEM_INSTRUCTIONS}

Current Player State:
- Location: ${state.currentRoom}
- Stats: Sanity ${state.stats.sanity}/100, Resolve ${state.stats.resolve}, Perception ${state.stats.perception}, Courage ${state.stats.courage}, Terror ${state.stats.terror}
- Oil Reserve: ${state.oilReserve}%
- Keys Collected: Bronze=${state.keysCollected.bronze}, Silver=${state.keysCollected.silver}, Gold=${state.keysCollected.gold}
- Current Inventory: [${state.inventory.join(', ')}]
- Turn count: ${state.turn}/50
- Current Objective: ${state.objective}

Player Command: "${command}"

Evaluate the command and return the JSON response.`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  return parseJsonOutput(responseText);
}

// Evaluate riddle answer semantically using AI if needed
export async function evaluateRiddleSemanticAI(modeConfig, riddle, playerAnswer, expectedKeywords) {
  const { mode, apiKey } = modeConfig || {};
  const prompt = `You are a riddle judge in an escape game.
Riddle: "${riddle}"
Expected concept / answers: [${expectedKeywords.join(', ')}]
Player's answer: "${playerAnswer}"

Is the player's answer semantically correct?
Respond strictly with a single JSON object:
{
  "correct": true or false,
  "explanation": "Short 1-sentence atmospheric explanation in Rajput gothic tone."
}`;

  try {
    if (mode === 'webllm' && mlcEngine) {
      const resp = await mlcEngine.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 150
      });
      return parseJsonOutput(resp.choices[0]?.message?.content || '{"correct":false}');
    } else if (mode === 'gemini' && apiKey) {
      const ai = new GoogleGenerativeAI(apiKey);
      const model = ai.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: { responseMimeType: 'application/json' }
      });
      const res = await model.generateContent(prompt);
      return parseJsonOutput(res.response.text());
    }
  } catch (e) {
    console.warn("AI riddle evaluation fallback:", e);
  }
  return null;
}

// Main dispatcher function
export async function generateStoryResponse(modeConfig, state, command) {
  const { mode, apiKey } = modeConfig || {};

  if (mode === 'webllm') {
    return await generateLocalWebLLMResponse(state, command);
  } else if (mode === 'gemini' && apiKey) {
    return await generateGeminiResponse(apiKey, state, command);
  }
  
  throw new Error("No active AI provider configured.");
}
