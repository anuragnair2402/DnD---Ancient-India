import { useState, useRef, useEffect } from 'react';
import { audio } from '../components/AudioEngine.js';
import HelpModal from './components/HelpModal.jsx';
import CharacterCreator from './components/CharacterCreator.jsx';
import MansionMap from './components/MansionMap.jsx';
import { SanityGauge, EntityPanel, Codex } from './components/panels.jsx';
import { GameSession } from '../game/engine/session.js';
import { createInitialState } from '../game/engine/state.js';
import { createDirector } from '../game/ai/director.js';
import { resolveMode } from '../game/ai/providers/provider.js';
import { initWebLLMEngine, isWebLLMReady, isWebGPUSupported } from '../game/ai/providers/webllm.js';
import { loadAlmanac, saveAlmanac, recordRun, toggleHigherResonance } from '../game/meta/almanac.js';
import { ROOMS, GATES } from '../game/world/world.js';
import { CLASS_STARTERS } from '../game/world/items.js';
import { Volume2, VolumeX, ShieldAlert, Key, BookOpen, Sparkles } from 'lucide-react';

export default function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [showSettings, setShowSettings] = useState(false);
  const [playMode, setPlayMode] = useState('menu'); // menu|creator|playing|gameover|victory
  const [modelProgress, setModelProgress] = useState({ progress: 0, text: 'Awakening the house\u2026' });

  const [log, setLog] = useState([]);
  const [view, setView] = useState(null); // { room, player:{sanity,keys,inventory}, oil, turn , aura }
  const [activeRiddle, setActiveRiddle] = useState(null);
  const [pendingOffer, setPendingOffer] = useState(null);
  const [finale, setFinale] = useState(null);
  const [gameOverCause, setGameOverCause] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [freezeInput, setFreezeInput] = useState(false);

  const [inputValue, setInputValue] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [helpOpen, setHelpOpen] = useState(false);
  const [codexOpen, setCodexOpen] = useState(false);
  const [restartConfirmOpen, setRestartConfirmOpen] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [almanac, setAlmanac] = useState(loadAlmanac());

  const sessionRef = useRef(null);
  const feedRef = useRef(null);
  const inputRef = useRef(null);

  const focusInput = () => inputRef.current && inputRef.current.focus();

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [log, isGenerating]);

  useEffect(() => {
    if (playMode === 'playing' && !audioMuted) audio.startAmbientHum();
    else audio.stopAmbientHum();
    return () => audio.stopAmbientHum();
  }, [playMode, audioMuted]);

  useEffect(() => {
    const handleResize = () => {
      const bezel = document.querySelector('.crt-bezel');
      if (bezel) {
        const scaleX = window.innerWidth / 1280;
        const scaleY = window.innerHeight / 800;
        // Scale up to 1.5x on big screens, but shrink safely on small screens (with 2% margin)
        const scale = Math.min(scaleX, scaleY, 1.5) * 0.98; 
        bezel.style.transform = `scale(${scale})`;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // initial scale
    // Also re-trigger on playMode changes in case DOM reflows
    return () => window.removeEventListener('resize', handleResize);
  }, [playMode]);

  const saveKey = (k) => { setApiKey(k); localStorage.setItem('gemini_api_key', k); audio.playBleep(660, 0.08); };

  const saveRun = (state, logData) => {
    localStorage.setItem('active_run_state', JSON.stringify(state));
    localStorage.setItem('active_run_log', JSON.stringify(logData));
  };

  const clearRun = () => {
    localStorage.removeItem('active_run_state');
    localStorage.removeItem('active_run_log');
  };

  const hasSavedRun = Boolean(localStorage.getItem('active_run_state') && localStorage.getItem('active_run_log'));

  const makeDirector = () => createDirector({
    geminiApiKey: apiKey,
    webllmReady: isWebLLMReady()
  });

  const handleProceedToCreator = async () => {
    if (isWebGPUSupported() && !isWebLLMReady() && !apiKey) {
      setPlayMode('loading');
      try {
        await initWebLLMEngine(undefined, (r) => {
          const pct = Math.round((r.progress || 0) * 100);
          setModelProgress({ progress: pct, text: r.text || 'Awakening memory\u2026' });
        });
      } catch (e) { console.warn('webllm init:', e); }
    }
    setPlayMode('creator');
    audio.playItemAcquired();
  };

  const handleResumeGame = () => {
    const savedStateStr = localStorage.getItem('active_run_state');
    const savedLogStr = localStorage.getItem('active_run_log');
    if (!savedStateStr || !savedLogStr) return;
    try {
      const savedState = JSON.parse(savedStateStr);
      const savedLog = JSON.parse(savedLogStr);
      
      const director = makeDirector();
      const session = new GameSession(savedState, director.hooks);
      sessionRef.current = session;
      setLog(savedLog);
      setActiveRiddle(null); setPendingOffer(null); setFinale(null); setGameOverCause('');
      syncView();
      setPlayMode('playing');
      setFreezeInput(false);
      audio.playItemAcquired();
    } catch (e) {
      console.error('Failed to resume run:', e);
      clearRun();
    }
  };

  const handleStartGame = (creatorData) => {
    const st = createInitialState();
    st.player.name = creatorData.name;
    st.player.classId = creatorData.classId;
    st.player.stats = creatorData.stats;
    st.player.inventory = creatorData.inventory;
    if (creatorData.higherResonance) {
      st.world.maxTurns = 50;
      st.world.oil = 70;
      st.world.runSeed = Math.floor(Math.random() * 99997);
    }
    const director = makeDirector();
    const session = new GameSession(st, director.hooks);
    sessionRef.current = session;

    setActiveRiddle(null); setPendingOffer(null); setFinale(null); setGameOverCause('');
    const intro = `THE DJINN OF MEWAR\n\`\`\`\`\`\`\`\`\`\`\`\`\`\`\`\`\`\`\`\`\`\`\`\`\`\`\`\`\`\`\`\`\`\`\`\`\`\`\`\`\`\`\`\nYou slip through a high, broken stone jharokha and drop onto the foyer floor. Behind you, the iron-studded gates slam shut \u2014 brass lock snapping cold. You are trapped in the haveli of Thakur Vikram Singh.\n\nThe house is alive, and something in it has been waiting to be asked a question it will enjoy answering.\n\n${ROOMS['front_foyer'].description}\n\n(Type "look", go north, examine the drawer, or meditate to begin.)`;
    const introLog = [{ type: 'system', text: intro }];
    setLog(introLog);
    syncView();
    setPlayMode('playing');
    audio.playCreak();
    saveRun(session.state, introLog);
  };

  const syncView = () => {
    const s = sessionRef.current;
    if (!s) return;
    const room = ROOMS[s.state.world.currentRoom];
    setView({
      room: s.state.world.currentRoom,
      roomName: room ? room.name : s.state.world.currentRoom,
      layer: room ? room.layer : 'ground',
      aura: room ? room.aura : 4,
      player: {
        sanity: s.state.player.stats.sanity,
        resolve: s.state.player.stats.resolve,
        perception: s.state.player.stats.perception,
        courage: s.state.player.stats.courage,
        keys: { ...s.state.player.keys },
        inventory: [...s.state.player.inventory],
        rison: { ...s.state.player.rison }
      },
      oil: s.state.world.oil,
      turn: s.state.world.turn,
      maxTurns: s.state.world.maxTurns,
      objective: s.state.world.objective,
      unlockedGates: { ...s.state.world.unlockedGates },
      doors: { ...s.state.world.doors },
      flags: { ...s.state.player.flags },
      runSeed: s.state.world.runSeed
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInputValue(commandHistory[nextIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= commandHistory.length) {
        setHistoryIndex(-1);
        setInputValue('');
      } else {
        setHistoryIndex(nextIndex);
        setInputValue(commandHistory[nextIndex]);
      }
    }
  };

  const handleCommand = async (e, override) => {
    if (e) e.preventDefault();
    const cmd = (override !== undefined ? override : inputValue).trim();
    if (!cmd) return;
    
    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);
    
    if (override === undefined) setInputValue('');
    audio.playBleep(440, 0.04);

    const s = sessionRef.current;
    if (!s) return;
    setIsGenerating(true);
    setFreezeInput(true);
    try {
      const res = await s.submit(cmd);
      setLog(prev => {
        const nextLog = [...prev, ...res.story];
        if (res.playMode !== 'victory' && res.playMode !== 'gameover') {
          saveRun(s.state, nextLog);
        }
        return nextLog;
      });
      if (res.activeRiddle) setActiveRiddle(res.activeRiddle);
      else setActiveRiddle(null);
      if (res.pendingOffer) setPendingOffer(res.pendingOffer);
      else setPendingOffer(null);
      if (res.playMode === 'victory') {
        setFinale(res.finale);
        recordEnding(res.finale.key);
        setPlayMode('victory');
        audio.playBellToll();
        clearRun();
      } else if (res.playMode === 'gameover') {
        setGameOverCause(res.cause || 'sanity');
        setPlayMode('gameover');
        audio.playBellToll();
        clearRun();
      }
      syncView();
    } catch (err) {
      console.warn(err);
      setLog(prev => [...prev, { type: 'system', text: 'The house hesitated. Try that again.' }]);
    } finally {
      setIsGenerating(false);
      setFreezeInput(false);
      setTimeout(() => focusInput(), 0);
    }
  };

  const recordEnding = (key) => {
    const s = sessionRef.current;
    const a = recordRun({
      ...loadAlmanac(),
      runs: loadAlmanac().runs + 1,
      higherResonance: loadAlmanac().higherResonance
    }, {
      endings: [key],
      roomIds: s ? [s.state.world.currentRoom] : [],
      score: finale && finale.score,
      memories: [key === 'betrayed' ? 'betrayal' : (key === 'ally' ? 'djinn' : key === 'host' ? 'thakur' : key === 'banished' ? 'priest' : null)].filter(Boolean)
    });
    saveAlmanac(a);
    setAlmanac(a);
  };

  const doRestart = () => { setPlayMode('menu'); audio.playBleep(); };
  const toggleMute = () => { const m = audio.toggleMute(); setAudioMuted(m); };

  const entityHere = computeEntity(view);

  return (
    <div className="crt-container">
      <div className="crt-bezel">
        <div className={`crt-screen ${view?.player?.sanity <= 20 ? 'sanity-fractured' : view?.player?.sanity <= 45 ? 'sanity-haunted' : ''}`.trim()}>
          <div className="crt-scanlines" />

          {playMode === 'playing' && (
            <div className="game-container">
              <div className="main-content-column">
                <div className="status-header">
                  <div className="status-header-segment" style={{ flex: 1 }}>
                    <span>{view?.roomName?.toUpperCase()}</span>
                  </div>
                  <div className="status-header-segment">
                    <span className={view?.player?.sanity < 40 ? 'red-glow-text' : ''}>SANITY {view?.player?.sanity}%</span>
                    <span>MOVE {view?.turn}/{view?.maxTurns}</span>
                    <span>OIL {view?.oil}%</span>
                  </div>
                  <div className="status-header-segment" style={{ gap: '6px' }}>
                    {view?.player?.keys.bronze && <Key size={13} style={{ color: '#cd7f32' }} />}
                    {view?.player?.keys.silver && <Key size={13} style={{ color: '#c0c0c0' }} />}
                    {view?.player?.keys.gold && <Key size={13} style={{ color: '#ffd700' }} />}
                    <button className="help-btn" onClick={() => setCodexOpen(true)}><BookOpen size={11} /></button>
                    <button className="help-btn" onClick={() => setRestartConfirmOpen(true)}>[MENU]</button>
                    <button className="help-btn" onClick={() => setHelpOpen(true)}>[HELP]</button>
                    <button className="help-btn" onClick={toggleMute}>{audioMuted ? <VolumeX size={10} /> : <Volume2 size={10} />}</button>
                  </div>
                </div>

                <div className="terminal-feed" ref={feedRef} onClick={focusInput}>
                  {log.map((line, i) => (
                    <div key={i} className={`terminal-line ${line.type === 'command' ? 'player-input-line' : typeClass(line.type)}`}>
                      {line.type === 'command' ? `> ${line.text}` : line.text}
                    </div>
                  ))}
                  {isGenerating && <div className="terminal-line dim-text">Consulting ancient lore\u2026</div>}
                </div>

                <form className="input-area-container" onSubmit={handleCommand}>
                  <span className="input-prompt" style={{ color: activeRiddle ? 'var(--sanity-red)' : pendingOffer ? '#c3e88d' : 'var(--terminal-amber)' }}>
                    {activeRiddle ? 'RIDDLE>' : pendingOffer ? 'OFFER>' : '>'}
                  </span>
                  <input
                    ref={inputRef}
                    type="text"
                    className="input-field"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isGenerating || freezeInput}
                    placeholder={activeRiddle ? 'Answer the gate\u2019s riddle\u2026' : pendingOffer ? 'ACCEPT or DECLINE\u2026' : 'Type command\u2026 (look, go north, examine drawer, help)'}
                    autoComplete="off" autoFocus
                  />
                </form>
              </div>

              <div className="sidebar-column">
                <SanityGauge sanity={view?.player?.sanity} />
                <div className="map-panel" style={{ flex: 1 }} >
                  <div className="panel-title"><span>Floor Plan</span><span style={{ fontSize: '9px', color: 'var(--terminal-dim)' }}>🟢open 🔴ward</span></div>
                  <div className="map-canvas-container">
                    <MansionMap currentRoom={view?.room} unlockedGates={view?.unlockedGates} sanity={view?.player?.sanity} doors={view?.doors} />
                  </div>
                </div>
                <EntityPanel entity={entityHere} />
                <div className="help-panel" style={{ overflowY: 'auto' }}>
                  <div className="panel-title"><span>Objective</span></div>
                  <p style={{ color: '#ffea53', fontStyle: 'italic', fontSize: '12px', margin: '6px 4px' }}>{view?.objective || 'Search the house. Understand the covenant.'}</p>
                  <p style={{ fontSize: '11px', color: 'var(--terminal-dim)', margin: '4px 4px' }}>Low sanity opens the Sight. Meditate to restore it; surrender to spend it. Escape by keys + Star, or unravel the covenant at the Sanctum.</p>
                </div>
              </div>
            </div>
          )}

          {playMode === 'menu' && (
            <div className="api-container">
              <h1 className="creator-title glow-text" style={{ fontSize: '34px', marginBottom: '14px' }}>THE DJINN OF MEWAR</h1>
              <p style={{ maxWidth: '640px', margin: '0 auto 26px', lineHeight: '1.5', fontSize: '17px' }}>
                A cursed Rajasthani haveli stands forgotten by time. Within its crumbling walls, ghosts whisper ancient secrets, locked gates demand riddles of the soul, and shadows offer bargains you would be wise to read twice. Escape with your sanity, or unravel the covenant that doomed this house forever.
              </p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '16px' }}>
                <button className="retro-btn" style={{ padding: '14px 44px', fontSize: '18px' }} onClick={handleProceedToCreator}>START ADVENTURE</button>
                {hasSavedRun && (
                  <button className="retro-btn" style={{ padding: '14px 44px', fontSize: '18px' }} onClick={handleResumeGame}>[RESUME SAVED RUN]</button>
                )}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--terminal-dim)', marginBottom: '14px' }}>AI Voice: {resolveMode({ geminiApiKey: apiKey, webllmReady: isWebLLMReady() })}</div>
              <div style={{ marginTop: '8px' }}>
                <button type="button" className="help-btn" style={{ fontSize: '11px', opacity: 0.7 }} onClick={() => setShowSettings(!showSettings)}>
                  {showSettings ? '[-] HIDE CLOUD SETTINGS' : '[+] CLOUD AI SETTINGS (OPTIONAL)'}
                </button>
                {showSettings && (
                  <div style={{ marginTop: '12px', maxWidth: '400px', margin: '12px auto 0' }}>
                    <input type="password" className="api-input" style={{ fontSize: '14px', margin: '6px 0' }} value={apiKey} onChange={e => saveKey(e.target.value)} placeholder="Optional Gemini API key\u2026" />
                  </div>
                )}
              </div>
              <button className="help-btn" style={{ fontSize: '11px', opacity: 0.7, marginTop: '8px' }} onClick={() => setCodexOpen(true)}>[ALMANAC]</button>
            </div>
          )}

          {playMode === 'loading' && (
            <div className="api-container" style={{ alignItems: 'center' }}>
              <h2 className="creator-title" style={{ fontSize: '24px', marginBottom: '24px' }}>CONJURING THE DJINN...</h2>
              <div style={{ width: '300px', height: '14px', border: '1px solid var(--terminal-amber)', padding: '2px', marginBottom: '16px' }}>
                <div style={{ height: '100%', width: `${modelProgress.progress}%`, backgroundColor: 'var(--terminal-amber)', transition: 'width 0.2s' }} />
              </div>
              <p style={{ color: 'var(--terminal-dim)', fontSize: '14px', minHeight: '40px', textAlign: 'center' }}>{modelProgress.text}</p>
              <button className="help-btn" style={{ marginTop: '16px', opacity: 0.8 }} onClick={() => setPlayMode('creator')}>[SKIP TO PLAY OFFLINE]</button>
            </div>
          )}

          {playMode === 'creator' && <CharacterCreator onComplete={handleStartGame} onBack={doRestart} />}

          {playMode === 'gameover' && <GameOverScreen cause={gameOverCause} onRestart={doRestart} turn={view?.turn} />}
          {playMode === 'victory' && finale && <VictoryScreen finale={finale} onRestart={doRestart} />}

          <HelpModal isOpen={helpOpen} onClose={() => { setHelpOpen(false); focusInput(); }} />
          <Codex open={codexOpen} onClose={() => { setCodexOpen(false); }} />
          {restartConfirmOpen && (
            <div className="modal-overlay" onClick={() => setRestartConfirmOpen(false)}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header" style={{ color: 'var(--sanity-red)', borderColor: 'var(--sanity-red)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldAlert size={18} /> WARNING</span>
                </div>
                <div className="modal-body" style={{ color: 'var(--sanity-red)' }}>
                  Abandon this run? The house will remember what you learned \u2014 your almanac lives on \u2014 but this escape ends here.
                </div>
                <div className="modal-footer">
                  <button className="retro-btn" onClick={() => setRestartConfirmOpen(false)}>CANCEL</button>
                  <button className="retro-btn danger" onClick={() => { setRestartConfirmOpen(false); clearRun(); doRestart(); }}>ABANDON</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function typeClass(t) {
  return { system: 'red-glow-text', entity: 'entity-text', command: 'player-input-line', narrative: 'glow-text' }[t] || 'glow-text';
}

function computeEntity(view) {
  if (!view) return null;
  if (view.room === 'djinn_sanctum') return { name: 'The Djinn of the Star', blurb: 'The covenant\u2019s prisoner, and the house\u2019s warden. It will test everything you learned.', canBargain: true };
  if (view.room === 'weeping_garden') return { name: 'The Rani', blurb: 'She waits by the jasmine for her son\u2019s rattle. Only the Sighted may see or speak to her.' };
  if (view.room === 'fountain_cistern') return { name: 'The Yaksha Guardian', blurb: 'Guards the deep water. Sacred Ash parts its lesser guard; a true name would open it wholly.' };
  if (view.room === 'darbar_hall') return { name: 'The Mad Court-Priest', blurb: 'The ink that bound the pact. Delivers the house\u2019s order in half-finished truths.' };
  if (view.room === 'echo_gallery') return { name: 'A Gathering of Echoes', blurb: 'The family you have only glimpsed, hung in portraits that will not hold still.' };
  return null;
}

function GameOverScreen({ cause, onRestart, turn }) {
  const t = cause === 'midnight'
    ? 'The covenant closes at the final bell. The Djinn steps out of the darkest mirror and takes what was promised by the house\u2019s founding: a soul in balance for the Star.'
    : 'Your mind fracturs completely, and you join the ghostly chorus in the mirrors of the Sheesh Mahal. The house adds another whispering soul to its halls.';
  return (
    <div className="api-container">
      <h1 className="creator-title red-glow-text" style={{ fontSize: '30px', marginBottom: '14px' }}>YOU PERISHED</h1>
      <p style={{ maxWidth: '600px', margin: '0 auto', color: 'var(--sanity-red)', lineHeight: '1.5' }}>{t}</p>
      <p style={{ fontSize: '13px', color: 'var(--terminal-dim)', marginTop: '12px' }}>Turn {turn} · The almanac remembers what you learned.</p>
      <button className="retro-btn danger" style={{ marginTop: '22px' }} onClick={onRestart}>&gt; TRY AGAIN</button>
    </div>
  );
}

function VictoryScreen({ finale, onRestart }) {
  return (
    <div className="api-container">
      <h1 className="creator-title glow-text" style={{ fontSize: '30px', marginBottom: '12px', color: finale.tone === 'red' ? '#f87171' : '#ffea53' }}>{finale.title}</h1>
      <p style={{ maxWidth: '640px', margin: '0 auto', whiteSpace: 'pre-line', lineHeight: '1.5', textAlign: 'left' }}>{finale.text}</p>
      <p style={{ fontSize: '14px', color: 'var(--terminal-dim)', marginTop: '14px' }}>Score: {finale.score} · Moves: {finale.moves}</p>
      <button className="retro-btn" style={{ marginTop: '22px' }} onClick={onRestart}>&gt; PLAY AGAIN</button>
    </div>
  );
}
