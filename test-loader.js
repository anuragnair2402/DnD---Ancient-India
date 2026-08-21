// A quick script to simulate the UX of the loader
console.log("Simulating handleProceedToCreator UX...");
let playMode = 'menu';
let progress = 0;

function setPlayMode(mode) {
  playMode = mode;
  console.log(`[UI Update] playMode changed to: ${playMode}`);
}

function setModelProgress(update) {
  progress = update.progress;
  console.log(`[UI Update] Progress Bar: ${progress}% - ${update.text}`);
}

async function simulateWebLLMLoad() {
  setPlayMode('loading');
  
  // Simulate WebLLM progress updates over 2 seconds
  for (let i = 1; i <= 5; i++) {
    await new Promise(r => setTimeout(r, 400));
    setModelProgress({ progress: i * 20, text: `Fetching chunk ${i}/5...` });
  }
  
  setPlayMode('creator');
}

simulateWebLLMLoad().then(() => console.log("Done!"));
