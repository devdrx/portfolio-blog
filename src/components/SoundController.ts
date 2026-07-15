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

  // ─── AIRLOCK SOUNDS ───────────────────────────────────────────────────────

  // Low mechanical rumble — doors beginning to move (filtered triangle + mid hum, 1.2s)
  public playMechanicalRumble() {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.volumeNode) return;
      const t = this.ctx.currentTime;

      // Sub-bass triangle rumble (warmer, deeper than raw sawtooth)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(45, t);
      osc1.frequency.linearRampToValueAtTime(72, t + 0.8);
      osc1.frequency.linearRampToValueAtTime(48, t + 1.2);
      
      gain1.gain.setValueAtTime(0.0, t);
      gain1.gain.linearRampToValueAtTime(0.28, t + 0.15);
      gain1.gain.linearRampToValueAtTime(0.22, t + 0.9);
      gain1.gain.linearRampToValueAtTime(0.0, t + 1.2);
      
      osc1.connect(gain1);
      gain1.connect(this.volumeNode);
      osc1.start(t);
      osc1.stop(t + 1.25);

      // Mid-range mechanical hum, lowpass filtered to eliminate buzzy frequency peaks
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260, t);

      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(140, t + 0.1);
      osc2.frequency.linearRampToValueAtTime(110, t + 1.0);
      
      gain2.gain.setValueAtTime(0.0, t + 0.1);
      gain2.gain.linearRampToValueAtTime(0.06, t + 0.3);
      gain2.gain.linearRampToValueAtTime(0.0, t + 1.1);

      osc2.connect(filter);
      filter.connect(gain2);
      gain2.connect(this.volumeNode);
      
      osc2.start(t + 0.1);
      osc2.stop(t + 1.15);
    } catch (e) {
      console.warn('Audio synthesis failed', e);
    }
  }

  // Hydraulic hiss — pneumatic pressure release (highpass noise burst with exponential decay)
  public playHydraulicHiss() {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.volumeNode) return;
      const t = this.ctx.currentTime;

      // Soft white noise burst
      const bufferSize = this.ctx.sampleRate * 0.7;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.22;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      // High-pass filter for smooth pneumatic hiss character
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1800, t);
      filter.frequency.exponentialRampToValueAtTime(3200, t + 0.4);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0, t);
      gain.gain.linearRampToValueAtTime(0.14, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.volumeNode);
      noise.start(t);
    } catch (e) {
      console.warn('Audio synthesis failed', e);
    }
  }

  // Heavy metallic impact — doors sealing shut (sub thud + filtered clank + soft latch strike)
  public playHeavyImpact() {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.volumeNode) return;
      const t = this.ctx.currentTime;

      // 1. Deep sub-bass thud (sine wave)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(80, t);
      osc1.frequency.exponentialRampToValueAtTime(30, t + 0.18);
      
      gain1.gain.setValueAtTime(0.48, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
      
      osc1.connect(gain1);
      gain1.connect(this.volumeNode);
      osc1.start(t);
      osc1.stop(t + 0.4);

      // 2. Warm mid-range metal thud (triangle wave)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(170, t);
      osc2.frequency.exponentialRampToValueAtTime(85, t + 0.15);
      
      gain2.gain.setValueAtTime(0.32, t);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      
      osc2.connect(gain2);
      gain2.connect(this.volumeNode);
      osc2.start(t);
      osc2.stop(t + 0.3);

      // 3. High-frequency latch strike click (very short filtered noise burst)
      const bufferSize = this.ctx.sampleRate * 0.05; // 50ms burst
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.15;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filterN = this.ctx.createBiquadFilter();
      filterN.type = 'highpass';
      filterN.frequency.setValueAtTime(2500, t);

      const gainN = this.ctx.createGain();
      gainN.gain.setValueAtTime(0.12, t);
      gainN.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      noise.connect(filterN);
      filterN.connect(gainN);
      gainN.connect(this.volumeNode);
      noise.start(t);
    } catch (e) {
      console.warn('Audio synthesis failed', e);
    }
  }

  // Locking bolt click — clean tactical relay click
  public playLockingClick() {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.volumeNode) return;
      const t = this.ctx.currentTime;

      // Clean triangle click (like a heavy relay switch)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(680, t);
      osc1.frequency.linearRampToValueAtTime(320, t + 0.03);
      
      gain1.gain.setValueAtTime(0.22, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      
      osc1.connect(gain1);
      gain1.connect(this.volumeNode);
      osc1.start(t);
      osc1.stop(t + 0.06);

      // Low mechanical thud response
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(150, t + 0.008);
      
      gain2.gain.setValueAtTime(0.28, t + 0.008);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      
      osc2.connect(gain2);
      gain2.connect(this.volumeNode);
      osc2.start(t + 0.008);
      osc2.stop(t + 0.09);
    } catch (e) {
      console.warn('Audio synthesis failed', e);
    }
  }

  // Door opening — pneumatic release + fading rumble as doors retract
  public playDoorOpen() {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.volumeNode) return;
      const t = this.ctx.currentTime;

      // Soft release hiss
      const bufferSize = this.ctx.sampleRate * 0.8;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.18;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1000, t);
      filter.frequency.linearRampToValueAtTime(500, t + 0.8);
      
      const gainN = this.ctx.createGain();
      gainN.gain.setValueAtTime(0.12, t);
      gainN.gain.exponentialRampToValueAtTime(0.001, t + 0.75);
      
      noise.connect(filter);
      filter.connect(gainN);
      gainN.connect(this.volumeNode);
      noise.start(t);

      // Low triangle rumble fading out
      const osc = this.ctx.createOscillator();
      const gainO = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(60, t);
      osc.frequency.linearRampToValueAtTime(35, t + 1.2);
      
      gainO.gain.setValueAtTime(0.24, t);
      gainO.gain.linearRampToValueAtTime(0.0, t + 1.4);
      
      osc.connect(gainO);
      gainO.connect(this.volumeNode);
      osc.start(t);
      osc.stop(t + 1.5);

      // Soft chime confirmation sequence (warm sine tones)
      const freqs = [784, 988]; // G5, B5 (warm major third interval)
      freqs.forEach((freq, i) => {
        const o = this.ctx!.createOscillator();
        const g = this.ctx!.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, t + 0.15 + i * 0.1);
        
        g.gain.setValueAtTime(0.06, t + 0.15 + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.35 + i * 0.1);
        
        o.connect(g);
        g.connect(this.volumeNode!);
        o.start(t + 0.15 + i * 0.1);
        o.stop(t + 0.4 + i * 0.1);
      });
    } catch (e) {
      console.warn('Audio synthesis failed', e);
    }
  }
}

export const Sound = new SoundSynthesizer();
