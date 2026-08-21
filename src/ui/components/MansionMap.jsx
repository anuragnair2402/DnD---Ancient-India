import { ROOMS, GATES, sanityTierOf } from '../../game/world/world.js';

// Clean orthogonal grid coordinates (X, Y) per room
const POS = {
  // --- GROUND FLOOR ---
  // Center Column
  front_foyer: [120, 200],
  chowk_courtyard: [120, 120],
  darbar_hall: [120, 40],
  // West Column
  zenana_wing: [30, 120],
  library: [30, 40],
  // East Column
  mardana_wing: [210, 120],
  armory: [210, 40],
  sheeshqhana: [210, 200],
  sheesh_mahal: [300, 40],
  // Ground Veil Rooms
  weeping_garden: [-60, 120],
  echo_corridor: [-60, 40],

  // --- UPPER FLOOR ---
  tower_stair: [120, 180],
  observatory: [120, 100],
  rooftop: [120, 20],
  // Upper Veil Room
  echo_gallery: [210, 20],

  // --- UNDERCROFT ---
  rasoda_kitchen: [120, 40],
  fountain_cistern: [210, 40],
  smugglers_tunnel: [210, 120],
  tamasha_pit: [210, 200],
  charnel_vault: [120, 200],
  djinn_sanctum: [120, 280]
};

// Maps Veil rooms strictly to their parent floor layer
const VEIL_PARENT_FLOOR = {
  weeping_garden: 'ground',
  echo_corridor: 'ground',
  echo_gallery: 'upper'
};

function layerOf(roomId) {
  return (ROOMS[roomId] && ROOMS[roomId].layer) || 'ground';
}

function short(name) {
  if (!name) return '';
  if (name.includes('Mahal')) return 'Sheesh Mahal';
  if (name.includes('Cistern')) return 'Cistern';
  if (name.includes('Smuggler')) return 'Tunnel';
  if (name.includes('Djinn')) return 'Djinn’s Sanctum';
  if (name.includes('Chowk')) return 'Chowk';
  if (name.includes('Weeping')) return 'Weeping Garden';
  if (name.includes('Corridor')) return 'Echo Corridor';
  if (name.includes('Gallery')) return 'Echo Gallery';
  return name.split(' (')[0].replace(' Wing', '').replace(' Maharaja’s', 'Obsv.');
}

function RoomBox({ id, current, tier, doors }) {
  const [x, y] = POS[id] || [0, 0];
  const isCur = id === current;
  const room = ROOMS[id];
  if (!room) return null;
  const isVeil = room.veil || layerOf(id) === 'veil';
  
  const showUnvisited = !doors.visited?.[id] && !isCur;
  const stroke = isCur ? 'hsl(40,95%,55%)' : isVeil ? '#a78bfa' : showUnvisited ? 'hsl(40,20%,20%)' : '#8a6a3a';
  const fill = isCur ? 'rgba(245,158,11,0.25)' : isVeil ? 'rgba(139,92,246,0.18)' : showUnvisited ? 'rgba(30,22,12,0.45)' : '#0f0c08';
  
  return (
    <g>
      <rect 
        x={x - 36} 
        y={y - 14} 
        width={72} 
        height={28} 
        rx={3} 
        fill={fill} 
        stroke={stroke} 
        strokeWidth={isCur ? 2 : 1.2} 
        strokeDasharray={isVeil ? '4 2' : 'none'}
      />
      <text 
        x={x} 
        y={y + 4} 
        textAnchor="middle" 
        fontFamily="VT323, monospace" 
        fontSize={11} 
        fill={isCur ? '#ffd27d' : isVeil ? '#c4b5fd' : showUnvisited ? '#6b5435' : '#b89460'}
      >
        {short(room.name)}
      </text>
    </g>
  );
}

function Connector({ rooms, unlockedGates }) {
  const [a, b] = rooms;
  const [ax, ay] = POS[a] || [0, 0];
  const [bx, by] = POS[b] || [0, 0];
  
  const gateKey = Object.keys(GATES).find(k => {
    const [f, t] = k.split('->');
    return (f === a && t === b) || (f === b && t === a);
  });
  
  const isVeil = (ROOMS[a]?.veil || layerOf(a) === 'veil') || (ROOMS[b]?.veil || layerOf(b) === 'veil');
  const open = gateKey ? !!unlockedGates[gateKey] : true;
  const color = open ? (isVeil ? '#a78bfa' : '#f59e0b') : '#92400e';
  const dash = open ? (isVeil ? '4 2' : 'none') : '3 3';
  
  const dx = bx - ax;
  const dy = by - ay;
  
  let x1, y1, x2, y2;
  if (dy === 0) {
    // Pure horizontal
    x1 = ax + Math.sign(dx) * 36;
    x2 = bx - Math.sign(dx) * 36;
    y1 = ay;
    y2 = by;
  } else if (dx === 0) {
    // Pure vertical
    x1 = ax;
    x2 = bx;
    y1 = ay + Math.sign(dy) * 14;
    y2 = by - Math.sign(dy) * 14;
  } else {
    // Diagonal
    const angle = Math.atan2(dy, dx);
    x1 = ax + Math.cos(angle) * 36;
    y1 = ay + Math.sin(angle) * 14;
    x2 = bx - Math.cos(angle) * 36;
    y2 = by - Math.sin(angle) * 14;
  }

  const c = <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={open ? 1.5 : 1.2} strokeDasharray={dash} opacity={open ? 0.9 : 0.75} />;
  const dot = !open ? (
    <g>
      <circle cx={(x1 + x2) / 2} cy={(y1 + y2) / 2} r={3.5} fill="#0d0a06" stroke="#f59e0b" strokeWidth={1} />
      <circle cx={(x1 + x2) / 2} cy={(y1 + y2) / 2} r={1.2} fill="#f59e0b" />
    </g>
  ) : null;
  return <g>{c}{dot}</g>;
}

export default function MansionMap({ currentRoom, unlockedGates = {}, sanity = 100, doors = {} }) {
  const tier = sanityTierOf(sanity);
  const currentLayer = currentRoom ? layerOf(currentRoom) : 'ground';
  const canSeeVeil = tier === 'haunted' || tier === 'fractured';
  
  // Filter rooms to strictly this floor + relevant veil rooms for this floor only
  const activeRooms = Object.keys(POS).filter(id => {
    const l = layerOf(id);
    if (l === currentLayer) return true;
    if (l === 'veil' && canSeeVeil && VEIL_PARENT_FLOOR[id] === currentLayer) return true;
    return false;
  });

  const paddingX = 45;
  const paddingY = 35;
  let dynamicViewBox = "-80 0 420 260";

  if (activeRooms.length > 0) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    activeRooms.forEach(id => {
      const [x, y] = POS[id] || [0, 0];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });

    if (minX !== Infinity) {
      const width = maxX - minX;
      const height = maxY - minY;
      dynamicViewBox = `${minX - paddingX} ${minY - paddingY} ${width + 2 * paddingX} ${height + 2 * paddingY}`;
    }
  }

  const edges = new Set();
  const connections = [];
  activeRooms.forEach(id => {
    const room = ROOMS[id];
    if (room && room.exits) {
      Object.values(room.exits).forEach(targetId => {
        if (activeRooms.includes(targetId)) {
          const edgeId = [id, targetId].sort().join('--');
          if (!edges.has(edgeId)) {
            edges.add(edgeId);
            connections.push([id, targetId]);
          }
        }
      });
    }
  });

  const layerNames = { ground: 'Ground Floor', upper: 'Upper Observatory', under: 'The Undercroft' };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 6, left: 8, fontSize: '11px', color: 'var(--terminal-amber)', textShadow: '0 0 4px var(--terminal-glow)' }}>
        [ {layerNames[currentLayer] ? layerNames[currentLayer].toUpperCase() : 'FLOOR PLAN'} ]
        {canSeeVeil && <span style={{ color: '#a78bfa', marginLeft: '6px', fontSize: '9px' }}>✦ THE SIGHT ACTIVE</span>}
      </div>
      <svg viewBox={dynamicViewBox} style={{ width: '100%', height: '100%', display: 'block' }}>
        {connections.map(([a, b]) => (
          <Connector key={`${a}-${b}`} rooms={[a, b]} unlockedGates={unlockedGates} />
        ))}

        {activeRooms.map(id => (
          <RoomBox key={id} id={id} current={currentRoom} tier={tier} doors={doors} />
        ))}
      </svg>
    </div>
  );
}
