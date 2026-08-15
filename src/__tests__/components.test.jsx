import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MansionMap from '../components/MansionMap';
import CharacterCreator from '../components/CharacterCreator';

describe('React Component Tests', () => {
  describe('MansionMap Component', () => {
    it('renders all haveli room labels', () => {
      const { container } = render(
        <MansionMap currentRoom="Front Foyer" unlockedGates={{}} />
      );

      expect(container.textContent).toContain('Front');
      expect(container.textContent).toContain('Foyer');
      expect(container.textContent).toContain('Chowk');
      expect(container.textContent).toContain('Zenana');
      expect(container.textContent).toContain('Mardana');
      expect(container.textContent).toContain('Stepwell');
      expect(container.textContent).toContain('Sheesh');
      expect(container.textContent).toContain('Rasoda');
    });

    it('renders current location marker ▶', () => {
      const { container } = render(
        <MansionMap currentRoom="Zenana Wing" unlockedGates={{}} />
      );
      expect(container.textContent).toContain('▶');
    });

    it('renders gate status indicators with correct lock colors', () => {
      const unlockedGates = {
        'Front Foyer->Chowk Courtyard': true,
        'Chowk Courtyard->Zenana Wing': false
      };

      const { container } = render(
        <MansionMap currentRoom="Chowk Courtyard" unlockedGates={unlockedGates} />
      );

      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBeGreaterThan(0);

      // Check that at least one green (open) and one red (locked) gate circle exists
      const fills = Array.from(circles).map(c => c.getAttribute('fill'));
      expect(fills).toContain('#10b981'); // Green
      expect(fills).toContain('#ef4444'); // Red
    });
  });

  describe('CharacterCreator Component', () => {
    it('renders the character creator with class options', () => {
      const onComplete = vi.fn();
      render(<CharacterCreator onComplete={onComplete} onBack={() => {}} />);

      expect(screen.getByText('CREATION TERMINAL')).toBeDefined();
      expect(screen.getByText(/Antiquarian/i)).toBeDefined();
      expect(screen.getByText(/Exorcist/i)).toBeDefined();
      expect(screen.getByText(/Mercenary/i)).toBeDefined();
    });

    it('allows changing name and selecting a class', () => {
      const onComplete = vi.fn();
      render(<CharacterCreator onComplete={onComplete} onBack={() => {}} />);

      const nameInput = screen.getByPlaceholderText(/Adventurer Name/i);
      fireEvent.change(nameInput, { target: { value: 'Vikram' } });

      const startButton = screen.getByText(/ENTER THE MANSION/i);
      fireEvent.click(startButton);

      expect(onComplete).toHaveBeenCalled();
      const characterData = onComplete.mock.calls[0][0];
      expect(characterData.name).toBe('Vikram');
      expect(characterData.stats).toBeDefined();
      expect(characterData.inventory.length).toBeGreaterThan(0);
    });
  });
});
