import React, { useEffect, useRef, useState } from 'react';
import { Sound } from '../components/SoundController';
import { Play, Pause, SkipForward, Music, Star, Film, Eye } from 'lucide-react';

interface Track {
  title: string;
  composer: string;
  chords: string[][];
  tempo: number;
}

const PLAYLIST: Track[] = [
  {
    title: 'City Ruins (Rays of Light) [Lo-Fi Synth]',
    composer: 'YoRHa Synth Engine',
    chords: [
      ['C3', 'E4', 'G4', 'B4'],
      ['A3', 'C4', 'E4', 'G4'],
      ['F3', 'A3', 'C4', 'E4'],
      ['G3', 'B3', 'D4', 'G4']
    ],
    tempo: 220
  },
  {
    title: 'Weight of the World [Synth Chime]',
    composer: 'YoRHa Synth Engine',
    chords: [
      ['F3', 'A3', 'C4', 'F4'],
      ['G3', 'B3', 'D4', 'G4'],
      ['E3', 'G#3', 'B3', 'E4'],
      ['A3', 'C4', 'E4', 'A4']
    ],
    tempo: 180
  },
  {
    title: 'Amusement Park [8-Bit Refrain]',
    composer: 'YoRHa Synth Engine',
    chords: [
      ['A3', 'C4', 'E4', 'A4'],
      ['D3', 'F3', 'A3', 'D4'],
      ['G3', 'B3', 'D4', 'G4'],
      ['C3', 'E3', 'G3', 'C4']
    ],
    tempo: 200
  }
];

const NOTE_FREQS: { [key: string]: number } = {
  'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94, 'G#3': 207.65,
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88, 'C5': 523.25
};

export const ArtWeeb: React.FC = () => {
  // Sound Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const [, setPlayNoteIdx] = useState(0);
  const synthTimerRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Audio nodes cache for the active track
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Anime Logs Data
  const animeLogs = [
    { title: 'Serial Experiments Lain', type: 'Anime', rating: 10, note: 'Peak cyber-punk philosophy and terminal diagnostics.' },
    { title: 'Neon Genesis Evangelion', type: 'Anime', rating: 10, note: 'Deep psychological machinery and existential core.' },
    { title: 'NieR: Automata Ver1.1a', type: 'Anime', rating: 9, note: 'Gorgeous anime adaptation of the YoRHa narrative.' },
    { title: 'Steins;Gate', type: 'Anime', rating: 9.5, note: 'Time travel, loop theories, and worldline matrices.' }
  ];

  const track = PLAYLIST[currentTrackIdx];

  // Initialize synth audio context
  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      gainNodeRef.current = audioCtxRef.current.createGain();
      gainNodeRef.current.gain.setValueAtTime(0.05, audioCtxRef.current.currentTime); // Soft background music volume
      gainNodeRef.current.connect(audioCtxRef.current.destination);
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const nextNoteTimeRef = useRef<number>(0);
  const playNoteIdxRef = useRef<number>(0);

  // Synth Arpeggiation Loop
  useEffect(() => {
    if (!isPlaying) {
      if (synthTimerRef.current) clearInterval(synthTimerRef.current);
      return;
    }

    initAudio();
    if (!audioCtxRef.current) return;
    
    // Initialize timing parameters
    nextNoteTimeRef.current = audioCtxRef.current.currentTime;
    playNoteIdxRef.current = 0;

    const lookahead = 0.150; // Schedule 150ms in advance
    const scheduleInterval = 40; // Check scheduler every 40ms

    synthTimerRef.current = window.setInterval(() => {
      if (!audioCtxRef.current || !gainNodeRef.current || Sound.isMuted()) return;

      while (nextNoteTimeRef.current < audioCtxRef.current.currentTime + lookahead) {
        const time = nextNoteTimeRef.current;
        const noteIdx = playNoteIdxRef.current;

        const chordIdx = Math.floor(noteIdx / 4) % track.chords.length;
        const chord = track.chords[chordIdx];
        const noteName = chord[noteIdx % chord.length];
        const freq = NOTE_FREQS[noteName] || 440;

        // Play soft digital synth bell at precise scheduled time
        const osc = audioCtxRef.current.createOscillator();
        const noteGain = audioCtxRef.current.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        noteGain.gain.setValueAtTime(0.08, time);
        noteGain.gain.exponentialRampToValueAtTime(0.001, time + 0.6); // Slow release

        osc.connect(noteGain);
        noteGain.connect(gainNodeRef.current);
        
        osc.start(time);
        osc.stop(time + 0.65);

        // Update loop parameters
        playNoteIdxRef.current += 1;
        nextNoteTimeRef.current += track.tempo / 1000;
        
        // Match visual indicator
        setPlayNoteIdx(playNoteIdxRef.current);
      }
    }, scheduleInterval);

    return () => {
      if (synthTimerRef.current) clearInterval(synthTimerRef.current);
    };
  }, [isPlaying, currentTrackIdx]);

  // Audio Waveform Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let waveOffset = 0;

    const draw = () => {
      const isDark = document.documentElement.classList.contains('theme-dark');
      const colorBg = isDark ? '#24221d' : '#c5c1b0';
      const colorWave = isDark ? '#d1cdbc' : '#4e4b42';

      ctx.fillStyle = colorBg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.beginPath();
      ctx.strokeStyle = colorWave;
      ctx.lineWidth = 2;

      // Draw standard fluctuating wave when playing, simple idle noise when paused
      const amplitude = isPlaying ? 18 : 3;
      const frequency = isPlaying ? 0.08 : 0.03;

      for (let x = 0; x < canvas.width; x++) {
        const y = canvas.height / 2 + 
          Math.sin(x * frequency + waveOffset) * amplitude * Math.sin(x * 0.008);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      waveOffset += isPlaying ? 0.15 : 0.02;
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  const handlePlayPause = () => {
    Sound.playClick();
    setIsPlaying(!isPlaying);
  };

  const handleNextTrack = () => {
    Sound.playClick();
    setIsPlaying(false);
    setTimeout(() => {
      setCurrentTrackIdx((prev) => (prev + 1) % PLAYLIST.length);
      setPlayNoteIdx(0);
      setIsPlaying(true);
    }, 100);
  };

  return (
    <div className="content-section" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header */}
      <div className="title-decorator">
        <span className="tag">ART</span>
        <h2>[04_ART] // VISUAL_AND_AUDIO_ARCHIVES</h2>
        <div className="line" />
        <span className="tag">WEEB CORE</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.3fr', gap: '30px' }}>
        
        {/* Left Side: Art Gallery & Anime Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Gallery Grid */}
          <div className="nier-panel">
            <h3 style={{ fontSize: '15px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Eye size={16} /> GENERATED CONCEPT_GALLERY
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              
              {/* Artwork Card 1 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ 
                  border: '1px solid var(--nier-border)', 
                  aspectRatio: '1', 
                  overflow: 'hidden', 
                  position: 'relative',
                  backgroundColor: 'rgba(0,0,0,0.05)'
                }} className="glitch-hover">
                  <img 
                    src="/artwork1.png" 
                    alt="YoRHa Anime Character Concept" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', bottom: '0', left: '0', width: '100%', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '10px', fontFamily: 'var(--font-mono)', padding: '2px 6px' }}>
                    UNIT_PORTRAIT_B
                  </div>
                </div>
              </div>

              {/* Artwork Card 2 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ 
                  border: '1px solid var(--nier-border)', 
                  aspectRatio: '1', 
                  overflow: 'hidden', 
                  position: 'relative',
                  backgroundColor: 'rgba(0,0,0,0.05)'
                }} className="glitch-hover">
                  <img 
                    src="/artwork2.png" 
                    alt="Mecha Sci-Fi City Skyline" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', bottom: '0', left: '0', width: '100%', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '10px', fontFamily: 'var(--font-mono)', padding: '2px 6px' }}>
                    MECHA_CITY_C
                  </div>
                </div>
              </div>

              {/* Artwork Card 3 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ 
                  border: '1px solid var(--nier-border)', 
                  aspectRatio: '1', 
                  overflow: 'hidden', 
                  position: 'relative',
                  backgroundColor: 'rgba(0,0,0,0.05)'
                }} className="glitch-hover">
                  <img 
                    src="/artwork3.png" 
                    alt="Technical Blueprints Sketch" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', bottom: '0', left: '0', width: '100%', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '10px', fontFamily: 'var(--font-mono)', padding: '2px 6px' }}>
                    BLUEPRINT_D
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Anime ratings logs */}
          <div className="nier-panel">
            <h3 style={{ fontSize: '15px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Film size={16} /> OTAKU_DATA_RECORDS
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {animeLogs.map((log, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'start', 
                    borderBottom: '1px dashed var(--nier-border-muted)', 
                    paddingBottom: '10px' 
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                      {log.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--nier-text-muted)', fontStyle: 'italic' }}>
                      {log.note}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                    <Star size={14} style={{ fill: 'var(--nier-accent)', color: 'var(--nier-accent)' }} />
                    <span>{log.rating}/10</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side: Sound Synth Player */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="nier-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Music size={16} /> YO-RHA JUKEBOX
            </h3>

            <div style={{ backgroundColor: 'var(--nier-bg-alt)', border: '1px solid var(--nier-border)', padding: '15px', textAlign: 'center' }}>
              <div 
                style={{ 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '14px', 
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginBottom: '4px'
                }}
              >
                {isPlaying ? '▶' : '❙❙'} {track.title}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--nier-text-muted)' }}>
                COMPOSER: {track.composer}
              </div>
            </div>

            {/* Audio Waveform Canvas */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <canvas
                ref={canvasRef}
                width={300}
                height={80}
                style={{
                  border: '1px solid var(--nier-border)',
                  width: '100%',
                  borderRadius: '2px'
                }}
              />
            </div>

            {/* Play controls */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button 
                className="nier-btn" 
                onClick={handlePlayPause}
                style={{ width: '120px' }}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />} 
                {isPlaying ? ' [PAUSE]' : ' [PLAY]'}
              </button>

              <button 
                className="nier-btn" 
                onClick={handleNextTrack}
              >
                <SkipForward size={14} /> [NEXT]
              </button>
            </div>

            {/* Playlist log details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--nier-border-muted)', paddingTop: '12px' }}>
              {PLAYLIST.map((p, idx) => {
                const active = currentTrackIdx === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      Sound.playClick();
                      setCurrentTrackIdx(idx);
                      setPlayNoteIdx(0);
                      setIsPlaying(true);
                    }}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      padding: '6px 8px',
                      backgroundColor: active ? 'var(--nier-text)' : 'transparent',
                      color: active ? 'var(--nier-bg)' : 'var(--nier-text)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>{idx + 1}. {p.title}</span>
                    <span style={{ fontSize: '10px' }}>{p.tempo}ms</span>
                  </div>
                );
              })}
            </div>
            
            <div style={{ fontSize: '11px', color: 'var(--nier-text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
              *Audio tracks are synthesized procedurally in real-time by WebAudio synth nodes.
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
