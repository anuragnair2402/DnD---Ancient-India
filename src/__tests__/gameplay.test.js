import { describe, it, expect } from 'vitest';
import { executeLocalCommand, rooms } from '../services/localStory';

describe('Mansion Escape Gameplay Engine', () => {
  const baseState = {
    currentRoom: 'Front Foyer',
    inventory: ['Matches'],
    objective: 'Search the Foyer and look for a way deeper into the mansion.',
    playerClass: 'Mercenary',
    stats: { sanity: 100, maxSanity: 100, resolve: 15, perception: 8, courage: 7, terror: 10 }
  };

  describe('Front Foyer & Gate 1 Interaction', () => {
    it('allows searching the drawer to find the Bronze Key', () => {
      const res = executeLocalCommand(baseState, 'open drawer');
      expect(res.stateUpdates.addInventory).toBe('Bronze Key');
      expect(res.stateUpdates.setKeyCollected).toBe('bronze');
      expect(res.storyText).toContain('BRONZE KEY');
    });

    it('blocks movement to Chowk if Gate 1 riddle is not unlocked', () => {
      const res = executeLocalCommand(baseState, 'go north', {});
      expect(res.requiresRiddle).toBe(true);
      expect(res.gateKey).toBe('Front Foyer->Chowk Courtyard');
      expect(res.storyText).toContain('[GATE SEALED');
    });

    it('allows movement to Chowk if Gate 1 is unlocked', () => {
      const unlocked = { 'Front Foyer->Chowk Courtyard': true };
      const res = executeLocalCommand(baseState, 'go north', unlocked);
      expect(res.stateUpdates.currentRoom).toBe('Chowk Courtyard');
      expect(res.storyText).toContain('You pass through into the Chowk Courtyard');
    });
  });

  describe('Multi-Class Trunk Puzzle in Zenana Wing', () => {
    it('allows Mercenary with Iron Crowbar to pry open trunk', () => {
      const mercState = {
        currentRoom: 'Zenana Wing',
        inventory: ['Iron Crowbar', 'Matches'],
        playerClass: 'Mercenary',
        stats: { sanity: 100, resolve: 15, perception: 8, courage: 7 },
        objective: 'Explore Zenana'
      };

      const res = executeLocalCommand(mercState, 'use crowbar');
      expect(res.stateUpdates.addInventory).toBe('Silver Key');
      expect(res.stateUpdates.setKeyCollected).toBe('silver');
      expect(res.stateUpdates.oilChange).toBe(30);
    });

    it('allows Antiquarian with Magnifying Glass to open trunk via secret latch', () => {
      const antiState = {
        currentRoom: 'Zenana Wing',
        inventory: ['Magnifying Glass', 'Matches'],
        playerClass: 'Antiquarian',
        stats: { sanity: 100, resolve: 7, perception: 15, courage: 8 },
        objective: 'Explore Zenana'
      };

      const res = executeLocalCommand(antiState, 'use glass');
      expect(res.stateUpdates.addInventory).toBe('Silver Key');
      expect(res.stateUpdates.setKeyCollected).toBe('silver');
      expect(res.storyText).toContain('hidden spring pin');
    });

    it('allows Exorcist with Brass Bell to dispel trunk ward', () => {
      const exoState = {
        currentRoom: 'Zenana Wing',
        inventory: ['Brass Bell', 'Sacred Ash'],
        playerClass: 'Exorcist (Tantrik)',
        stats: { sanity: 100, resolve: 8, perception: 9, courage: 15 },
        objective: 'Explore Zenana'
      };

      const res = executeLocalCommand(exoState, 'use bell');
      expect(res.stateUpdates.addInventory).toBe('Silver Key');
      expect(res.stateUpdates.setKeyCollected).toBe('silver');
      expect(res.storyText).toContain('spiritual binding ward');
    });
  });

  describe('Rasoda Kitchen & Sacred Ash Retrieval', () => {
    it('retrieves Sacred Ash and oil from the pantry cabinet', () => {
      const kitchenState = {
        currentRoom: 'Rasoda Kitchen',
        inventory: ['Matches'],
        playerClass: 'Mercenary',
        stats: { sanity: 100 },
        objective: 'Find sacred ash'
      };

      const res = executeLocalCommand(kitchenState, 'open cabinet');
      expect(res.stateUpdates.addInventory).toBe('Sacred Ash');
      expect(res.stateUpdates.oilChange).toBe(40);
    });

    it('applies sanity damage on scorpion sting', () => {
      const kitchenState = {
        currentRoom: 'Rasoda Kitchen',
        inventory: [],
        playerClass: 'Mercenary',
        stats: { sanity: 100 }
      };

      const res = executeLocalCommand(kitchenState, 'examine pot');
      expect(res.stateUpdates.sanityChange).toBe(-10);
      expect(res.storyText).toContain('scorpion');
    });
  });

  describe('Stepwell Baoli & Yaksha Guardian', () => {
    it('defeats the Yaksha and gets Gold Key when using Sacred Ash', () => {
      const baoliState = {
        currentRoom: 'Stepwell Baoli',
        inventory: ['Sacred Ash', 'Bronze Key', 'Silver Key'],
        playerClass: 'Mercenary',
        stats: { sanity: 80 }
      };

      const res = executeLocalCommand(baoliState, 'use ash');
      expect(res.stateUpdates.addInventory).toBe('Gold Key');
      expect(res.stateUpdates.setKeyCollected).toBe('gold');
      expect(res.stateUpdates.removeInventory).toBe('Sacred Ash');
      expect(res.storyText).toContain('GOLD KEY');
    });

    it('inflicts high sanity damage if player reaches for Gold Key without banishing Yaksha', () => {
      const baoliState = {
        currentRoom: 'Stepwell Baoli',
        inventory: ['Bronze Key', 'Silver Key'],
        playerClass: 'Mercenary',
        stats: { sanity: 80 }
      };

      const res = executeLocalCommand(baoliState, 'take key');
      expect(res.stateUpdates.sanityChange).toBe(-20);
      expect(res.storyText).toContain('freezing torrent');
    });

    it('restores sanity when drinking from the well', () => {
      const baoliState = {
        currentRoom: 'Stepwell Baoli',
        inventory: [],
        playerClass: 'Mercenary',
        stats: { sanity: 60 }
      };

      const res = executeLocalCommand(baoliState, 'drink water');
      expect(res.stateUpdates.sanityChange).toBe(20);
      expect(res.storyText).toContain('soothing your trembling nerves');
    });
  });

  describe('Sheesh Mahal & Star of Mewar Retrieval', () => {
    it('blocks access to Sheesh Mahal if player does not possess all 3 keys', () => {
      const mardanaState = {
        currentRoom: 'Mardana Wing',
        inventory: ['Bronze Key', 'Silver Key'], // Missing Gold Key
        playerClass: 'Mercenary',
        stats: { sanity: 100 }
      };

      const res = executeLocalCommand(mardanaState, 'go north', {});
      expect(res.storyText).toContain('bound with three keyholes');
    });

    it('presents final riddle gate when player possesses all 3 keys', () => {
      const mardanaState = {
        currentRoom: 'Mardana Wing',
        inventory: ['Bronze Key', 'Silver Key', 'Gold Key'],
        playerClass: 'Mercenary',
        stats: { sanity: 100 }
      };

      const res = executeLocalCommand(mardanaState, 'go north', {});
      expect(res.requiresRiddle).toBe(true);
      expect(res.gateKey).toBe('Mardana Wing->Sheesh Mahal');
      expect(res.storyText).toContain('THE CURSED MAHOGANY GATE');
    });

    it('allows taking the Star of Mewar inside Sheesh Mahal', () => {
      const sheeshState = {
        currentRoom: 'Sheesh Mahal',
        inventory: ['Bronze Key', 'Silver Key', 'Gold Key'],
        playerClass: 'Mercenary',
        stats: { sanity: 90 }
      };

      const res = executeLocalCommand(sheeshState, 'take diamond');
      expect(res.stateUpdates.addInventory).toBe('Star of Mewar');
      expect(res.storyText).toContain('STAR OF MEWAR');
    });
  });
});
