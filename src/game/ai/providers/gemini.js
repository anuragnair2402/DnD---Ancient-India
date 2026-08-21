// Gemini cloud adapter. Mirrors the original ai.js Gemini integration, adapted to the
// harness JSON contract (system + user -> { text } or throws).
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function geminiGenerateJson(apiKey, system, user, opts = {}) {
  const ai = new GoogleGenerativeAI(apiKey);
  const model = ai.getGenerativeModel({
    model: opts.model || 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxTokens ?? 350
    }
  });
  const prompt = `System Instruction Context: ${system}\n\n${user}`;
  const result = await model.generateContent(prompt);
  return parseJson(result.response.text());
}

export function parseJson(text) {
  let cleaned = (text || '').trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '').trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw e;
  }
}
