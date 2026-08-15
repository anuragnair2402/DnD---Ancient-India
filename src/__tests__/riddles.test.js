import { describe, it, expect } from 'vitest';
import { GATES, checkRiddleAnswer } from '../services/localStory';

describe('Mansion Gate Riddles Suite', () => {
  it('contains all 6 mandatory spirit gates across the haveli', () => {
    expect(GATES).toHaveProperty('Front Foyer->Chowk Courtyard');
    expect(GATES).toHaveProperty('Chowk Courtyard->Zenana Wing');
    expect(GATES).toHaveProperty('Chowk Courtyard->Mardana Wing');
    expect(GATES).toHaveProperty('Chowk Courtyard->Rasoda Kitchen');
    expect(GATES).toHaveProperty('Chowk Courtyard->Stepwell Baoli');
    expect(GATES).toHaveProperty('Mardana Wing->Sheesh Mahal');
  });

  describe('Gate 1: Archway of the Desert Sun (Foyer -> Chowk)', () => {
    const gateKey = 'Front Foyer->Chowk Courtyard';

    it('accepts correct answers with variations', () => {
      expect(checkRiddleAnswer(gateKey, 'shadow').correct).toBe(true);
      expect(checkRiddleAnswer(gateKey, 'a shadow').correct).toBe(true);
      expect(checkRiddleAnswer(gateKey, 'the shadow').correct).toBe(true);
      expect(checkRiddleAnswer(gateKey, 'SHADOW').correct).toBe(true);
      expect(checkRiddleAnswer(gateKey, 'answer shadow').correct).toBe(true);
      expect(checkRiddleAnswer(gateKey, '  shadows  ').correct).toBe(true);
    });

    it('rejects incorrect answers', () => {
      expect(checkRiddleAnswer(gateKey, 'sun').correct).toBe(false);
      expect(checkRiddleAnswer(gateKey, 'ghost').correct).toBe(false);
      expect(checkRiddleAnswer(gateKey, 'darkness').correct).toBe(false);
    });
  });

  describe('Gate 2: The Silk Gate of the Lost Rani (Chowk -> Zenana)', () => {
    const gateKey = 'Chowk Courtyard->Zenana Wing';

    it('accepts mirror variations', () => {
      expect(checkRiddleAnswer(gateKey, 'mirror').correct).toBe(true);
      expect(checkRiddleAnswer(gateKey, 'a mirror').correct).toBe(true);
      expect(checkRiddleAnswer(gateKey, 'the mirror').correct).toBe(true);
      expect(checkRiddleAnswer(gateKey, 'looking glass').correct).toBe(true);
      expect(checkRiddleAnswer(gateKey, 'glass').correct).toBe(true);
    });

    it('rejects incorrect answers', () => {
      expect(checkRiddleAnswer(gateKey, 'portrait').correct).toBe(false);
      expect(checkRiddleAnswer(gateKey, 'water').correct).toBe(false);
    });
  });

  describe('Gate 3: The Iron Gate of Rajput Warriors (Chowk -> Mardana)', () => {
    const gateKey = 'Chowk Courtyard->Mardana Wing';

    it('accepts sword variations', () => {
      expect(checkRiddleAnswer(gateKey, 'sword').correct).toBe(true);
      expect(checkRiddleAnswer(gateKey, 'a sword').correct).toBe(true);
      expect(checkRiddleAnswer(gateKey, 'saber').correct).toBe(true);
      expect(checkRiddleAnswer(gateKey, 'blade').correct).toBe(true);
      expect(checkRiddleAnswer(gateKey, 'talwar').correct).toBe(true);
    });

    it('rejects incorrect answers', () => {
      expect(checkRiddleAnswer(gateKey, 'shield').correct).toBe(false);
      expect(checkRiddleAnswer(gateKey, 'gun').correct).toBe(false);
    });
  });

  describe('Gate 4: The Subterranean Hearth Gate (Chowk -> Rasoda)', () => {
    const gateKey = 'Chowk Courtyard->Rasoda Kitchen';

    it('accepts fire / flame variations', () => {
      expect(checkRiddleAnswer(gateKey, 'fire').correct).toBe(true);
      expect(checkRiddleAnswer(gateKey, 'the fire').correct).toBe(true);
      expect(checkRiddleAnswer(gateKey, 'flame').correct).toBe(true);
      expect(checkRiddleAnswer(gateKey, 'hearth').correct).toBe(true);
    });

    it('rejects incorrect answers', () => {
      expect(checkRiddleAnswer(gateKey, 'smoke').correct).toBe(false);
      expect(checkRiddleAnswer(gateKey, 'ash').correct).toBe(false);
    });
  });

  describe('Gate 5: The Gate of Whispering Waters (Chowk -> Stepwell)', () => {
    const gateKey = 'Chowk Courtyard->Stepwell Baoli';

    it('accepts water variations', () => {
      expect(checkRiddleAnswer(gateKey, 'water').correct).toBe(true);
      expect(checkRiddleAnswer(gateKey, 'the water').correct).toBe(true);
      expect(checkRiddleAnswer(gateKey, 'well').correct).toBe(true);
      expect(checkRiddleAnswer(gateKey, 'a river').correct).toBe(true);
    });

    it('rejects incorrect answers', () => {
      expect(checkRiddleAnswer(gateKey, 'wind').correct).toBe(false);
      expect(checkRiddleAnswer(gateKey, 'time').correct).toBe(false);
    });
  });

  describe('Gate 6: The Cursed Mahogany Gate (Mardana -> Sheesh Mahal)', () => {
    const gateKey = 'Mardana Wing->Sheesh Mahal';

    it('accepts diamond / Star of Mewar variations', () => {
      expect(checkRiddleAnswer(gateKey, 'diamond').correct).toBe(true);
      expect(checkRiddleAnswer(gateKey, 'the diamond').correct).toBe(true);
      expect(checkRiddleAnswer(gateKey, 'star of mewar').correct).toBe(true);
      expect(checkRiddleAnswer(gateKey, 'the star of mewar').correct).toBe(true);
      expect(checkRiddleAnswer(gateKey, 'gem').correct).toBe(true);
      expect(checkRiddleAnswer(gateKey, 'jewel').correct).toBe(true);
    });

    it('rejects incorrect answers', () => {
      expect(checkRiddleAnswer(gateKey, 'gold').correct).toBe(false);
      expect(checkRiddleAnswer(gateKey, 'key').correct).toBe(false);
    });
  });
});
