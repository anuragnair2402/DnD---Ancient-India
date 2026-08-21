// Ambient prose: turn dread-beats, sanity-tier vignettes, hallucinated decoy objects,
// and the deterministic offline narration pool. All pure flavor — the engine decides truth.

export function globalTurnBeat(turn, maxTurns = 60) {
  if (turn === 15) {
    return '\n\n=== THE HOUSE REMEMBERS (Turn 15) ===\nA distant bronze bell tolls from the dark courtyard. The desert wind rushes through the jharokhas, fluttering the dead silks.';
  }
  if (turn === 30) {
    return '\n\n=== THE FREEZING DRAFT (Turn 30) ===\nThe temperature plunges without warning. Your breath billows across the stone as midnight tightens its fist.';
  }
  if (turn === 45) {
    return `\n\n=== THE MIDNIGHT HOUR APPROACHES (Turn 45/${maxTurns}) ===\nThe foundation shudders. Heavy, deliberate footsteps cross the floorboards above. Only ${maxTurns - turn} moves remain before the covenant closes around you.`;
  }
  if (maxTurns > 50 && turn === maxTurns - 5) {
    return `\n\n=== THE LAST CANDLES (Turn ${turn}/${maxTurns}) ===\nThe house is counting. You can feel the number being said. ${maxTurns - turn} moves.`;
  }
  return '';
}

// Sanity-tier vignettes appended when descending into a lower band.
export function sanityVignette(tier) {
  switch (tier) {
    case 'unsettled':
      return '\n\n[THE AIR THICKENS: The shadows along the floorboards writhe when you are not looking directly at them. Somewhere, a statue very slowly turns its head.]';
    case 'haunted':
      return '\n\n[THE SIGHT OPENS: Doors you were certain did not exist now lean toward you in the dark. The house is showing you its other rooms. Use "gaze" to focus your Sight.]';
    case 'fractured':
      return '\n\n[THE SIGHT BURNS: The walls are transparent if you dare look through them. A name trembles at the edge of your hearing — the Djinn\u2019s true name. The sane would call this madness. The sane would be wrong.]';
    default:
      return '';
  }
}

// Objects that exist only while Haunted — they look real but are illusions.
export const DECOY_OBJECTS = [
  {
    id: 'ghost_key',
    name: 'a small pale key',
    onExamine: 'You pluck up the pale key \u2014 and it dissolves into a smear of cold light between your fingers. It was never there. The house tests the Sighted with false gifts. (Sanity -5)',
    sanityChange: -5
  },
  {
    id: 'dead_match',
    name: 'a box of matches',
    onExamine: 'You reach for the matchbox. It is only a folded square of grave-dry paper, arranged to look like one. Your hand passes through it. (Sanity -5)',
    sanityChange: -5
  },
  {
    id: 'blue_flask',
    name: 'a dark flask',
    onExamine: 'The flask brims with an oily violet liquid that cannot be poured. When you blink it is gone, and you are left clutching dust. (Sanity -5)',
    sanityChange: -5
  }
];

export function randomDecoy() {
  return DECOY_OBJECTS[Math.floor(Math.random() * DECOY_OBJECTS.length)];
}

// Generic offline narration pool for free-form "examine [thing]" when no AI is available.
export const GENERIC_EXAMINE = [
  'You study it with the patience of the truly trapped. It holds no answers you can name, and one answer you are not ready to hear.',
  'Dust settles around your fingers as you touch it. Whatever this house is doing here, it was doing long before you arrived.',
  'The object gives back only an approximation of a look. Somewhere above, something watches you watching it.',
  'It is exactly what it seems — which, in this house, is a rarer mercy than it should be.',
  'The masonry here is old, the air older. Whatever this is, it has forgotten more than you will ever learn.'
];

export function genericExamine() {
  return GENERIC_EXAMINE[Math.floor(Math.random() * GENERIC_EXAMINE.length)];
}

// Ambient fallbacks for unrecognized verbs / failed actions.
export const FALLBACKS = [
  'Your voice echoes through the empty stone arches. Nothing answers but the dust.',
  'You attempt it, and the thick desert air only rises to choke your breath. Stay purposeful.',
  'The cold silence of the haveli mocks your effort. Try a clearer command.',
  'A chilling draft passes through the carved jharokha. The spirits watch you in silence and hold their judgment.'
];

export function randomFallback() {
  return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
}
