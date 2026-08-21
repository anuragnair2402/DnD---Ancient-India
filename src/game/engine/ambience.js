// Small ambient prose helpers shared by interaction handlers. Pure content.

export const ambience = {
  journal() {
    return 'You open the leather journal. A collector before you mapped this house in obsessive ink:\n' +
      '• Bronze Key: hidden in the Foyer drawer.\n' +
      '• Silver Key: locked in the Zenana trunk (crowbar, lens, or bell — depending on the hand that holds it).\n' +
      '• Gold Key: guarded by the Yaksha in the Fountain Cistern. Sacred Ash from the Rasoda pantry will not banish it, but it will part its lesser guard.\n' +
      '• The Star: behind the Mahogany Gate in the Sheesh Mahal.\n' +
      '• Deeper: the pact that binds the Djinn can be UNRAVELLED — if you find its true name, its flame, its grief, and its sky. The margins here go faint and frightened.';
  },
  trunkOpen() { return 'The Zenana trunk stands open and looted. A small, satisfied silence hangs over it.'; },
  ash() { return 'You hold the Sacred Ash in a folded hand. Embers of a hearth fire, still warm as though the priest stepped away a moment ago. It burns the things of the spirit softly.'; },
  holdItem(name) { return `You examine the ${name}. It is ordinary, and in this house ordinariness is its own quiet rebellion.`; },
  supplySplit(got) { return `Your hands are full. (You would have taken: ${got})`; }
};
