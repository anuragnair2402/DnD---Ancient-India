import React, { useState, useEffect, useRef } from 'react';
import { audio } from './components/AudioEngine';
import HelpModal from './components/HelpModal';
import CharacterCreator from './components/CharacterCreator';
import MansionMap from './components/MansionMap';
import { 
  executeLocalCommand, 
  rooms, 
  GATES, 
  checkRiddleAnswer, 
  getGlobalTurnBeat 
} from './services/localStory';
import { 
  generateStoryResponse, 
  evaluateRiddleSemanticAI,
  initWebLLMEngine, 
  isWebGPUSupported, 
  isWebLLMReady, 
  DEFAULT_LOCAL_MODEL 
} from './services/ai';
import { Volume2, VolumeX, ShieldAlert, Key, Sparkles } from 'lucide-react';

export default function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [showSettings, setShowSettings] = useState(false);
  const [playMode, setPlayMode] = useState('menu'); // 'menu' | 'loading_model' | 'creator' | 'playing' | 'gameover' | 'victory'
  
  // Model loading state
  const [modelProgress, setModelProgress] = useState({ progress: 0, text: 'Awakening mansion memory...' });
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
    objective: 'Search the Foyer and solve the riddle at the north archway.',
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

  // Save API key
  const handleSaveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    audio.playBleep(660, 0.08);
  };

  // Start adventure handler
  const handleProceedToCharacterCreation = async () => {
    setModelError('');
    if (isWebGPUSupported() && !isWebLLMReady() && !apiKey) {
      setPlayMode('loading_model');
      try {
        await initWebLLMEngine(DEFAULT_LOCAL_MODEL, (report) => {
          const pct = Math.round((report.progress || 0) * 100);
          setModelProgress({
            progress: pct,
            text: report.text || 'Awakening mansion memory...'
          });
        });
        setPlayMode('creator');
        audio.playItemAcquired();
      } catch (err) {
        console.warn("Background AI initialization error:", err);
        setPlayMode('creator');
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

    const initialText = `MANSION ESCAPE: THE STAR OF MEWAR
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
      
      const currentRoomData = rooms[gameState.currentRoom];
      const cleanMovement = norm.replace(/^go\s+/i, '').trim();
      const isTryingAnotherMovement = currentRoomData.exits[norm] !== undefined || currentRoomData.exits[cleanMovement] !== undefined;
      const targetRoom = currentRoomData.exits[norm] || currentRoomData.exits[cleanMovement];
      const newGateKey = `${gameState.currentRoom}->${targetRoom}`;

      if (isTryingAnotherMovement && newGateKey !== activeRiddleGate) {
        setActiveRiddleGate(null);
      } else {
        let answerResult = checkRiddleAnswer(activeRiddleGate, cmd);

        const aiMode = apiKey ? 'gemini' : (isWebLLMReady() ? 'webllm' : 'offline');

        if (!answerResult.correct && aiMode !== 'offline') {
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

          const turnBeat = getGlobalTurnBeat(gameState.turn + 1);

          setGameState(prev => ({
            ...prev,
            currentRoom: targetRoomName,
            turn: prev.turn + 1,
            oilReserve: Math.max(0, prev.oilReserve - 2),
            log: [
              ...prev.log, 
              { type: 'narrative', text: `[RIDDLE SOLVED!]\n${gate.successText}\n\n${targetRoomData.name.toUpperCase()}\n${targetRoomData.description}${turnBeat}` }
            ]
          }));
          return;
        } else {
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
                text: `[INCORRECT ANSWER]\nThe spectral ward pulses with a harsh, chilling light. A voice whispers: "Wrong, mortal." (Sanity -5)\n\nHint: ${gate.hint}\nTry answering again, or navigate elsewhere.` 
              }
            ]
          }));
          return;
        }
      }
    }

    // 3. Movement with Gate Riddle Check
    const currentRoomData = rooms[gameState.currentRoom];
    const cleanMovement = norm.replace(/^go\s+/i, '').trim();
    const isMovement = currentRoomData.exits[norm] !== undefined || currentRoomData.exits[cleanMovement] !== undefined;

    if (isMovement) {
      const localResult = executeLocalCommand(
        { 
          currentRoom: gameState.currentRoom, 
          inventory: player.inventory, 
          objective: gameState.objective,
          playerClass: player.class,
          stats: player.stats,
          oilReserve: gameState.oilReserve
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
      const turnBeat = getGlobalTurnBeat(gameState.turn + 1);

      setGameState(prev => ({
        ...prev,
        currentRoom: localResult.stateUpdates.currentRoom || prev.currentRoom,
        turn: prev.turn + 1,
        oilReserve: Math.max(0, prev.oilReserve - 2),
        objective: localResult.objective || prev.objective,
        log: [...prev.log, { type: 'narrative', text: `${localResult.storyText}${turnBeat}` }]
      }));
      return;
    }

    // 4. Room Interaction / Environmental Commands
    const isAiExplicitCommand = norm.startsWith('< examine') || norm.startsWith('<examine');
    const aiMode = apiKey ? 'gemini' : (isWebLLMReady() ? 'webllm' : 'offline');

    if (isAiExplicitCommand && aiMode !== 'offline') {
      setIsGenerating(true);
      try {
        const cleanCmd = cmd.replace(/^<\s*/, '');
        const result = await generateStoryResponse(
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

        setGameState(prev => ({
          ...prev,
          turn: prev.turn + 1,
          oilReserve: Math.max(0, prev.oilReserve - 2),
          log: [...prev.log, { type: 'narrative', text: result.storyText }]
        }));
      } catch (err) {
        console.warn("AI narrative lore error:", err);
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    // Deterministic Command Execution
    const localResult = executeLocalCommand({
      currentRoom: gameState.currentRoom,
      inventory: player.inventory,
      objective: gameState.objective,
      playerClass: player.class,
      stats: player.stats,
      oilReserve: gameState.oilReserve
    }, cmd, unlockedGates);

    const updates = localResult.stateUpdates || {};
    
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
        localResult.storyText += "\n(Your inventory slots are full. You must drop something first.)";
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

    // Turn beat
    const turnBeat = getGlobalTurnBeat(gameState.turn + 1);

    setGameState(prev => ({
      ...prev,
      currentRoom: updates.currentRoom || prev.currentRoom,
      turn: prev.turn + 1,
      oilReserve: Math.max(0, prev.oilReserve - 2 + (updates.oilChange || 0)),
      objective: localResult.objective || prev.objective,
      log: [...prev.log, { type: 'narrative', text: `${localResult.storyText}${turnBeat}` }]
    }));
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
                    <span>Quest & Commands</span>
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
                    <p>• <strong>read [journal/scroll/plaque]</strong></p>
                    <p>• <strong>look</strong> / <strong>inventory</strong> / <strong>escape</strong></p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Atmospheric Preload Screen */}
          {playMode === 'loading_model' && (
            <div className="api-container">
              <Sparkles size={44} className="glow-text" style={{ marginBottom: '16px' }} />
              <h2 className="creator-title glow-text" style={{ fontSize: '24px', marginBottom: '16px' }}>
                COMMUNING WITH THE HAVELI SPIRITS...
              </h2>
              <p style={{ maxWidth: '540px', margin: '0 auto 20px', fontSize: '16px', color: 'var(--terminal-dim)' }}>
                Aligning astral planes and awakening the mansion memory core...
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
              <h1 className="creator-title glow-text" style={{ fontSize: '38px', marginBottom: '16px' }}>
                MANSION ESCAPE
              </h1>
              <p style={{ maxWidth: '620px', margin: '0 auto 32px', lineHeight: '1.5', fontSize: '18px' }}>
                A retro horror interactive text adventure set in a cursed 19th-century Rajasthani Haveli. Solve spirit gate riddles, recover the 3 royal keys, and escape before the midnight hour.
              </p>

              <button 
                className="retro-btn"
                style={{ padding: '14px 44px', fontSize: '18px', marginBottom: '20px' }}
                onClick={handleProceedToCharacterCreation}
              >
                START ADVENTURE
              </button>

              {/* Optional clean expandable API key setting */}
              <div style={{ marginTop: '16px' }}>
                <button 
                  type="button"
                  className="help-btn"
                  style={{ fontSize: '11px', opacity: 0.7 }}
                  onClick={() => setShowSettings(!showSettings)}
                >
                  {showSettings ? '[-] HIDE CLOUD SETTINGS' : '[+] CLOUD AI SETTINGS (OPTIONAL)'}
                </button>
                {showSettings && (
                  <div style={{ marginTop: '12px', maxWidth: '400px', margin: '12px auto 0' }}>
                    <input
                      type="password"
                      className="api-input"
                      style={{ fontSize: '14px', margin: '6px 0' }}
                      value={apiKey}
                      onChange={(e) => handleSaveApiKey(e.target.value)}
                      placeholder="Optional Gemini API key..."
                    />
                  </div>
                )}
              </div>
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
