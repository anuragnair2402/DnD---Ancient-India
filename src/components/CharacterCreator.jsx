import React, { useState } from 'react';

const CLASSES = [
  {
    id: 'antiquarian',
    name: 'Antiquarian',
    description: 'A dust-covered academic searching for the Star of Mewar. Expert in reading signs and inspecting dark corners.',
    stats: { sanity: 100, resolve: 7, perception: 15, courage: 8 },
    items: ['Magnifying Glass', 'Old Journal', 'Matches']
  },
  {
    id: 'exorcist',
    name: 'Exorcist (Tantrik)',
    description: 'A spiritual warder wielding knowledge of the unseen. Able to repel ghosts and preserve sanity in the dark.',
    stats: { sanity: 100, resolve: 8, perception: 9, courage: 15 },
    items: ['Sacred Ash', 'Brass Bell', 'Matches']
  },
  {
    id: 'mercenary',
    name: 'Mercenary',
    description: 'A physical explorer who trusts iron over lore. Excellent at forcing doors open and surviving structural traps.',
    stats: { sanity: 100, resolve: 15, perception: 8, courage: 7 },
    items: ['Iron Crowbar', 'Matches']
  }
];

export default function CharacterCreator({ onComplete, onBack }) {
  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState(CLASSES[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onComplete({
      name: name.trim(),
      class: selectedClass.name,
      stats: { ...selectedClass.stats, terror: 10 },
      inventory: [...selectedClass.items]
    });
  };

  return (
    <div className="creator-container">
      <div className="creator-title glow-text">CREATION TERMINAL</div>
      <p style={{ maxWidth: '600px', margin: '0 auto 20px', color: 'var(--terminal-dim)' }}>
        State your name and select a profile to enter the cursed mansion of Thakur Vikram Singh. Your inventory is small; your time is limited.
      </p>

      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '400px' }}>
          <label style={{ fontFamily: 'var(--font-pixel)', fontSize: '11px', textAlign: 'left' }}>&gt; ENTER NAME:</label>
          <input
            type="text"
            className="api-input"
            style={{ margin: 0 }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Adventurer Name"
            maxLength={16}
            required
            autoFocus
          />
        </div>

        <div className="class-grid">
          {CLASSES.map((cls) => (
            <div
              key={cls.id}
              className={`class-card ${selectedClass.id === cls.id ? 'selected' : ''}`}
              onClick={() => setSelectedClass(cls)}
            >
              <div className="class-name glow-text">{cls.name}</div>
              <p style={{ fontSize: '15px', color: 'var(--text-dim)', marginBottom: '12px', textAlign: 'left', minHeight: '60px', fontFamily: 'var(--font-sans)', lineHeight: '1.4' }}>
                {cls.description}
              </p>
              <div className="class-stats">
                <div>• Sanity: {cls.stats.sanity}</div>
                <div>• Resolve: {cls.stats.resolve}</div>
                <div>• Perception: {cls.stats.perception}</div>
                <div>• Courage: {cls.stats.courage}</div>
              </div>
              <div style={{ fontSize: '15px', borderTop: '1px dashed var(--terminal-dim)', paddingTop: '8px', marginTop: '8px', textAlign: 'left' }}>
                <strong>Gear:</strong> {cls.items.join(', ')}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
          <button type="button" className="retro-btn" onClick={onBack} style={{ padding: '10px 24px', fontSize: '14px' }}>
            &lt; BACK TO MENU
          </button>
          <button type="submit" className="retro-btn" style={{ padding: '10px 24px', fontSize: '14px' }}>
            &gt; ENTER THE MANSION
          </button>
        </div>
      </form>
    </div>
  );
}
