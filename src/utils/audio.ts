// Smooth, Velvet & Luxurious Acoustic Web Audio Synthesizer for Istiqomah Grosir Stock
import confetti from 'canvas-confetti';

class SoundEffects {
  private ctx: AudioContext | null = null;
  private soundActive: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('istiqomah_sound_enabled');
      this.soundActive = stored !== 'false';
    }
  }

  isSoundEnabled(): boolean {
    return this.soundActive;
  }

  setSoundEnabled(enabled: boolean) {
    this.soundActive = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('istiqomah_sound_enabled', enabled ? 'true' : 'false');
      window.dispatchEvent(new CustomEvent('istiqomah_sound_toggled', { detail: { enabled } }));
    }
  }

  toggleSound(): boolean {
    const next = !this.soundActive;
    this.setSoundEnabled(next);
    if (next) this.playClickSound();
    return next;
  }

  triggerConfetti() {
    try {
      confetti({
        particleCount: 35,
        spread: 55,
        origin: { y: 0.65 },
        colors: ['#09090b', '#27272a', '#71717a', '#10b981', '#f59e0b'],
      });
    } catch {
      // fallback
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
  }

  private ensureRunning() {
    if (!this.soundActive) return;
    this.initCtx();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // 1. Ultra-smooth velvet blip for barcode scanner (Warm Sine Marimba)
  playScanBeep() {
    if (!this.soundActive) return;
    try {
      this.ensureRunning();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, now);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.05); // E6

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.07, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.11);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(15);
      }
    } catch {
      // audio fallback
    }
  }

  // 2. Soft velvet micro-tap for UI buttons
  playClickSound() {
    if (!this.soundActive) return;
    try {
      this.ensureRunning();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, now);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.03);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.035, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.035);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(8);
      }
    } catch {
      // fallback
    }
  }

  // 3. Smooth warm ascending chord when stock is added (+)
  playStockAdd() {
    if (!this.soundActive) return;
    try {
      this.ensureRunning();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const filter = this.ctx!.createBiquadFilter();
        const start = now + idx * 0.035;

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1600, start);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.05, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(start);
        osc.stop(start + 0.18);
      });

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(12);
      }
    } catch {
      // fallback
    }
  }

  // 4. Smooth warm descending tone when stock is reduced (-)
  playStockSubtract() {
    if (!this.soundActive) return;
    try {
      this.ensureRunning();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [783.99, 587.33]; // G5 -> D5
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const filter = this.ctx!.createBiquadFilter();
        const start = now + idx * 0.04;

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, start);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.045, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.15);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(start);
        osc.stop(start + 0.15);
      });

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(12);
      }
    } catch {
      // fallback
    }
  }

  // 5. Harmonious smooth velvet chord when a new item is created + Confetti celebration
  playItemCreated() {
    this.triggerConfetti();
    if (!this.soundActive) return;
    try {
      this.ensureRunning();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const chord = [440, 554.37, 659.25, 880]; // A Major Chord
      chord.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const filter = this.ctx!.createBiquadFilter();
        const start = now + idx * 0.03;

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1800, start);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.04, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(start);
        osc.stop(start + 0.22);
      });

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([12, 12]);
      }
    } catch {
      // fallback
    }
  }

  // 6. Velvet crystal chime for database backup + Confetti
  playBackupSent() {
    this.triggerConfetti();
    if (!this.soundActive) return;
    try {
      this.ensureRunning();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [659.25, 880, 1174.66]; // E5, A5, D6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const filter = this.ctx!.createBiquadFilter();
        const start = now + idx * 0.045;

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, start);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.05, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.24);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(start);
        osc.stop(start + 0.24);
      });

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([10, 10]);
      }
    } catch {
      // fallback
    }
  }

  // 7. Subtle wood latch click when locking/logging out
  playLockSound() {
    if (!this.soundActive) return;
    try {
      this.ensureRunning();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(700, now);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.04);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.05, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }
    } catch {
      // fallback
    }
  }

  // 8. Soft two-note pleasant chime when unlocking/logging in
  playUnlockSound() {
    if (!this.soundActive) return;
    try {
      this.ensureRunning();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [587.33, 880]; // D5 -> A5
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const filter = this.ctx!.createBiquadFilter();
        const start = now + idx * 0.045;

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1800, start);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.05, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(start);
        osc.stop(start + 0.16);
      });

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(12);
      }
    } catch {
      // fallback
    }
  }
}

export const soundEffects = new SoundEffects();
