// Provider adapter — resolve which LLM backend to use, and wrap Gemini + WebLLM.
// The director decides priority: gemini (key) > webllm (ready) > offline.

export function resolveMode(config) {
  if (config && config.geminiApiKey) return 'gemini';
  if (config && config.webllmReady) return 'webllm';
  return 'offline';
}

export function providerLabel(mode) {
  return { gemini: 'Gemini (cloud)', webllm: 'Gemma 2 (in-browser WebGPU)', offline: 'Offline (built-in)' }[mode] || 'Offline';
}
