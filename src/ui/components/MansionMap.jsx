import { ROOMS, GATES, sanityTierOf } from '../../game/world/world.js';

// Schematic room positions per layer (viewBox coordinates).
const POS = {
  // ground
  front_foyer: [50, 190], chowk_courtyard: [50, 120],
  zenana_wing: [-40, 120], mardana_wing: [140, 120],
  darbar_hall: [50, 50], library: [-40, 50], armory: [140, 50],
  sheeshqhana: [140, 190], sheesh_mahal: [230, 50],
  // upper
  tower_stair: [50, 120], observatory: [50, 50], rooftop: [50, -20], echo_gallery: [170, -20],
  // under
  rasoda_kitchen: [50, 200], fountain_cistern: [140, 200],
  charnel_vault: [50, 280], smugglers_tunnel: [140, 280],
  tamasha_pit: [230, 280], djinn_sanctum: [140, 350],
  // veil
  weeping_garden: [-40, 190], echo_corridor: [-40, 50]
};

function layerOf(roomId) {
  return (ROOMS[roomId] && ROOMS[roomId].layer) || 'ground';
}

function RoomBox({ id, current, tier, doors }) {
  const [x, y] = POS[id] || [0, 0];
  const isCur = id === current;
  const room = ROOMS[id];
  const veil = room && room.veil;
  // Veil rooms only shown if the player can perceive them
  if (veil) {
    const canSee = tier === 'haunted' || tier === 'fractured';
    if (!canSee) return null;
  }
  const showUnvisited = room && !doors.visited?.[id] && !isCur;
  const stroke = isCur ? 'hsl(40,95%,55%)' : veil ? 'hsl(270,60%,55%)' : showUnvisited ? 'hsl(40,20%,18%)' : '#6a4c24';
  const fill = isCur ? 'rgba(245,158,11,0.22)' : showUnvisited ? 'rgba(40,30,15,0.35)' : '#0d0a06';
  return (
    <g>
      <rect x={x - 36} y={y - 16} width={72} height={32} rx={2} fill={fill} stroke={stroke} strokeWidth={isCur ? 2 : 1.2} />
      <text x={x} y={y + 4} textAnchor="middle" fontFamily="VT323, monospace" fontSize={10} fill={isCur ? '#ffd27d' : veil ? '#c39bff' : '#8a6a3a'}>{short(room.name)}</text>
    </g>
  );
}

function short(name) {
  if (name.includes('Mahal')) return 'Sheesh Mahal';
  if (name.includes('Cistern')) return 'Cistern';
  if (name.includes('Smuggler')) return 'Tunnel';
  if (name.includes('Djinn')) return 'Djinn\u2019s Sanctum';
  return name.split(' (')[0].replace(' Wing', '').replace(' Courtyard', 'Chowk').replace(' Maharaja\u2019s', 'Obsv.');
}

function Connector({ rooms, current, unlockedGates, tier }) {
  // draw a line between two rooms if both are visible
  const [a, b] = rooms;
  if (layerOf(a) !== layerOf(b)) return null;
  const [ax, ay] = POS[a] || [0, 0]; const [bx, by] = POS[b] || [0, 0];
  const gateKey = Object.keys(GATES).find(k => {
    const [f, t] = k.split('->');
    return (f === a && t === b) || (f === b && t === a);
  });
  const isVeil = [a, b].some(id => ROOMS[id] && ROOMS[id].veil) || (layerOf(a) === 'veil');
  const open = gateKey ? !!unlockedGates[gateKey] : true;
  const color = open ? '#2a8f6d' : isVeil ? '#7a5fd0' : '#b33a2a';
  const dash = open ? 'none' : '4 3';
  const x1 = ax + (bx > ax ? 30 : bx < ax ? -30 : 0);
  const x2 = bx + (ax > bx ? 30 : ax < bx ? -30 : 0);
  const c = <line x1={x1} y1={ay} x2={x2} y2={by} stroke={color} strokeWidth={1.4} strokeDasharray={dash} />;
  const dot = !open ? <circle cx={(x1 + x2) / 2} cy={(ay + by) / 2} r={3} fill={color} /> : null;
  return <g>{c}{dot}</g>;
}

export default function MansionMap({ currentRoom, unlockedGates = {}, sanity = 100, doors = {}, layer }) {
  const tier = sanityTierOf(sanity);
  const layers = { ground: ['Ground'], upper: ['Upper'], under: ['Under'], veil: ['The Sight'] };
  return (
    <svg viewBox="-70 -40 340 420" style={{ width: '100%', height: '100%', display: 'block' }}>
      {/* veil corridor ribbon */}
      <text x={-40} y={-28} textAnchor="middle" fontFamily="Press Start 2P, monospace" fontSize={6} fill="#7a5fd0" letterSpacing={1}>THE SIGHT</text>
      <line x1={-40} y1={-20} x2={-40} y2={230} stroke="#2a2240" strokeWidth={1} strokeDasharray="3 3" />
      <line x1={165} y1={-20} x2={165} y2={230} stroke="#2a2240" strokeWidth={1} strokeDasharray="3 3" />

      {Object.keys(POS).map(id => <Connector key={'c' + id} rooms={[id, nearestNeighbour(id)]} current={currentRoom} unlockedGates={unlockedGates} tier={tier} />)}

      {Object.keys(POS).map(id => (
        <RoomBox key={id} id={id} current={currentRoom} tier={tier} doors={doors} />
      ))}
    </svg>
  );
}

// helper: a room's nearest "connected" partner minus both rooms for an edge line
function nearestNeighbour(id) {
  const room = ROOMS[id];
  if (!room) return id === 'front_foyer' ? 'chowk_courtyard' : 'chowk_courtyard';
  const ex = Object.values(room.exits || {});
  if (ex[0]) return ex[0];
  return 'chowk_courtyard';
}
