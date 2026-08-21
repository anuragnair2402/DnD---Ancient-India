
import { useEffect } from 'react';

export default function HelpModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const Col = ({ title, rows }) => (
    <div>
      <h3 style={{ textDecoration: 'underline', color: '#ffb03a', margin: '8px 0' }}>{title}</h3>
      {rows.map((r, i) => <p key={i}>• {r}</p>)}
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '860px' }}>
        <div className="modal-header">
          <span>&gt; COMMANDS &amp; THE COVENANT</span>
          <button className="help-btn" onClick={onClose}>[CLOSE]</button>
        </div>
        <div className="modal-body">
          <p style={{ marginBottom: '16px', color: '#ffb03a', fontWeight: 'bold' }}>
            Type commands and press Enter. The house answers in standard adventure syntax, and remembers every word.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '18px' }}>
            <Col title="Movement" rows={['n / s / e / w / up / down', 'go north · go south …','enter / leave a room','climb (uses rope)']} />
            <Col title="Items & Verbs" rows={['take / drop [item]','use [item] on [target]','open / search [object]','examine / x [object]','read [journal/scroll]','combine A with B','light (lantern)']} />
            <Col title="The Mind (Sanity)" rows={['meditate / pray (quiet rooms)','surrender — spend sanity for the Sight','gaze — focus the Sight','whisper — ask the house (low sanity)','stats — status record']} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginTop: '14px' }}>
            <Col title="The House & The Covenant" rows={[
              'Sanity is a currency and a sense. To see the hidden rooms, you must be willing to pay it down.',
              'Gates are held by spirit-riddles. Answer them — or venture deeper and learn the covenant that binds them.',
              'Gather the true name, the Ember, the grief, and the sky to unmake the pact at the Sanctum.',
              'Three keys open the Sheesh Mahal and the Star — one kind of escape.'
            ]} />
            <Col title="System" rows={['look / l · inventory / i · help','codex — your almanac of discoveries','restart — abandon this run','escape — attempt the front gate']} />
          </div>
          <p style={{ marginTop: '18px', fontSize: '13px', color: 'var(--terminal-dim)', fontStyle: 'italic' }}>
            ESC or CLOSE to return. The house is listening either way.
          </p>
        </div>
      </div>
    </div>
  );
}
