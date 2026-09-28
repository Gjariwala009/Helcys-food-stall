// Audio cues using HTML5 Web Audio API (zero external assets needed)
class SoundPlayer {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playSuccess() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Audio playback silently falls back if browser restricts autoplay
    }
  }

  playOrderPlaced() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Two-tone cheerful chime
      [
        { f: 523.25, time: 0 },       // C5
        { f: 659.25, time: 0.08 },    // E5
        { f: 783.99, time: 0.16 },    // G5
        { f: 1046.50, time: 0.24 },   // C6
      ].forEach(tone => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(tone.f, now + tone.time);

        gain.gain.setValueAtTime(0.12, now + tone.time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + tone.time + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + tone.time);
        osc.stop(now + tone.time + 0.25);
      });
    } catch {
      // Audio failure fallback
    }
  }

  playBell() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.6);
    } catch {
      // Audio failure fallback
    }
  }
}

export const soundEffects = new SoundPlayer();
