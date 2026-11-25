class SoundEngine {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, duration = 0.35, type = 'sine', delay = 0, vol = 0.2) {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(vol, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.04);
    } catch {
      // Blocked before interaction
    }
  }

  playTransitionChime() {
    this.playTone(528, 0.4, 'sine', 0, 0.22);
    this.playTone(660, 0.5, 'sine', 0.16, 0.22);
  }

  playHydrationPing() {
    this.playTone(587.33, 0.25, 'sine', 0, 0.18);
    this.playTone(880, 0.35, 'sine', 0.15, 0.18);
  }

  playSocialLimitAlert() {
    this.playTone(440, 0.25, 'triangle', 0, 0.25);
    this.playTone(392, 0.25, 'triangle', 0.28, 0.25);
    this.playTone(349.23, 0.45, 'triangle', 0.56, 0.25);
  }
}

export const soundEngine = new SoundEngine();
