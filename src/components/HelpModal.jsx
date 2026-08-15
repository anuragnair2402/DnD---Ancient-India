import React, { useEffect } from 'react';

export default function HelpModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>&gt; COMMANDS GUIDE</span>
          <button className="help-btn" onClick={onClose}>[CLOSE]</button>
        </div>
        <div className="modal-body">
          <p style={{ marginBottom: '16px', color: '#ffb03a', fontWeight: 'bold' }}>
            Type your commands into the prompt and press Enter. The mansion responds to standard text-adventure syntax.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h3 style={{ textDecoration: 'underline', color: '#ffb03a', margin: '8px 0' }}>Movement</h3>
              <p>• <strong>n</strong> / <strong>go north</strong></p>
              <p>• <strong>s</strong> / <strong>go south</strong></p>
              <p>• <strong>e</strong> / <strong>go east</strong></p>
              <p>• <strong>w</strong> / <strong>go west</strong></p>
              <p>• <strong>u</strong> / <strong>go up</strong> (to stairs/ladders)</p>
              <p>• <strong>d</strong> / <strong>go down</strong> (to cellars/kitchen)</p>
            </div>

            <div>
              <h3 style={{ textDecoration: 'underline', color: '#ffb03a', margin: '8px 0' }}>Interaction Verbs</h3>
              <p>• <strong>take [item]</strong> / <strong>get [item]</strong></p>
              <p>• <strong>drop [item]</strong></p>
              <p>• <strong>examine [object]</strong> / <strong>x [object]</strong></p>
              <p>• <strong>open [door/chest/cabinet]</strong></p>
              <p>• <strong>use [item] on [target]</strong></p>
            </div>
          </div>

          <div style={{ marginTop: '20px', borderTop: '1px dashed var(--terminal-dim)', paddingTop: '16px' }}>
            <h3 style={{ textDecoration: 'underline', color: '#ffb03a', margin: '8px 0' }}>System Commands</h3>
            <p>• <strong>look</strong> / <strong>l</strong> - Re-describe your current surroundings.</p>
            <p>• <strong>inventory</strong> / <strong>i</strong> - Check what items you are holding.</p>
            <p>• <strong>help</strong> - Toggle this instruction reference list.</p>
            <p>• <strong>restart</strong> - Restart the current escape session.</p>
          </div>

          <p style={{ marginTop: '20px', fontSize: '15px', color: 'var(--terminal-dim)', fontStyle: 'italic' }}>
            Press ESC or click CLOSE to return to the console.
          </p>
        </div>
      </div>
    </div>
  );
}
