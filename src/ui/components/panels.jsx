import { sanityTierOf } from '../../game/world/world.js';
import { ENDINGS } from '../../game/engine/endings.js';
import { loadAlmanac, ECHO_MEMORIES } from '../../game/meta/almanac.js';

export function SanityGauge({ sanity }) {
  const tier = sanityTierOf(sanity);
  const colors = {
    lucid: '#34d399', unsettled: '#fbbf24', haunted: '#f87171', fractured: '#c084fc'
  };
  const label = { lucid: 'LUCID', unsettled: 'UNSETTLED', haunted: 'HAUNTED', fractured: 'FRACTURED' }[tier];
  const color = colors[tier];
  return (
    <div className="sanity-gauge" title="Sanity is a sense and a currency. Lower it to see the hidden rooms.">
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', letterSpacing: '1px', marginBottom: '4px' }}>
        <span style={{ color }}>SANITY {sanity}%</span>
        <span style={{ color, fontFamily: 'var(--font-pixel)', fontSize: '9px' }}>{label}</span>
      </div>
      <div style={{ height: '8px', border: '1px solid var(--terminal-dim)', background: 'var(--bg-panel)', position: 'relative' }}>
        <div style={{ width: `${sanity}%`, height: '100%', background: color, transition: 'width .25s' }} />
      </div>
      <div style={{ fontSize: '10px', color: 'var(--terminal-dim)', marginTop: '4px', fontStyle: 'italic' }}>
        {tierHint(tier)}
      </div>
    </div>
  );
}

function tierHint(tier) {
  switch (tier) {
    case 'unsettled': return 'The shadows are restless. Statues seem to watch.';
    case 'haunted': return 'The Sight is open — hidden doors show themselves. Gaze to look deeper.';
    case 'fractured': return 'The house is transparent. You can see its true name if you dare.';
    default: return 'You see the house as the sane do.';
  }
}

export function EntityPanel({ entity, onBargain }) {
  if (!entity) return (
    <div className="panel-title" style={{ padding: '8px' }}><span>Presence</span></div>
  );
  return (
    <div className="entity-panel">
      <div className="panel-title"><span>{entity.name}</span></div>
      <p style={{ fontSize: '12px', color: 'var(--terminal-dim)', fontStyle: 'italic', margin: '6px 0' }}>{entity.blurb}</p>
      {onBargain && entity.canBargain && (
        <button className="retro-btn" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={onBargain}>[BARGAIN]</button>
      )}
    </div>
  );
}

export function Codex({ open, onClose }) {
  if (!open) return null;
  const a = loadAlmanac();
  const endings = Object.values(ENDINGS);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content codex-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span>&gt; THE ALMANAC</span>
          <button className="help-btn" onClick={onClose}>[CLOSE]</button>
        </div>
        <div className="modal-body">
          <p style={{ marginBottom: '12px', color: '#ffb03a' }}>
            Runs: <strong>{a.runs}</strong> · Rooms mapped: <strong>{a.roomsSeen.length}</strong> · Memories: <strong>{a.memories.length}</strong> · Best score: <strong>{a.bestScore}</strong>
          </p>
          <h3 style={{ color: '#ffb03a', margin: '10px 0 6px', textDecoration: 'underline' }}>Echo Memories</h3>
          {Object.keys(ECHO_MEMORIES).map(k => (
            <div key={k} style={{ display: 'flex', gap: '8px', fontSize: '13px', padding: '2px 0' }}>
              <span style={{ color: a.memories.includes(k) ? '#34d399' : '#4a3b20' }}>{a.memories.includes(k) ? '●' : '○'}</span>
              <span>{ECHO_MEMORIES[k].title}</span>
            </div>
          ))}
          <h3 style={{ color: '#ffb03a', margin: '14px 0 6px', textDecoration: 'underline' }}>Endings Known</h3>
          {endings.filter(e => a.endings.includes(e.key)).map(e => (
            <div key={e.key} style={{ fontSize: '13px', padding: '2px 0' }}><strong style={{ color: '#ffd27d' }}>{e.title}</strong> — {e.tone}</div>
          ))}
          {a.endings.length === 0 && <p style={{ fontSize: '13px', color: 'var(--terminal-dim)' }}>None yet. The house is still deciding what you were.</p>}
          <p style={{ marginTop: '14px', fontSize: '12px', color: 'var(--terminal-dim)', fontStyle: 'italic' }}>Higher Resonance: {a.higherResonance ? 'ACTIVE' : 'off'}</p>
        </div>
      </div>
    </div>
  );
}
