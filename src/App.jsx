import React, { useState, useEffect, useRef } from 'react';
import { audio } from './components/AudioEngine';
import HelpModal from './components/HelpModal';
import CharacterCreator from './components/CharacterCreator';
import MansionMap from './components/MansionMap';
import { executeLocalCommand, rooms } from './services/localStory';
import { generateStoryResponse } from './services/ai';
import { Volume2, VolumeX, ShieldAlert, RotateCcw, Key } from 'lucide-react';

export default function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [playMode, setPlayMode] = useState('menu'); // 'menu' | 'creator' | 'playing' | 'gameover' | 'victory'
  
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

  // Save API key
  const handleSaveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    audio.playBleep(660, 0.08);
  };

  const handleStartGame = (creatorData) => {
    setPlayer({
      name: creatorData.name,
      class: creatorData.class,
      stats: creatorData.stats,
      inventory: creatorData.inventory
    });
    
    // Seed initial console output
    const initialText = `Mansion Escape - Version 1.0 (Traditional 1980s text engine)
------------------------------------------------------------------
You slip through a high, broken stone Jharokha window, dropping onto the dusty floorboards. Behind you, the massive iron-studded foyer gates slam shut with an echo that shakes the cobwebs. The brass lock snaps shut with a cold click. You are trapped.

The damp scent of decaying sandalwood hangs in the air. Your lantern casts long, flickering amber shadows. You must find the Bronze, Silver, and Gold Keys to unlock the gate and escape before the midnight hour (50 turns).

${rooms['Front Foyer'].description}`;

    setGameState({
      currentRoom: 'Front Foyer',
      turn: 1,
      oilReserve: 100,
      objective: 'Search the Foyer and look for a way deeper into the mansion.',
      log: [{ type: 'narrative', text: initialText }]
    });

    setKeysCollected({ bronze: false, silver: false, gold: false });
    setPlayMode('playing');
    audio.playCreak();
  };

  // Map layout room coordinates
  const MAP_ROOMS = {
    "Stepwell Baoli": { label: "Baoli (Well)", x: 80, y: 15, width: 95, height: 35, level: 'main' },
    "Sheesh Mahal": { label: "Sheesh Mahal", x: 195, y: 15, width: 95, height: 35, level: 'main' },
    "Zenana Wing": { label: "Zenana Wing", x: 10, y: 65, width: 90, height: 45, level: 'main' },
    "Chowk Courtyard": { label: "Chowk (Courtyard)", x: 110, y: 65, width: 100, height: 45, level: 'main' },
    "Mardana Wing": { label: "Mardana Wing", x: 220, y: 65, width: 90, height: 45, level: 'main' },
    "Front Foyer": { label: "Front Foyer", x: 110, y: 125, width: 100, height: 35, level: 'main' },
    "Rasoda Kitchen": { label: "Rasoda (Kitchen)", x: 110, y: 200, width: 100, height: 35, level: 'lower' }
  };

  const MAP_CONNECTIONS = [
    { from: "Front Foyer", to: "Chowk Courtyard", x1: 160, y1: 125, x2: 160, y2: 110, type: 'normal' },
    { from: "Chowk Courtyard", to: "Zenana Wing", x1: 110, y1: 87, x2: 100, y2: 87, type: 'normal' },
    { from: "Chowk Courtyard", to: "Mardana Wing", x1: 210, y1: 87, x2: 220, y2: 87, type: 'normal' },
    { from: "Chowk Courtyard", to: "Stepwell Baoli", x1: 160, y1: 65, x2: 127, y2: 50, type: 'normal' },
    { from: "Mardana Wing", to: "Sheesh Mahal", x1: 265, y1: 65, x2: 242, y2: 50, type: 'normal' },
    { from: "Chowk Courtyard", to: "Rasoda Kitchen", x1: 160, y1: 110, x2: 160, y2: 200, type: 'vertical' }
  ];

  const getAdjacentRooms = (roomName) => {
    const adjMap = {
      "Front Foyer": ["Chowk Courtyard"],
      "Chowk Courtyard": ["Front Foyer", "Zenana Wing", "Mardana Wing", "Stepwell Baoli", "Rasoda Kitchen"],
      "Zenana Wing": ["Chowk Courtyard"],
      "Mardana Wing": ["Chowk Courtyard", "Sheesh Mahal"],
      "Stepwell Baoli": ["Chowk Courtyard"],
      "Rasoda Kitchen": ["Chowk Courtyard"],
      "Sheesh Mahal": ["Mardana Wing"]
    };
    return adjMap[roomName] || [];
  };

  const getMovementDirection = (fromRoom, toRoom) => {
    const directionMap = {
      "Front Foyer": { "Chowk Courtyard": "north" },
      "Chowk Courtyard": {
        "Front Foyer": "south",
        "Zenana Wing": "west",
        "Mardana Wing": "east",
        "Stepwell Baoli": "north",
        "Rasoda Kitchen": "down"
      },
      "Zenana Wing": { "Chowk Courtyard": "east" },
      "Mardana Wing": {
        "Chowk Courtyard": "west",
        "Sheesh Mahal": "north"
      },
      "Stepwell Baoli": { "Chowk Courtyard": "south" },
      "Rasoda Kitchen": { "Chowk Courtyard": "up" },
      "Sheesh Mahal": { "Mardana Wing": "south" }
    };
    return directionMap[fromRoom]?.[toRoom] || null;
  };

  const handleRoomClick = (roomName) => {
    if (playMode !== 'playing' || isGenerating) return;
    const currentRoom = gameState.currentRoom;
    const direction = getMovementDirection(currentRoom, roomName);
    if (direction) {
      handleCommandSubmit(null, direction);
    } else {
      audio.playBleep(220, 0.1);
    }
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

    // 2. Parse general utility commands locally
    const norm = cmd.toLowerCase().trim();
    
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

    // Handle gate escape logic
    if ((norm === 'unlock gate' || norm === 'unlock gates' || norm === 'open gate' || norm === 'escape') && gameState.currentRoom === 'Front Foyer') {
      if (keysCollected.bronze && keysCollected.silver && keysCollected.gold) {
        setPlayMode('victory');
        audio.playBellToll();
        const score = 50 - gameState.turn;
        const victoryText = `\n=== VICTORY ===\nYou slide the Bronze, Silver, and Gold Keys into the three heavy locks. With a grinding scream of rusted iron, the massive gates swing outward. You tumble out into the cool desert air of Rajasthan, clutching your prize under the starry sky.\n\nScore: ${score} points\nMoves taken: ${gameState.turn}/50`;
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
          log: [...prev.log, { type: 'narrative', text: `The gate remains sealed. You are missing the following keys: ${missingKeys.join(', ')}.` }]
        }));
      }
      return;
    }

    // 3. Process game movements or actions
    // Determine if it's a movement command resolved locally
    const currentRoomData = rooms[gameState.currentRoom];
    const isMovement = currentRoomData.exits[norm] !== undefined;

    if (isMovement) {
      // Execute local movement to save tokens and ensure prompt responsiveness
      const localResult = executeLocalCommand(
        { 
          currentRoom: gameState.currentRoom, 
          inventory: player.inventory, 
          objective: gameState.objective,
          playerClass: player.class,
          stats: player.stats
        },
        cmd
      );

      // Play structural creak sound
      audio.playCreak();

      // Update State
      setGameState(prev => ({
        ...prev,
        currentRoom: localResult.stateUpdates.currentRoom,
        turn: prev.turn + 1,
        oilReserve: Math.max(0, prev.oilReserve - 2),
        log: [...prev.log, { type: 'narrative', text: localResult.storyText }]
      }));
      return;
    }

    // AI constraint handling: only commands starting with < examine or <examine trigger Gemini AI
    const isAiCommand = norm.startsWith('< examine') || norm.startsWith('<examine');

    setIsGenerating(true);

    try {
      let result;
      if (isAiCommand) {
        if (apiKey) {
          // Clean the prefix "<" or "< " before calling the AI service
          const cleanCmd = cmd.replace(/^<\s*/, '');
          result = await generateStoryResponse(apiKey, {
            currentRoom: gameState.currentRoom,
            stats: player.stats,
            inventory: player.inventory,
            oilReserve: gameState.oilReserve,
            keysCollected,
            turn: gameState.turn,
            objective: gameState.objective
          }, cleanCmd);
        } else {
          result = {
            storyText: "[AI Mode API Key is required for '< examine' commands. Please enter it in the Main Menu.]",
            objective: gameState.objective,
            stateUpdates: {}
          };
        }
      } else {
        // Fallback local branching response for all other commands
        result = executeLocalCommand({
          currentRoom: gameState.currentRoom,
          inventory: player.inventory,
          objective: gameState.objective,
          playerClass: player.class,
          stats: player.stats
        }, cmd);
      }

      // Execute suggested state updates
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

      // Handle inventory additions
      if (updates.addInventory) {
        const toAdd = updates.addInventory;
        if (!player.inventory.includes(toAdd) && player.inventory.length < 6) {
          audio.playItemAcquired();
          setPlayer(prev => ({
            ...prev,
            inventory: [...prev.inventory, toAdd]
          }));
        } else if (player.inventory.length >= 6) {
          // Send inventory full feedback
          result.storyText += "\n(Your inventory slots are full. You must drop something first.)";
        }
      }

      // Handle inventory removals
      if (updates.removeInventory) {
        const toRemove = updates.removeInventory;
        setPlayer(prev => ({
          ...prev,
          inventory: prev.inventory.filter(item => item !== toRemove)
        }));
      }

      // Handle keys collected
      if (updates.setKeyCollected) {
        const keyColor = updates.setKeyCollected; // 'bronze'|'silver'|'gold'
        if (keyColor in keysCollected) {
          setKeysCollected(prev => ({
            ...prev,
            [keyColor]: true
          }));
        }
      }

      // Handle force movement
      let nextRoom = gameState.currentRoom;
      if (updates.currentRoom && rooms[updates.currentRoom]) {
        nextRoom = updates.currentRoom;
        audio.playCreak();
      }

      // Update turn, oil, room, and log
      setGameState(prev => ({
        ...prev,
        currentRoom: nextRoom,
        turn: prev.turn + 1,
        oilReserve: Math.max(0, prev.oilReserve - 2 + (updates.oilChange || 0)),
        objective: result.objective || prev.objective,
        log: [...prev.log, { type: 'narrative', text: result.storyText }]
      }));

    } catch (err) {
      // Fallback in case of API failure
      const fallbackResult = executeLocalCommand({
        currentRoom: gameState.currentRoom,
        inventory: player.inventory,
        objective: gameState.objective,
        playerClass: player.class,
        stats: player.stats
      }, cmd);

      setGameState(prev => ({
        ...prev,
        log: [...prev.log, { type: 'narrative', text: `[API Error. Switched to offline narrative parser.]\n\n${fallbackResult.storyText}` }]
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
                      {keysCollected.bronze && <Key size={14} style={{ color: '#cd7f32' }} />}
                      {keysCollected.silver && <Key size={14} style={{ color: '#c0c0c0' }} />}
                      {keysCollected.gold && <Key size={14} style={{ color: '#ffd700' }} />}
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
                      Thinking
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <form className="input-area-container" onSubmit={handleCommandSubmit}>
                  <span className="input-prompt">&gt;</span>
                  <input
                    ref={inputRef}
                    type="text"
                    className="input-field"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={isGenerating}
                    placeholder="Type command here..."
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
                    <span style={{ fontSize: '9px', color: 'var(--terminal-dim)' }}>▶ = current location</span>
                  </div>
                  
                  <div className="map-canvas-container">
                    <MansionMap currentRoom={gameState.currentRoom} />
                  </div>
                </div>

                {/* Command Reference Help Panel */}
                <div className="help-panel" style={{ flex: 1, overflowY: 'auto' }}>
                  <div className="panel-title">
                    <span>Command Reference</span>
                  </div>
                  <div className="sidebar-help-list">
                    <h3>Movement</h3>
                    <p>• Click adjacent room on map</p>
                    <p>• Type: <strong>north</strong> / <strong>south</strong> / <strong>east</strong> / <strong>west</strong> / <strong>up</strong> / <strong>down</strong></p>
                    
                    <h3>Interaction</h3>
                    <p>• <strong>take [item]</strong> / <strong>drop [item]</strong></p>
                    <p>• <strong>open [door/trunk/cabinet]</strong></p>
                    <p>• <strong>use [item]</strong></p>
                    
                    <h3>Immersive AI Lore</h3>
                    <p>• <strong>&lt; examine [object]</strong> (Gemini Powered)</p>
                    
                    <h3>System</h3>
                    <p>• <strong>look</strong> / <strong>inventory</strong> / <strong>restart</strong></p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Title / Main Menu */}
          {playMode === 'menu' && (
            <div className="api-container">
              <h1 className="creator-title glow-text" style={{ fontSize: '36px', marginBottom: '24px' }}>
                MANSION ESCAPE
              </h1>
              <p style={{ maxWidth: '600px', margin: '0 auto 24px', lineHeight: '1.4' }}>
                An interactive horror text adventure set in a cursed Rajasthani-style mansion. Type traditional Zork commands to explore, collect items, and escape.
              </p>

              <div style={{ width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '15px' }}>&gt; GEMINI API KEY (optional, for &lt; examine commands):</label>
                <input
                  type="password"
                  className="api-input"
                  value={apiKey}
                  onChange={(e) => handleSaveApiKey(e.target.value)}
                  placeholder="Paste your Gemini API key here..."
                />
                <span style={{ fontSize: '13px', color: 'var(--terminal-dim)' }}>
                  {apiKey
                    ? '✓ API Key set — use "&lt; examine [object]" in-game for immersive AI lore.'
                    : 'Without a key, game runs in classic offline mode. "&lt; examine" will be unavailable.'}
                </span>
              </div>

              <div style={{ margin: '24px 0 32px' }} />

              <button 
                className="retro-btn"
                style={{ padding: '12px 32px', fontSize: '15px' }}
                onClick={() => { setPlayMode('creator'); audio.playBleep(660, 0.08); }}
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
                You have successfully unlocked the iron Foyer gates and escaped the cursed estate with the legendary Star of Mewar diamond. You live to tell the tale.
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
