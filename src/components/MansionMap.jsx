import React from 'react';

// Color helpers
function roomFill(name, current) {
  if (name === current) return 'rgba(245, 158, 11, 0.20)';
  return '#090604';
}
function roomStroke(name, current) {
  if (name === current) return 'hsl(40, 95%, 55%)';
  return '#4a3820';
}
function roomStrokeW(name, current) {
  return name === current ? 2 : 1.5;
}
function labelFill(name, current) {
  if (name === current) return 'hsl(40, 95%, 60%)';
  return '#5a4020';
}

function gateColor(gateKey, unlockedGates) {
  if (unlockedGates && unlockedGates[gateKey]) {
    return '#10b981'; // Green / open
  }
  return '#ef4444'; // Red / locked by riddle
}

export default function MansionMap({ currentRoom, unlockedGates = {} }) {
  return (
    <svg
      viewBox="0 0 310 300"
      style={{ width: '100%', maxHeight: '265px', display: 'block', pointerEvents: 'none' }}
      aria-label="Mansion floor plan map"
    >
      {/* ── Row 0: Stepwell Baoli (col 1) | Sheesh Mahal (col 2) ── */}
      <rect x="90" y="5" width="120" height="70" fill={roomFill("Stepwell Baoli", currentRoom)} stroke={roomStroke("Stepwell Baoli", currentRoom)} strokeWidth={roomStrokeW("Stepwell Baoli", currentRoom)} />
      <text x="150" y="35" textAnchor="middle" fontFamily="VT323, monospace" fontSize="14" fill={labelFill("Stepwell Baoli", currentRoom)}>Stepwell</text>
      <text x="150" y="51" textAnchor="middle" fontFamily="VT323, monospace" fontSize="14" fill={labelFill("Stepwell Baoli", currentRoom)}>Baoli</text>

      <rect x="210" y="5" width="95" height="70" fill={roomFill("Sheesh Mahal", currentRoom)} stroke={roomStroke("Sheesh Mahal", currentRoom)} strokeWidth={roomStrokeW("Sheesh Mahal", currentRoom)} />
      <text x="257" y="35" textAnchor="middle" fontFamily="VT323, monospace" fontSize="13" fill={labelFill("Sheesh Mahal", currentRoom)}>Sheesh</text>
      <text x="257" y="51" textAnchor="middle" fontFamily="VT323, monospace" fontSize="13" fill={labelFill("Sheesh Mahal", currentRoom)}>Mahal</text>

      {/* ── Row 1: Zenana | Chowk | Mardana ── */}
      <rect x="5" y="75" width="85" height="80" fill={roomFill("Zenana Wing", currentRoom)} stroke={roomStroke("Zenana Wing", currentRoom)} strokeWidth={roomStrokeW("Zenana Wing", currentRoom)} />
      <text x="47" y="111" textAnchor="middle" fontFamily="VT323, monospace" fontSize="14" fill={labelFill("Zenana Wing", currentRoom)}>Zenana</text>
      <text x="47" y="127" textAnchor="middle" fontFamily="VT323, monospace" fontSize="14" fill={labelFill("Zenana Wing", currentRoom)}>Wing</text>

      <rect x="90" y="75" width="120" height="80" fill={roomFill("Chowk Courtyard", currentRoom)} stroke={roomStroke("Chowk Courtyard", currentRoom)} strokeWidth={roomStrokeW("Chowk Courtyard", currentRoom)} />
      <text x="150" y="108" textAnchor="middle" fontFamily="VT323, monospace" fontSize="13" fill={labelFill("Chowk Courtyard", currentRoom)}>Chowk</text>
      <text x="150" y="124" textAnchor="middle" fontFamily="VT323, monospace" fontSize="13" fill={labelFill("Chowk Courtyard", currentRoom)}>Courtyard</text>
      <text x="150" y="145" textAnchor="middle" fontFamily="VT323, monospace" fontSize="10" fill="#3a2818">▼ below</text>

      <rect x="210" y="75" width="95" height="80" fill={roomFill("Mardana Wing", currentRoom)} stroke={roomStroke("Mardana Wing", currentRoom)} strokeWidth={roomStrokeW("Mardana Wing", currentRoom)} />
      <text x="257" y="111" textAnchor="middle" fontFamily="VT323, monospace" fontSize="13" fill={labelFill("Mardana Wing", currentRoom)}>Mardana</text>
      <text x="257" y="127" textAnchor="middle" fontFamily="VT323, monospace" fontSize="13" fill={labelFill("Mardana Wing", currentRoom)}>Wing</text>

      {/* ── Row 2: Front Foyer ── */}
      <rect x="90" y="155" width="120" height="65" fill={roomFill("Front Foyer", currentRoom)} stroke={roomStroke("Front Foyer", currentRoom)} strokeWidth={roomStrokeW("Front Foyer", currentRoom)} />
      <text x="150" y="185" textAnchor="middle" fontFamily="VT323, monospace" fontSize="14" fill={labelFill("Front Foyer", currentRoom)}>Front</text>
      <text x="150" y="201" textAnchor="middle" fontFamily="VT323, monospace" fontSize="14" fill={labelFill("Front Foyer", currentRoom)}>Foyer</text>

      {/* ─── DOOR GAPS & RIDDLE GATE LOCK INDICATORS ─── */}

      {/* Stepwell <-> Chowk (y=75, centered x=150) */}
      <rect x="136" y="70" width="28" height="10" fill="#090604" />
      <rect x="136" y="70" width="5" height="10" fill="#2a1e0c" />
      <rect x="159" y="70" width="5" height="10" fill="#2a1e0c" />
      <circle cx="150" cy="75" r="3.5" fill={gateColor("Chowk Courtyard->Stepwell Baoli", unlockedGates)} />

      {/* Sheesh Mahal <-> Mardana (y=75, centered x=257) */}
      <rect x="243" y="70" width="28" height="10" fill="#090604" />
      <rect x="243" y="70" width="5" height="10" fill="#2a1e0c" />
      <rect x="266" y="70" width="5" height="10" fill="#2a1e0c" />
      <circle cx="257" cy="75" r="3.5" fill={gateColor("Mardana Wing->Sheesh Mahal", unlockedGates)} />

      {/* Zenana <-> Chowk (x=90, centered y=115) */}
      <rect x="85" y="108" width="10" height="18" fill="#090604" />
      <rect x="85" y="108" width="10" height="4" fill="#2a1e0c" />
      <rect x="85" y="122" width="10" height="4" fill="#2a1e0c" />
      <circle cx="90" cy="117" r="3.5" fill={gateColor("Chowk Courtyard->Zenana Wing", unlockedGates)} />

      {/* Chowk <-> Mardana (x=210, centered y=115) */}
      <rect x="205" y="108" width="10" height="18" fill="#090604" />
      <rect x="205" y="108" width="10" height="4" fill="#2a1e0c" />
      <rect x="205" y="122" width="10" height="4" fill="#2a1e0c" />
      <circle cx="210" cy="117" r="3.5" fill={gateColor("Chowk Courtyard->Mardana Wing", unlockedGates)} />

      {/* Chowk <-> Foyer (y=155, centered x=150) */}
      <rect x="136" y="150" width="28" height="10" fill="#090604" />
      <rect x="136" y="150" width="5" height="10" fill="#2a1e0c" />
      <rect x="159" y="150" width="5" height="10" fill="#2a1e0c" />
      <circle cx="150" cy="155" r="3.5" fill={gateColor("Front Foyer->Chowk Courtyard", unlockedGates)} />

      {/* ─── LEVEL SEPARATOR ─── */}
      <line x1="5" y1="232" x2="305" y2="232" stroke="#2a1e0c" strokeWidth="1" strokeDasharray="5 3" />
      <text x="155" y="243" textAnchor="middle" fontFamily="Press Start 2P, monospace" fontSize="6" fill="#3a2818" letterSpacing="1">SUBTERRANEAN</text>

      {/* Stairwell connector */}
      <line x1="150" y1="220" x2="150" y2="252" stroke="#2a1e0c" strokeWidth="1" strokeDasharray="3 2" />
      <circle cx="150" cy="236" r="3.5" fill={gateColor("Chowk Courtyard->Rasoda Kitchen", unlockedGates)} />

      {/* ── Rasoda Kitchen ── */}
      <rect x="90" y="252" width="120" height="43" fill={roomFill("Rasoda Kitchen", currentRoom)} stroke={roomStroke("Rasoda Kitchen", currentRoom)} strokeWidth={roomStrokeW("Rasoda Kitchen", currentRoom)} />
      <text x="150" y="271" textAnchor="middle" fontFamily="VT323, monospace" fontSize="13" fill={labelFill("Rasoda Kitchen", currentRoom)}>Rasoda</text>
      <text x="150" y="287" textAnchor="middle" fontFamily="VT323, monospace" fontSize="13" fill={labelFill("Rasoda Kitchen", currentRoom)}>Kitchen</text>

      {/* ─── CURRENT LOCATION CURSOR ▶ ─── */}
      {currentRoom === "Stepwell Baoli"   && <text x="92"  y="20"  fontFamily="VT323, monospace" fontSize="14" fill="hsl(40,95%,55%)">▶</text>}
      {currentRoom === "Sheesh Mahal"     && <text x="212" y="20"  fontFamily="VT323, monospace" fontSize="14" fill="hsl(40,95%,55%)">▶</text>}
      {currentRoom === "Zenana Wing"      && <text x="7"   y="88"  fontFamily="VT323, monospace" fontSize="14" fill="hsl(40,95%,55%)">▶</text>}
      {currentRoom === "Chowk Courtyard"  && <text x="92"  y="88"  fontFamily="VT323, monospace" fontSize="14" fill="hsl(40,95%,55%)">▶</text>}
      {currentRoom === "Mardana Wing"     && <text x="212" y="88"  fontFamily="VT323, monospace" fontSize="14" fill="hsl(40,95%,55%)">▶</text>}
      {currentRoom === "Front Foyer"      && <text x="92"  y="168" fontFamily="VT323, monospace" fontSize="14" fill="hsl(40,95%,55%)">▶</text>}
      {currentRoom === "Rasoda Kitchen"   && <text x="92"  y="265" fontFamily="VT323, monospace" fontSize="14" fill="hsl(40,95%,55%)">▶</text>}
    </svg>
  );
}
