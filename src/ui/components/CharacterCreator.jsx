import { useState } from 'react';
import { CLASS_STARTERS, ITEMS } from '../../game/world/items.js';

const CLASSES = [
  {
    id: 'Antiquarian',
    name: 'Antiquarian',
    blurb: 'A dust-covered academic hunting the Star of Mewar. Reads signs others miss.',
    flavor: 'Perception +15. Finds what the naked eye refuses — and sees the house lying.',
    stat: 'Perception'
  },
  {
    id: 'Exorcist (Tantrik)',
    name: 'Exorcist (Tantrik)',
    blurb: 'A spiritual warder fluent in the unseen. Repels spirits and steadies the mind.',
    flavor: 'Courage +15. The dead give you a wider berth.',
    stat: 'Courage'
  },
  {
    id: 'Mercenary',
    name: 'Mercenary',
    blurb: 'A practical soul who trusts iron over lore. Forces doors and shrugs at terror.',
    flavor: 'Resolve +15, starts with a crowbar and oil. The brute path through the house.',
    stat: 'Resolve'
  }
];

export default function CharacterCreator({ onComplete, onBack }) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState(CLASSES[0]);
  const [higherResonance, setHigherResonance] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    const finalName = name.trim() || 'Wanderer';
    const starter = CLASS_STARTERS[selected.id] || CLASS_STARTERS.Mercenary;
    onComplete({
      name: finalName,
      classId: selected.id,
      stats: { sanity: 100, maxSanity: 100, resolve: starter.resolve, perception: starter.perception, courage: starter.courage, terror: starter.terror },
      inventory: [...starter.items],
      higherResonance
    });
  };

  return (
    <div className="creator-container">
      <div className="creator-title glow-text">CREATION TERMINAL</div>
      <p style={{ maxWidth: '620px', margin: '0 auto 22px', color: 'var(--terminal-dim)' }}>
        State your name and choose your grip on the house. What you carry is small; what you understand will have to be enough.
      </p>

      <form onSubmit={submit} style={{ width: '100%', maxWidth: '860px', display: 'flex', flexDirection: 'column', gap: '18px', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <label style={{ fontFamily: 'var(--font-pixel)', fontSize: '11px', textAlign: 'left', display: 'block' }}>&gt; ENTER NAME:</label>
          <input type="text" className="api-input" value={name} onChange={e => setName(e.target.value)} placeholder="Adventurer Name" maxLength={16} required autoFocus />
        </div>

        <div className="class-grid">
          {CLASSES.map(cls => (
            <div key={cls.id} className={`class-card ${selected.id === cls.id ? 'selected' : ''}`} onClick={() => setSelected(cls)}>
              <div className="class-name glow-text">{cls.name}</div>
              <p style={{ fontSize: '13px', color: 'var(--text-dim)', minHeight: '52px', textAlign: 'left', lineHeight: '1.35' }}>{cls.blurb}</p>
              <div style={{ fontSize: '13px', color: '#ff9d3a', textAlign: 'left', fontStyle: 'italic' }}>{cls.flavor}</div>
              <div style={{ fontSize: '12px', borderTop: '1px dashed var(--terminal-dim)', paddingTop: '8px', marginTop: '10px', textAlign: 'left' }}>
                <strong>Gear:</strong> {starterNames(cls.id)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--terminal-dim)', textAlign: 'left', marginTop: '4px' }}>{statBlock(cls.id)}</div>
            </div>
          ))}
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--terminal-dim)', cursor: 'pointer' }}>
          <input type="checkbox" checked={higherResonance} onChange={e => setHigherResonance(e.target.checked)} />
          <span><strong>Higher Resonance (New Game+):</strong> the house has seen you before. Wilder riddles, leaner oil, a harder covenant. Turn it on when you are ready to be haunted properly.</span>
        </label>

        <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
          <button type="button" className="retro-btn" onClick={onBack} style={{ padding: '10px 24px', fontSize: '14px' }}>&lt; BACK</button>
          <button type="submit" className="retro-btn" style={{ padding: '10px 24px', fontSize: '14px' }}>&gt; ENTER THE MANSION</button>
        </div>
      </form>
    </div>
  );
}

function starterNames(classId) {
  return (CLASS_STARTERS[classId] || CLASS_STARTERS.Mercenary).items.map(id => ITEMS[id]?.name || id).join(', ');
}
function statBlock(classId) {
  const s = CLASS_STARTERS[classId] || CLASS_STARTERS.Mercenary;
  return `R${s.resolve}  P${s.perception}  C${s.courage}`;
}
