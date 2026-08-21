// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

// in-memory localStorage (Node 26 experimental localStorage is disabled in this runner)
const store = {};
globalThis.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); }
};

import App from '../ui/App.jsx';

// Minimal Web Audio polyfill for jsdom
function fakeNode() {
  return {
    connect: vi.fn(), disconnect: vi.fn(),
    start: vi.fn(), stop: vi.fn(),
    frequency: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    type: '', gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    currentTime: 0, destination: {}
  };
}
beforeEach(() => {
  cleanup();
  localStorage.clear();
  window.AudioContext = class {
    constructor() { this.currentTime = 0; this.state = 'running'; this.destination = {}; }
    resume() { return Promise.resolve(); }
    createOscillator() { return fakeNode(); }
    createGain() { return fakeNode(); }
  };
});

describe('Mansion Escape UI — a real first-time playthrough', () => {
  it('boots: menu -> creator -> foyer -> bronze key -> gate riddle', async () => {
    render(<App />);

    // 1. Title screen
    expect(screen.getByText(/THE DJINN OF MEWAR/i)).toBeDefined();
    fireEvent.click(screen.getByText(/START ADVENTURE/i));

    // 2. Character creator — enter a name and start (Antiquarian default)
    await waitFor(() => expect(screen.getByText(/CREATION TERMINAL/i)).toBeDefined());
    fireEvent.change(screen.getByPlaceholderText(/Adventurer Name/i), { target: { value: 'Ravi' } });
    fireEvent.click(screen.getByText(/ENTER THE MANSION/i));

    // 3. Playing: Foyer intro visible (jsdom: assert on textContent, not innerText)
    await waitFor(() => expect(document.body.textContent).toMatch(/FRONT FOYER/i));

    const input = () => screen.getByPlaceholderText(/Type command|Answer the gate/i);
    fireEvent.change(input(), { target: { value: 'open drawer' } });
    fireEvent.submit(input().closest('form'));
    await waitFor(() => expect(document.body.textContent).toMatch(/BRONZE KEY/i));

    // 5. Head north -> a spirit-gate riddle blocks us
    fireEvent.change(input(), { target: { value: 'go north' } });
    fireEvent.submit(input().closest('form'));
    await waitFor(() => expect(document.body.textContent).toMatch(/GATE SEALED/i));

    // 6. Answer the riddle (shadow) -> we reach the Chowk
    fireEvent.change(input(), { target: { value: 'shadow' } });
    fireEvent.submit(input().closest('form'));
    await waitFor(() => expect(document.body.textContent).toMatch(/CHOWK COURTYARD/i));
  });
});
