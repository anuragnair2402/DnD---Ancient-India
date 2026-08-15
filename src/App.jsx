import React, { useState, useEffect, useRef } from 'react';
import { audio } from './components/AudioEngine';
import HelpModal from './components/HelpModal';
import CharacterCreator from './components/CharacterCreator';
import MansionMap from './components/MansionMap';
import { executeLocalCommand, rooms, GATES, checkRiddleAnswer } from './services/localStory';
import { 
  generateStoryResponse, 
  evaluateRiddleSemanticAI,
  initWebLLMEngine, 
  isWebGPUSupported, 
  isWebLLMReady, 
  DEFAULT_LOCAL_MODEL 
} from './services/ai';
import { Volume2, VolumeX, ShieldAlert, Key, Cpu, HelpCircle } from 'lucide-react';

export default function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [aiMode, setAiMode] = useState(localStorage.getItem('mansion_ai_mode') || (isWebGPUSupported() ? 'webllm' : 'offline'));
  const [playMode, setPlayMode] = useState('menu'); // 'menu' | 'loading_model' | 'creator' | 'playing' | 'gameover' | 'victory'
  
  // WebLLM Model loading state
  const [modelProgress, setModelProgress] = useState({ progress: 0, text: 'Initializing neural core...' });
  const [modelError, setModelError] = useState('');

  // Gate Riddle Challenge State
  const [activeRiddleGate, setActiveRiddleGate] = useState(null);
  const [unlockedGates, setUnlockedGates] = useState({});

  // Player State
  const [player, setPlayer] = useState({
    name: '',
    class: '',
    stats: { sanity: 100, maxSanity: 100, resolve: 10, perception: 10, courage: 10, terror: 10 },
    inventory: []
  });

  // Game Lifecycle State
  const [gameState, setGameState] = useState({
    currentRoom: 'Front Foyer',
    turn: 1,
    oilReserve: 100,
    objective: 'Search the Foyer and look for a way deeper into the mansion.',
    log: []
  });

  const [keysCollected, setKeysCollected] = useState({
    bronze: false,
    silver: false,
    gold: false
  });

  // Input & UI States
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [restartConfirmOpen, setRestartConfirmOpen] = useState(false);
  const [screenGlitch, setScreenGlitch] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);

  const feedRef = useRef(null);
  const inputRef = useRef(null);

  // Focus helper
  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Auto-scroll to bottom of the feed
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [gameState.log, isGenerating]);

  // Handle browser reload prompt
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (playMode === 'playing') {
        const msg = "You are about to exit this cursed mansion. All accumulated progress in this session will be lost forever.";
        e.returnValue = msg;
        return msg;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [playMode]);

  // Audio ambient hum startup
  useEffect(() => {
    if (playMode === 'playing' && !audioMuted) {
      audio.startAmbientHum();
    } else {
      audio.stopAmbientHum();
    }
    return () => audio.stopAmbientHum();
  }, [playMode, audioMuted]);

  // Check victory / game over
  useEffect(() => {
    if (playMode !== 'playing') return;

    if (player.stats.sanity <= 0) {
      setPlayMode('gameover');
      audio.playBellToll();
      setGameState(prev => ({
        ...prev,
        log: [...prev.log, { type: 'system', text: "\n=== SANITY EXHAUSTED ===\nYour mind fractures completely under the weight of the mansion's terror. Your eyes roll back as you join the ghostly chorus, forever trapped in the Sheesh Mahal mirrors." }]
      }));
    } else if (gameState.turn > 50) {
      setPlayMode('gameover');
      audio.playBellToll();
      setGameState(prev => ({
        ...prev,
        log: [...prev.log, { type: 'system', text: "\n=== THE MIDNIGHT HOUR STRIKES ===\nYour 50 turns have run out. The heavy bell in the courtyard tolls twelve. A freezing shadow wraps around you as the desert Djinn manifests in the Foyer, ripping the soul from your flesh." }]
      }));
    }
  }, [player.stats.sanity, gameState.turn, playMode]);

  // Save AI mode
  const handleSelectAiMode = (mode) => {
    setAiMode(mode);
    localStorage.setItem('mansion_ai_mode', mode);
    audio.playBleep(520, 0.05);
  };

  // Save API key
  const handleSaveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    audio.playBleep(660, 0.08);
  };

  // Start adventure handler (triggers WebLLM preload if selected)
  const handleProceedToCharacterCreation = async () => {
    setModelError('');
    if (aiMode === 'webllm' && !isWebLLMReady()) {
      if (!isWebGPUSupported()) {
        setModelError("WebGPU is not supported on this browser. Falling back to offline mode.");
        setAiMode('offline');
        localStorage.setItem('mansion_ai_mode', 'offline');
        setPlayMode('creator');
        return;
      }

      setPlayMode('loading_model');
      try {
        await initWebLLMEngine(DEFAULT_LOCAL_MODEL, (report) => {
          const pct = Math.round((report.progress || 0) * 100);
          setModelProgress({
            progress: pct,
            text: report.text || 'Downloading and caching neural weights...'
          });
        });
        setPlayMode('creator');
        audio.playItemAcquired();
      } catch (err) {
        console.error("WebLLM boot error:", err);
        setModelError(err.message || 'Failed to initialize in-browser AI. Switching to classic offline mode.');
        setAiMode('offline');
        setTimeout(() => {
          setPlayMode('creator');
        }, 1800);
      }
    } else {
      setPlayMode('creator');
      audio.playBleep(660, 0.08);
    }
  };

  const handleStartGame = (creatorData) => {
    setPlayer({
      name: creatorData.name,
      class: creatorData.class,
      stats: creatorData.stats,
      inventory: creatorData.inventory
    });
    
    setUnlockedGates({});
    setActiveRiddleGate(null);

    const aiBanner = aiMode === 'webllm' 
      ? '[AI Narrative: Qwen 2.5 In-Browser WebGPU]'
      : (aiMode === 'gemini' && apiKey ? '[AI Narrative: Gemini Cloud]' : '[AI Narrative: Offline Rules]');

    const initialText = `MANSION ESCAPE: THE STAR OF MEWAR
${aiBanner}
------------------------------------------------------------------
You slip through a high, broken stone Jharokha window, dropping onto the dusty floorboards. Behind you, the massive iron-studded foyer gates slam shut with an echo that shakes the cobwebs. The brass lock snaps shut with a cold click. You are trapped.

The damp scent of decaying sandalwood hangs in the air. Each passage in this haveli is sealed by an ancient Rajput spirit ward. You must solve the Gate Riddles and recover the Bronze, Silver, and Gold Keys to escape before midnight (50 turns).

${rooms['Front Foyer'].description}`;

    setGameState({
      currentRoom: 'Front Foyer',
      turn: 1,
      oilReserve: 100,
      objective: 'Search the Foyer and solve the riddle at the north archway.',
      log: [{ type: 'narrative', text: initialText }]
    });

    setKeysCollected({ bronze: false, silver: false, gold: false });
    setPlayMode('playing');
    audio.playCreak();
  };

  const handleCommandSubmit = async (e, commandOverride) => {
    if (e) e.preventDefault();
    const cmd = (commandOverride !== undefined ? commandOverride : inputValue).trim();
    if (!cmd) return;

    if (commandOverride === undefined) {
      setInputValue('');
    }
    audio.playBleep(440, 0.04);

    // 1. Log the typed command
    setGameState(prev => ({
      ...prev,
      log: [...prev.log, { type: 'command', text: `> ${cmd}` }]
    }));

    const norm = cmd.toLowerCase().trim();
    
    // System commands
    if (norm === 'help') {
      setHelpOpen(true);
      return;
    }
    if (norm === 'restart') {
      setRestartConfirmOpen(true);
      return;
    }
    if (norm === 'inventory' || norm === 'i') {
      const invText = player.inventory.length > 0 
        ? `You are carrying:\n${player.inventory.map(item => `• ${item}`).join('\n')}`
        : "Your hands are empty. You carry nothing.";
      setGameState(prev => ({
        ...prev,
        log: [...prev.log, { type: 'narrative', text: invText }]
      }));
      return;
    }

    // Handle gate escape victory logic
    if ((norm === 'unlock gate' || norm === 'unlock gates' || norm === 'open gate' || norm === 'escape') && gameState.currentRoom === 'Front Foyer') {
      if (keysCollected.bronze && keysCollected.silver && keysCollected.gold) {
        setPlayMode('victory');
        audio.playBellToll();
        const score = 50 - gameState.turn;
        const victoryText = `\n=== VICTORY ===\nYou slide the Bronze, Silver, and Gold Keys into the three heavy locks. With a grinding scream of rusted iron, the massive gates swing outward. You tumble out into the cool desert air of Rajasthan, clutching the Star of Mewar diamond under the starry sky.\n\nScore: ${score} points\nMoves taken: ${gameState.turn}/50`;
        setGameState(prev => ({
          ...prev,
          log: [...prev.log, { type: 'system', text: victoryText }]
        }));
      } else {
        const missingKeys = [];
        if (!keysCollected.bronze) missingKeys.push("Bronze");
        if (!keysCollected.silver) missingKeys.push("Silver");
        if (!keysCollected.gold) missingKeys.push("Gold");
        setGameState(prev => ({
          ...prev,
          log: [...prev.log, { type: 'narrative', text: `The exit gate remains sealed. You are missing the following keys: ${missingKeys.join(', ')}.` }]
        }));
      }
      return;
    }

    // 2. Active Riddle Evaluation
    if (activeRiddleGate) {
      const gate = GATES[activeRiddleGate];
      
      // Check if player is navigating away instead of answering
      const currentRoomData = rooms[gameState.currentRoom];
      const isTryingAnotherMovement = currentRoomData.exits[norm] !== undefined;
      const targetRoom = currentRoomData.exits[norm];
      const newGateKey = `${gameState.currentRoom}->${targetRoom}`;

      if (isTryingAnotherMovement && newGateKey !== activeRiddleGate) {
        // Player is moving in a different direction, clear current active riddle and process movement
        setActiveRiddleGate(null);
      } else {
        // Evaluate the riddle answer
        let answerResult = checkRiddleAnswer(activeRiddleGate, cmd);

        // If local string match failed but AI mode is on, test semantic AI evaluation
        if (!answerResult.correct && (aiMode === 'webllm' || (aiMode === 'gemini' && apiKey))) {
          setIsGenerating(true);
          try {
            const aiEval = await evaluateRiddleSemanticAI(
              { mode: aiMode, apiKey },
              gate.riddle,
              cmd,
              gate.answers
            );
            if (aiEval && aiEval.correct) {
              answerResult = { correct: true, gate };
            }
          } catch (err) {
            console.warn("AI riddle check error:", err);
          } finally {
            setIsGenerating(false);
          }
        }

        if (answerResult.correct) {
          // Riddle solved!
          audio.playItemAcquired();
          const targetRoomName = activeRiddleGate.split('->')[1];
          const reverseGateKey = `${targetRoomName}->${gameState.currentRoom}`;
          const newUnlocked = { 
            ...unlockedGates, 
            [activeRiddleGate]: true,
            [reverseGateKey]: true
          };
          setUnlockedGates(newUnlocked);
          setActiveRiddleGate(null);

          const targetRoomData = rooms[targetRoomName];

          setGameState(prev => ({
            ...prev,
            currentRoom: targetRoomName,
            turn: prev.turn + 1,
            oilReserve: Math.max(0, prev.oilReserve - 2),
            log: [
              ...prev.log, 
              { type: 'narrative', text: `[RIDDLE SOLVED!]\n${gate.successText}\n\n${targetRoomData.name.toUpperCase()}\n${targetRoomData.description}` }
            ]
          }));
          return;
        } else {
          // Wrong answer penalty
          audio.playSanityDamage();
          setScreenGlitch(true);
          setTimeout(() => setScreenGlitch(false), 220);

          setPlayer(prev => ({
            ...prev,
            stats: { ...prev.stats, sanity: Math.max(0, prev.stats.sanity - 5) }
          }));

          setGameState(prev => ({
            ...prev,
            turn: prev.turn + 1,
            oilReserve: Math.max(0, prev.oilReserve - 2),
            log: [
              ...prev.log,
              { 
                type: 'narrative', 
                text: `[INCORRECT ANSWER]\nThe spectral ward pulses with a harsh, chilling light. A voice whispers: "Wrong, mortal." (Sanity -5)\n\nHint: ${gate.hint}\nTry answering again, or type another command to move away.` 
              }
            ]
          }));
          return;
        }
      }
    }

    // 3. Movement with Gate Riddle Check
    const currentRoomData = rooms[gameState.currentRoom];
    const isMovement = currentRoomData.exits[norm] !== undefined;

    if (isMovement) {
      const localResult = executeLocalCommand(
        { 
          currentRoom: gameState.currentRoom, 
          inventory: player.inventory, 
          objective: gameState.objective,
          playerClass: player.class,
          stats: player.stats
        },
        cmd,
        unlockedGates
      );

      if (localResult.requiresRiddle) {
        audio.playGhostSpotted();
        setActiveRiddleGate(localResult.gateKey);
        setGameState(prev => ({
          ...prev,
          objective: localResult.objective,
          log: [...prev.log, { type: 'narrative', text: localResult.storyText }]
        }));
        return;
      }

      audio.playCreak();

      setGameState(prev => ({
        ...prev,
        currentRoom: localResult.stateUpdates.currentRoom || prev.currentRoom,
        turn: prev.turn + 1,
        oilReserve: Math.max(0, prev.oilReserve - 2),
        objective: localResult.objective || prev.objective,
        log: [...prev.log, { type: 'narrative', text: localResult.storyText }]
      }));
      return;
    }

    // 4. AI Narrative & Lore Commands
    const isAiExplicitCommand = norm.startsWith('< examine') || norm.startsWith('<examine');
    const shouldUseAi = isAiExplicitCommand || (aiMode === 'webllm' && norm.startsWith('examine'));

    setIsGenerating(true);

    try {
      let result;
      if (shouldUseAi && (aiMode === 'webllm' || (aiMode === 'gemini' && apiKey))) {
        const cleanCmd = cmd.replace(/^<\s*/, '');
        result = await generateStoryResponse(
          { mode: aiMode, apiKey },
          {
            currentRoom: gameState.currentRoom,
            stats: player.stats,
            inventory: player.inventory,
            oilReserve: gameState.oilReserve,
            keysCollected,
            turn: gameState.turn,
            objective: gameState.objective
          },
          cleanCmd
        );
      } else {
        result = executeLocalCommand({
          currentRoom: gameState.currentRoom,
          inventory: player.inventory,
          objective: gameState.objective,
          playerClass: player.class,
          stats: player.stats
        }, cmd, unlockedGates);
      }

      const updates = result.stateUpdates || {};
      
      // Sanity Change
      if (updates.sanityChange) {
        const sChange = Number(updates.sanityChange);
        if (sChange < 0) {
          audio.playSanityDamage();
          setScreenGlitch(true);
          setTimeout(() => setScreenGlitch(false), 220);
        }
        setPlayer(prev => ({
          ...prev,
          stats: {
            ...prev.stats,
            sanity: Math.max(0, Math.min(100, prev.stats.sanity + sChange))
          }
        }));
      }

      // Inventory additions
      if (updates.addInventory) {
        const toAdd = updates.addInventory;
        if (!player.inventory.includes(toAdd) && player.inventory.length < 6) {
          audio.playItemAcquired();
          setPlayer(prev => ({
            ...prev,
            inventory: [...prev.inventory, toAdd]
          }));
        } else if (player.inventory.length >= 6) {
          result.storyText += "\n(Your inventory slots are full. You must drop something first.)";
        }
      }

      // Inventory removals
      if (updates.removeInventory) {
        const toRemove = updates.removeInventory;
        setPlayer(prev => ({
          ...prev,
          inventory: prev.inventory.filter(item => item !== toRemove)
        }));
      }

      // Keys collected
      if (updates.setKeyCollected) {
        const keyColor = updates.setKeyCollected;
        if (keyColor in keysCollected) {
          setKeysCollected(prev => ({
            ...prev,
            [keyColor]: true
          }));
        }
      }

      // Update state
      let nextRoom = gameState.currentRoom;
      if (updates.currentRoom && rooms[updates.currentRoom]) {
        nextRoom = updates.currentRoom;
        audio.playCreak();
      }

      setGameState(prev => ({
        ...prev,
        currentRoom: nextRoom,
        turn: prev.turn + 1,
        oilReserve: Math.max(0, prev.oilReserve - 2 + (updates.oilChange || 0)),
        objective: result.objective || prev.objective,
        log: [...prev.log, { type: 'narrative', text: result.storyText }]
      }));

    } catch (err) {
      console.warn("Command execution fallback:", err);
      const fallbackResult = executeLocalCommand({
        currentRoom: gameState.currentRoom,
        inventory: player.inventory,
        objective: gameState.objective,
        playerClass: player.class,
        stats: player.stats
      }, cmd, unlockedGates);

      setGameState(prev => ({
        ...prev,
        log: [...prev.log, { type: 'narrative', text: fallbackResult.storyText }]
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleMute = () => {
    const isMuted = audio.toggleMute();
    setAudioMuted(isMuted);
  };

  return (
    <div className="crt-container">
      <div className="crt-bezel">
        <div className={`crt-screen ${screenGlitch ? 'screen-glitch' : ''}`}>
          <div className="crt-scanlines"></div>

          {/* Playing Interface */}
          {playMode === 'playing' && (
            <div className="game-container">
              {/* Left Column: Terminal Console */}
              <div className="main-content-column">
                {/* Header Status Bar */}
                <div className="status-header">
                  <div className="status-header-segment">
                    <span>{gameState.currentRoom.toUpperCase()}</span>
                  </div>
                  <div className="status-header-segment">
                    <span className={player.stats.sanity < 40 ? 'red-glow-text' : ''}>
                      SANITY: {player.stats.sanity}%
                    </span>
                    <span>MOVES: {gameState.turn}/50</span>
                    <span>OIL: {gameState.oilReserve}%</span>
                  </div>
                  <div className="status-header-segment" style={{ gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginRight: '8px' }}>
                      {keysCollected.bronze && <Key size={14} style={{ color: '#cd7f32' }} title="Bronze Key" />}
                      {keysCollected.silver && <Key size={14} style={{ color: '#c0c0c0' }} title="Silver Key" />}
                      {keysCollected.gold && <Key size={14} style={{ color: '#ffd700' }} title="Gold Key" />}
                    </div>
                    <button className="help-btn" onClick={() => setRestartConfirmOpen(true)}>[MENU]</button>
                    <button className="help-btn" onClick={() => setHelpOpen(true)}>[HELP]</button>
                    <button className="help-btn" onClick={toggleMute}>
                      {audioMuted ? <VolumeX size={10} /> : <Volume2 size={10} />}
                    </button>
                  </div>
                </div>

                {/* Log Feed */}
                <div className="terminal-feed" ref={feedRef} onClick={focusInput}>
                  {gameState.log.map((line, idx) => (
                    <div 
                      key={idx} 
                      className={`terminal-line ${line.type === 'command' ? 'player-input-line' : 'glow-text'} ${line.type === 'system' ? 'red-glow-text' : ''}`}
                    >
                      {line.text}
                    </div>
                  ))}
                  
                  {isGenerating && (
                    <div className="terminal-line typewriter-text dim-text">
                      Consulting ancient lore...
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <form className="input-area-container" onSubmit={handleCommandSubmit}>
                  <span className="input-prompt" style={{ color: activeRiddleGate ? 'var(--sanity-red)' : 'var(--terminal-amber)' }}>
                    {activeRiddleGate ? 'RIDDLE>' : '>'}
                  </span>
                  <input
                    ref={inputRef}
                    type="text"
                    className="input-field"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={isGenerating}
                    placeholder={activeRiddleGate ? "Type riddle answer here..." : "Type command here (e.g. look, go north, open trunk)..."}
                    autoComplete="off"
                    autoFocus
                  />
                </form>
              </div>

              {/* Right Column: Map & Command Help */}
              <div className="sidebar-column">
                {/* Map Panel */}
                <div className="map-panel">
                  <div className="panel-title">
                    <span>Mansion Floor Plan</span>
                    <span style={{ fontSize: '9px', color: 'var(--terminal-dim)' }}>🟢=Open 🔴=Riddle</span>
                  </div>
                  
                  <div className="map-canvas-container">
                    <MansionMap currentRoom={gameState.currentRoom} unlockedGates={unlockedGates} />
                  </div>
                </div>

                {/* Command Reference Help Panel */}
                <div className="help-panel" style={{ flex: 1, overflowY: 'auto' }}>
                  <div className="panel-title">
                    <span>Quest & Guides</span>
                    <span style={{ fontSize: '9px', color: 'var(--terminal-amber)' }}>
                      {aiMode === 'webllm' ? '● WebLLM' : (aiMode === 'gemini' ? '● Gemini' : '○ Offline')}
                    </span>
                  </div>
                  <div className="sidebar-help-list">
                    <h3>Current Objective</h3>
                    <p style={{ color: '#ffea53', fontStyle: 'italic' }}>{gameState.objective}</p>

                    <h3>Gate Riddles</h3>
                    <p>• Entering new wings triggers a spirit gate riddle.</p>
                    <p>• Type the answer word to unseal the gate.</p>

                    <h3>Basic Verbs</h3>
                    <p>• <strong>north / south / east / west / up / down</strong></p>
                    <p>• <strong>take [item]</strong> / <strong>open [object]</strong> / <strong>use [item]</strong></p>
                    <p>• <strong>examine [object]</strong> (or <strong>&lt; examine</strong>)</p>
                    <p>• <strong>look</strong> / <strong>inventory</strong> / <strong>escape</strong></p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Model Loading Screen */}
          {playMode === 'loading_model' && (
            <div className="api-container">
              <Cpu size={48} className="glow-text" style={{ marginBottom: '16px' }} />
              <h2 className="creator-title glow-text" style={{ fontSize: '24px', marginBottom: '16px' }}>
                BOOTING IN-BROWSER AI CORE
              </h2>
              <p style={{ maxWidth: '540px', margin: '0 auto 20px', fontSize: '16px', color: 'var(--terminal-dim)' }}>
                Downloading Qwen 2.5 into browser WebGPU cache. This happens once; future sessions load instantly from local memory.
              </p>

              <div style={{ width: '100%', maxWidth: '480px', margin: '20px auto' }}>
                <div style={{
                  width: '100%',
                  height: '24px',
                  border: '2px solid var(--terminal-amber)',
                  backgroundColor: 'var(--bg-panel)',
                  padding: '2px',
                  position: 'relative'
                }}>
                  <div style={{
                    width: `${modelProgress.progress}%`,
                    height: '100%',
                    backgroundColor: 'var(--terminal-amber)',
                    transition: 'width 0.2s ease'
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '14px' }}>
                  <span className="dim-text">{modelProgress.text}</span>
                  <span className="glow-text">{modelProgress.progress}%</span>
                </div>
              </div>

              {modelError && (
                <p className="red-glow-text" style={{ fontSize: '15px', marginTop: '16px' }}>
                  {modelError}
                </p>
              )}
            </div>
          )}

          {/* Title / Main Menu */}
          {playMode === 'menu' && (
            <div className="api-container">
              <h1 className="creator-title glow-text" style={{ fontSize: '36px', marginBottom: '16px' }}>
                MANSION ESCAPE
              </h1>
              <p style={{ maxWidth: '620px', margin: '0 auto 24px', lineHeight: '1.4' }}>
                A retro horror interactive text adventure set in a cursed 19th-century Rajasthani Haveli. Solve spirit gate riddles, recover the 3 royal keys, and escape before the midnight hour.
              </p>

              {/* AI Engine Selection Box */}
              <div style={{ 
                width: '100%', 
                maxWidth: '560px', 
                border: '1px solid var(--terminal-dim)', 
                borderRadius: '6px', 
                padding: '16px', 
                background: 'var(--bg-panel)',
                marginBottom: '24px',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--terminal-amber)', fontFamily: 'var(--font-pixel)', fontSize: '11px' }}>
                  <Cpu size={14} /> SELECT AI NARRATIVE & RIDDLE ENGINE
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* WebLLM Option */}
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    cursor: 'pointer',
                    padding: '8px',
                    border: aiMode === 'webllm' ? '1px solid var(--terminal-amber)' : '1px solid transparent',
                    background: aiMode === 'webllm' ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                    borderRadius: '4px'
                  }}>
                    <input 
                      type="radio" 
                      name="aiMode" 
                      value="webllm" 
                      checked={aiMode === 'webllm'} 
                      onChange={() => handleSelectAiMode('webllm')} 
                    />
                    <div>
                      <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Local In-Browser AI (Qwen 2.5 via WebGPU)</span>
                        <span style={{ fontSize: '11px', background: '#302213', color: '#ffb03a', padding: '1px 6px', borderRadius: '3px' }}>RECOMMENDED</span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--terminal-dim)' }}>
                        100% private, zero API key required. Generates dynamic atmospheric descriptions and judges riddles.
                      </div>
                    </div>
                  </label>

                  {/* Gemini Cloud Option */}
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    cursor: 'pointer',
                    padding: '8px',
                    border: aiMode === 'gemini' ? '1px solid var(--terminal-amber)' : '1px solid transparent',
                    background: aiMode === 'gemini' ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                    borderRadius: '4px'
                  }}>
                    <input 
                      type="radio" 
                      name="aiMode" 
                      value="gemini" 
                      checked={aiMode === 'gemini'} 
                      onChange={() => handleSelectAiMode('gemini')} 
                    />
                    <div>
                      <div style={{ fontWeight: 'bold' }}>Gemini Cloud AI (API Key)</div>
                      <div style={{ fontSize: '13px', color: 'var(--terminal-dim)' }}>
                        Powered by Google Gemini 2.0 Flash. Requires your personal API key.
                      </div>
                    </div>
                  </label>

                  {/* Offline Rules Option */}
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    cursor: 'pointer',
                    padding: '8px',
                    border: aiMode === 'offline' ? '1px solid var(--terminal-amber)' : '1px solid transparent',
                    background: aiMode === 'offline' ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                    borderRadius: '4px'
                  }}>
                    <input 
                      type="radio" 
                      name="aiMode" 
                      value="offline" 
                      checked={aiMode === 'offline'} 
                      onChange={() => handleSelectAiMode('offline')} 
                    />
                    <div>
                      <div style={{ fontWeight: 'bold' }}>Classic Offline Engine (0 MB Download)</div>
                      <div style={{ fontSize: '13px', color: 'var(--terminal-dim)' }}>
                        Deterministic rule-based Zork parser with ancient Rajasthani riddles.
                      </div>
                    </div>
                  </label>
                </div>

                {/* API Key field only if Gemini mode is chosen */}
                {aiMode === 'gemini' && (
                  <div style={{ marginTop: '14px', borderTop: '1px dashed var(--terminal-dim)', paddingTop: '12px' }}>
                    <label style={{ fontSize: '14px' }}>&gt; GEMINI API KEY:</label>
                    <input
                      type="password"
                      className="api-input"
                      style={{ margin: '8px 0', fontSize: '16px' }}
                      value={apiKey}
                      onChange={(e) => handleSaveApiKey(e.target.value)}
                      placeholder="Paste Gemini API key here..."
                    />
                  </div>
                )}
              </div>

              <button 
                className="retro-btn"
                style={{ padding: '12px 36px', fontSize: '16px' }}
                onClick={handleProceedToCharacterCreation}
              >
                START ADVENTURE
              </button>
            </div>
          )}

          {/* Character Creator */}
          {playMode === 'creator' && (
            <CharacterCreator 
              onComplete={handleStartGame}
              onBack={() => setPlayMode('menu')}
            />
          )}

          {/* Game Over Screen */}
          {playMode === 'gameover' && (
            <div className="api-container">
              <h1 className="creator-title red-glow-text" style={{ fontSize: '32px', marginBottom: '16px' }}>
                YOU PERISHED
              </h1>
              <p style={{ maxWidth: '600px', margin: '20px auto', color: 'var(--sanity-red)' }}>
                Your journey through Thakur Vikram Singh's estate has reached a grim conclusion. The mansion adds another whispering soul to its ancient halls.
              </p>
              <button 
                className="retro-btn danger"
                style={{ marginTop: '24px' }}
                onClick={() => { setPlayMode('menu'); audio.playBleep(); }}
              >
                &gt; TRY AGAIN
              </button>
            </div>
          )}

          {/* Victory Screen */}
          {playMode === 'victory' && (
            <div className="api-container">
              <h1 className="creator-title glow-text" style={{ fontSize: '32px', color: '#ffea53' }}>
                ESCAPE SUCCESSFUL
              </h1>
              <p style={{ maxWidth: '600px', margin: '20px auto' }}>
                You have solved the ancient spirit riddles, collected the three royal keys, and escaped the cursed estate with the legendary Star of Mewar diamond!
              </p>
              <button 
                className="retro-btn"
                style={{ marginTop: '24px' }}
                onClick={() => { setPlayMode('menu'); audio.playBleep(); }}
              >
                &gt; PLAY AGAIN
              </button>
            </div>
          )}

          {/* In-app modals */}
          <HelpModal 
            isOpen={helpOpen} 
            onClose={() => { setHelpOpen(false); focusInput(); }}
          />

          {/* Restart Warning Modal */}
          {restartConfirmOpen && (
            <div className="modal-overlay" onClick={() => { setRestartConfirmOpen(false); focusInput(); }}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header" style={{ color: 'var(--sanity-red)', borderColor: 'var(--sanity-red)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldAlert size={18} /> WARNING
                  </span>
                </div>
                <div className="modal-body" style={{ color: 'var(--sanity-red)' }}>
                  You are about to exit this cursed mansion. All accumulated keys, sanity, and progress in this session will be lost forever. Do you wish to restart?
                </div>
                <div className="modal-footer">
                  <button 
                    className="retro-btn" 
                    onClick={() => { setRestartConfirmOpen(false); focusInput(); }}
                  >
                    CANCEL
                  </button>
                  <button 
                    className="retro-btn danger" 
                    onClick={() => {
                      setRestartConfirmOpen(false);
                      setPlayMode('menu');
                      audio.playBleep();
                    }}
                  >
                    RESTART
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
