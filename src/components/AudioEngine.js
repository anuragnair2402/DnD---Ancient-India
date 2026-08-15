// Web Audio API Retro 8-bit Audio Engine for Mansion Escape

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.ambientOsc = null;
    this.ambientGain = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      // Standard audio context initialization
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopAmbientHum();
    } else {
      this.startAmbientHum();
    }
    return this.muted;
  }

  // 1980s Retro click bleep
  playBleep(freq = 880, duration = 0.05) {
    if (this.muted) return;
    this.init();
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square'; // Traditional 8-bit chip sound
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio failure:", e);
    }
  }

  // Rising arpeggio for items
  playItemAcquired() {
    if (this.muted) return;
    this.init();
    try {
      const notes = [440, 554, 659, 880];
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.08, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.12);
      });
    } catch (e) {
      console.warn("Audio failure:", e);
    }
  }

  // Harsh descending noise for sanity damage
  playSanityDamage() {
    if (this.muted) return;
    this.init();
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(55, this.ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.32);
    } catch (e) {
      console.warn("Audio failure:", e);
    }
  }

  // Ghostly whistle / wind creak
  playGhostSpotted() {
    if (this.muted) return;
    this.init();
    try {
      const osc = this.ctx.createOscillator();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(150, this.ctx.currentTime + 0.8);

      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(8, this.ctx.currentTime); // Tremolo speed

      lfoGain.gain.setValueAtTime(50, this.ctx.currentTime); // Vibrato width

      gain.gain.setValueAtTime(0.0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency); // Modulate main osc frequency

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      lfo.start();
      osc.start();

      lfo.stop(this.ctx.currentTime + 0.8);
      osc.stop(this.ctx.currentTime + 0.8);
    } catch (e) {
      console.warn("Audio failure:", e);
    }
  }

  // Deep structural creak
  playCreak() {
    if (this.muted) return;
    this.init();
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(60, this.ctx.currentTime);
      // Slow frequency modulation to simulate creaking floorboard
      for (let t = 0; t < 0.6; t += 0.05) {
        osc.frequency.setValueAtTime(60 + Math.random() * 30, this.ctx.currentTime + t);
      }

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.6);
    } catch (e) {
      console.warn("Audio failure:", e);
    }
  }

  // Heavy bell toll for game over/death
  playBellToll() {
    if (this.muted) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const frequencies = [110, 147, 220, 294]; // Ring-modulation simulation frequencies

      frequencies.forEach(f => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 2.0);
      });
    } catch (e) {
      console.warn("Audio failure:", e);
    }
  }

  // Continuous background drone/hum for atmospheric horror
  startAmbientHum() {
    if (this.muted) return;
    this.init();
    try {
      if (this.ambientOsc) return; // Already running

      this.ambientOsc = this.ctx.createOscillator();
      this.ambientGain = this.ctx.createGain();

      this.ambientOsc.type = 'sine';
      this.ambientOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // Low G note

      // Gentle LFO filter to make the hum rumble/waver
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.2, this.ctx.currentTime); // 0.2 Hz slow pulse
      lfoGain.gain.setValueAtTime(4, this.ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(this.ambientOsc.frequency);

      this.ambientGain.gain.setValueAtTime(0.02, this.ctx.currentTime); // Quiet hum

      this.ambientOsc.connect(this.ambientGain);
      this.ambientGain.connect(this.ctx.destination);

      lfo.start();
      this.ambientOsc.start();
    } catch (e) {
      console.warn("Audio failure:", e);
    }
  }

  stopAmbientHum() {
    try {
      if (this.ambientOsc) {
        this.ambientOsc.stop();
        this.ambientOsc.disconnect();
        this.ambientOsc = null;
      }
      if (this.ambientGain) {
        this.ambientGain.disconnect();
        this.ambientGain = null;
      }
    } catch (e) {
      console.warn("Audio failure:", e);
    }
  }
}

export const audio = new AudioEngine();
