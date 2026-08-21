// In-browser WebLLM adapter — preserved and extended from the original ai.js.
// The engine is created once and reused; generateJson mirrors the Gemini contract.
import { parseJson } from './gemini.js';

export const DEFAULT_LOCAL_MODEL = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';

let mlcEngine = null;
let isInitializing = false;

export function isWebGPUSupported() {
  return typeof navigator !== 'undefined' && Boolean(navigator.gpu);
}

export async function initWebLLMEngine(modelId = DEFAULT_LOCAL_MODEL, onProgress = null) {
  if (mlcEngine) return mlcEngine;
  if (isInitializing) {
    while (isInitializing) await new Promise(r => setTimeout(r, 150));
    if (mlcEngine) return mlcEngine;
  }
  if (!isWebGPUSupported()) throw new Error('WebGPU not supported on this device/browser.');
  isInitializing = true;
  try {
    const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
    mlcEngine = await CreateMLCEngine(modelId, {
      initProgressCallback: (report) => onProgress && onProgress(report)
    });
    return mlcEngine;
  } finally {
    isInitializing = false;
  }
}

export function isWebLLMReady() {
  return Boolean(mlcEngine);
}

export async function webllmGenerateJson(system, user, opts = {}) {
  if (!mlcEngine) throw new Error('WebLLM engine not initialized.');
  const request = {
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 200
  };
  if (opts.schema) {
    request.response_format = {
      type: 'json_object',
      schema: typeof opts.schema === 'string' ? opts.schema : JSON.stringify(opts.schema)
    };
  }
  const resp = await mlcEngine.chat.completions.create(request);
  return parseJson(resp.choices[0]?.message?.content || '{}');
}
