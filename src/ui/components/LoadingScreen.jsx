import { useState, useEffect } from 'react';

const HAVELI_LORE = [
  "Rani Roopmati was not the first to lose a child to the oculus; she was merely the only one who carved her name into the glass.",
  "The Djinn does not hunger for flesh. It drinks lamp oil and the memories of broken promises.",
  "If you find a closed wooden drawer in the Foyer, open it. The Thakur left his matches there in 1888.",
  "When the lantern gutters out, do not stand still. Darkness in Mewar has teeth.",
  "The sandstone pillars of the Chowk were quarried from the Thar desert. On quiet nights, they still weep salt.",
  "A tantrik once tried to banish the spirit using holy water. The spirit drank it and asked for salt.",
  "The Echo Veil is not another floor; it is the house remembering how it used to bleed.",
  "True names cannot be stolen, but they can be read in the gallery above the roof.",
  "The three keys—Bronze, Silver, and Gold—were forged by an artisan who immediately forgot how to speak.",
  "Breathe steady in the courtyard. The dead give a wide berth to those who know how to meditate.",
  "The mirrors in the Sheesh Mahal do not reflect the room you are in. They reflect the room you left behind.",
  "The Smuggler’s Tunnel was built for salt, then used for gold, and finally sealed for blood."
];

function getOccultPhase(progress) {
  if (progress < 15) return "Stirring the ashes of the 19th-century hearth…";
  if (progress < 35) return "Translating ancient Mewari covenants from stone…";
  if (progress < 55) return "Breathing memory into the Djinn’s slumbering mind…";
  if (progress < 75) return "Weaving riddles across the sealed sandstone arches…";
  if (progress < 90) return "Aligning the oculus with the desert stars…";
  if (progress < 100) return "The house awakens. The brass locks turn cold…";
  return "The covenant is sealed. Enter if you dare.";
}

export default function LoadingScreen({ progress = 0, onSkip }) {
  const [loreIndex, setLoreIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setLoreIndex((prev) => (prev + 1) % HAVELI_LORE.length);
        setFade(true);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const pct = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div 
      className="api-container loading-screen-container" 
      style={{ 
        maxWidth: '620px', 
        margin: '0 auto', 
        textAlign: 'center', 
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      {/* Title & Architecture Subtitle */}
      <div className="loading-header" style={{ marginBottom: '28px' }}>
        <h2 
          className="creator-title glow-text" 
          style={{ fontSize: '30px', marginBottom: '10px', letterSpacing: '3px' }}
        >
          CONJURING THE DJINN
        </h2>
        <div 
          style={{ 
            fontSize: '11px', 
            color: 'var(--terminal-dim)', 
            fontFamily: 'var(--font-pixel)', 
            letterSpacing: '1.5px',
            whiteSpace: 'nowrap' 
          }}
        >
          [ ULTRA-LIGHT QWEN 2.5 • IN-BROWSER WEBGPU ]
        </div>
      </div>

      {/* Living Shimmer Progress Gauge */}
      <div className="living-progress-wrapper" style={{ width: '100%', maxWidth: '520px', marginBottom: '26px' }}>
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '8px', 
            fontSize: '11px', 
            fontFamily: 'var(--font-pixel)', 
            color: 'var(--terminal-amber)',
            letterSpacing: '1px'
          }}
        >
          <span>CONJURATION PROGRESS</span>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#ffea53' }}>{pct}%</span>
        </div>

        <div className="living-progress-frame" style={{ height: '20px' }}>
          <div 
            className="living-progress-bar" 
            style={{ width: `${pct}%` }}
          >
            <div className="energy-sweep" />
          </div>
        </div>

        {/* Dedicated Phase Caption on its own clean line */}
        <div 
          style={{ 
            marginTop: '10px', 
            fontSize: '13px', 
            color: '#ffea53', 
            fontStyle: 'italic', 
            minHeight: '22px', 
            textAlign: 'center',
            letterSpacing: '0.3px'
          }}
        >
          {getOccultPhase(pct)}
        </div>
      </div>

      {/* Whimsical Tales of the Haveli Ticker Card */}
      <div 
        className="lore-ticker-card" 
        style={{ 
          width: '100%',
          maxWidth: '520px', 
          minHeight: '105px', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center',
          padding: '16px 22px',
          marginBottom: '28px'
        }}
      >
        <div 
          style={{ 
            fontSize: '10px', 
            color: '#ffd27d', 
            fontFamily: 'var(--font-pixel)', 
            marginBottom: '8px', 
            letterSpacing: '1.5px', 
            textTransform: 'uppercase' 
          }}
        >
          ✦ Whispers of Mewar ✦
        </div>
        <p 
          style={{ 
            fontSize: '14px', 
            color: 'var(--terminal-dim)', 
            lineHeight: '1.5', 
            fontStyle: 'italic', 
            margin: '0 auto',
            maxWidth: '470px',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            opacity: fade ? 1 : 0,
            transform: fade ? 'translateY(0)' : 'translateY(4px)'
          }}
        >
          “{HAVELI_LORE[loreIndex]}”
        </p>
      </div>

      {/* Play Offline Skip Fallback */}
      <div>
        <button 
          type="button" 
          className="retro-btn" 
          style={{ padding: '10px 28px', fontSize: '13px', letterSpacing: '1px' }} 
          onClick={onSkip}
        >
          [SKIP TO PLAY OFFLINE (INSTANT)]
        </button>
        <div 
          style={{ 
            fontSize: '11px', 
            color: 'var(--terminal-dim)', 
            marginTop: '10px',
            letterSpacing: '0.3px'
          }}
        >
          Full deterministic campaign with handcrafted riddles is always available instantly.
        </div>
      </div>
    </div>
  );
}
