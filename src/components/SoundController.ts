// YoRHa OS Sound Synthesizer using Web Audio API

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private volumeNode: GainNode | null = null;
  private volume: number = 0.3; // Default volume
  private muted: boolean = false;

  constructor() {
    // Load setting from localStorage if available
    const savedMuted = localStorage.getItem('yorha_sound_muted');
    if (savedMuted !== null) {
      this.muted = savedMuted === 'true';
    }
    const savedVol = localStorage.getItem('yorha_sound_volume');
    if (savedVol !== null) {
      this.volume = parseFloat(savedVol);
    }
  }

  private initCtx() {
    if (!this.ctx) {
      // Create context on demand to comply with browser autoplay policies
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.volumeNode = this.ctx.createGain();
      this.volumeNode.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
      this.volumeNode.connect(this.ctx.destination);
    }
    // Resume context if suspended
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    localStorage.setItem('yorha_sound_muted', String(this.muted));
    if (this.volumeNode && this.ctx) {
      this.volumeNode.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
    }
    return this.muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    localStorage.setItem('yorha_sound_volume', String(this.volume));
    if (this.volumeNode && this.ctx && !this.muted) {
      this.volumeNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  // Play a simple crisp beep (Menu Hover)
  public playHover() {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.volumeNode) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime); // High pitched crisp beep

      gain.gain.setValueAtTime(0.05, this.ctx.currentTime); // Soft volume
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.volumeNode);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {
      console.warn('Audio synthesis failed', e);
    }
  }

  // Play a double click beep (Menu Selection)
  public playClick() {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.volumeNode) return;

      const t = this.ctx.currentTime;
      
      // Note 1
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(800, t);
      gain1.gain.setValueAtTime(0.1, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc1.connect(gain1);
      gain1.connect(this.volumeNode);
      osc1.start(t);
      osc1.stop(t + 0.09);

      // Note 2 (slightly offset)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1000, t + 0.05);
      gain2.gain.setValueAtTime(0.1, t + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc2.connect(gain2);
      gain2.connect(this.volumeNode);
      osc2.start(t + 0.05);
      osc2.stop(t + 0.16);
    } catch (e) {
      console.warn('Audio synthesis failed', e);
    }
  }

  // Warning/Glitch buzz
  public playWarning() {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.volumeNode) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, this.ctx.currentTime); // Low buzz
      osc.frequency.linearRampToValueAtTime(80, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.volumeNode);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.26);
    } catch (e) {
      console.warn('Audio synthesis failed', e);
    }
  }

  // Chime for success / level up / chip equip
  public playChime() {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.volumeNode) return;

      const t = this.ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C major arpeggio
      
      freqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.06);
        
        gain.gain.setValueAtTime(0.08, t + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.3);
        
        osc.connect(gain);
        gain.connect(this.volumeNode!);
        
        osc.start(t + idx * 0.06);
        osc.stop(t + idx * 0.06 + 0.35);
      });
    } catch (e) {
      console.warn('Audio synthesis failed', e);
    }
  }
}

export const Sound = new SoundSynthesizer();
