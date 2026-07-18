import React, { useEffect, useRef, useState } from 'react';
import { otakuService } from '../services/otaku';
import type { OtakuRecord } from '../services/otaku';
import { Sound } from '../components/SoundController';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Repeat, 
  Repeat1, 
  Volume2, 
  VolumeX, 
  Music, 
  Film, 
  Eye, 
  Heart, 
  ExternalLink 
} from 'lucide-react';

interface Song {
  title: string;
  url: string;
}

export const ArtWeeb: React.FC = () => {
  // Sound Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSongIdx, setCurrentSongIdx] = useState(0);
  
  // Custom Music Player States
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [repeatMode, setRepeatMode] = useState<'none' | 'all' | 'one'>('all');
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Refs to prevent stale closures in async audio event listeners
  const currentSongIdxRef = useRef(currentSongIdx);
  const repeatModeRef = useRef(repeatMode);
  const songsRef = useRef(songs);
  const volumeRef = useRef(volume);
  const isMutedRef = useRef(isMuted);

  useEffect(() => { currentSongIdxRef.current = currentSongIdx; }, [currentSongIdx]);
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);
  useEffect(() => { songsRef.current = songs; }, [songs]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  // Sync volume state to active HTML5 Audio node
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Sync loop setting when repeatMode is dynamically changed by owner
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = repeatMode === 'one';
    }
  }, [repeatMode]);

  const fetchSongs = () => {
    fetch('/api/songs')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSongs(data);
        }
      })
      .catch(err => console.error('Failed fetching songs:', err));
  };

  // SoundCloud liked tracks
  interface ScTrack {
    id: number;
    title: string;
    artist: string;
    artwork: string | null;
    url: string;
    plays: number;
    likes: number;
    duration: number;
  }
  const [scTracks, setScTracks] = useState<ScTrack[]>([]);
  const [scStatus, setScStatus] = useState<'idle' | 'loading' | 'ok' | 'error' | 'no-key'>('idle');
  const [scError, setScError] = useState('');
  const [selectedAnimeIdx, setSelectedAnimeIdx] = useState(0);
  const [wallpapers, setWallpapers] = useState<{ original: string; thumbnail: string }[]>([]);
  const [currentWallpaperIdx, setCurrentWallpaperIdx] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [animeLogs, setAnimeLogs] = useState<OtakuRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);

  const fetchOtakuRecords = () => {
    setRecordsLoading(true);
    otakuService.getRecords()
      .then((data) => {
        setAnimeLogs(data);
        setRecordsLoading(false);
      })
      .catch((err) => {
        console.error('Failed fetching otaku records:', err);
        setRecordsLoading(false);
      });
  };

  const fetchWallpapers = () => {
    fetch('/api/wallpapers')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setWallpapers(data);
        }
      })
      .catch((e) => console.error('Failed fetching wallpapers:', e));
  };

  useEffect(() => {
    fetchWallpapers();
    fetchSongs();
    fetchOtakuRecords();
  }, []);

  // Poll wallpapers if any thumbnail is still generating (null)
  useEffect(() => {
    if (wallpapers.length === 0) return;
    const hasGenerating = wallpapers.some((w) => !w.thumbnail);
    if (hasGenerating) {
      const timer = setTimeout(() => {
        fetchWallpapers();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [wallpapers]);

  // Safeguard index in case wallpapers are added/removed dynamically
  useEffect(() => {
    if (wallpapers.length > 0 && currentWallpaperIdx >= wallpapers.length) {
      setCurrentWallpaperIdx(0);
    }
  }, [wallpapers, currentWallpaperIdx]);

  // Safeguard index in case songs are added/removed dynamically
  useEffect(() => {
    if (songs.length > 0 && currentSongIdx >= songs.length) {
      setCurrentSongIdx(0);
    }
  }, [songs, currentSongIdx]);

  useEffect(() => {
    setScStatus('loading');
    fetch('/api/soundcloud/likes')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          if (data.error.includes('SOUNDCLOUD_CLIENT_ID')) {
            setScStatus('no-key');
          } else {
            setScStatus('error');
            setScError(data.error);
          }
        } else {
          setScTracks(data.tracks || []);
          setScStatus('ok');
        }
      })
      .catch((e) => {
        setScStatus('error');
        setScError(e.message || 'API connection failed');
      });
  }, []);



  // Anime Logs Data
  const SC_RANK_COLORS = [
    'hsl(210, 30%, 50%)',
    'hsl(160, 28%, 44%)',
    'hsl(38, 35%, 48%)',
    'hsl(275, 28%, 48%)',
    'hsl(340, 30%, 46%)',
    'hsl(190, 32%, 42%)',
  ];

  const handleSongEnded = () => {
    const mode = repeatModeRef.current;
    const idx = currentSongIdxRef.current;
    const list = songsRef.current;
    if (list.length === 0) return;

    if (mode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(err => console.warn(err));
      }
    } else if (mode === 'all') {
      const nextIdx = (idx + 1) % list.length;
      setCurrentSongIdx(nextIdx);
      playTrack(nextIdx, true);
    } else {
      // mode === 'none'
      if (idx < list.length - 1) {
        const nextIdx = idx + 1;
        setCurrentSongIdx(nextIdx);
        playTrack(nextIdx, true);
      } else {
        setIsPlaying(false);
      }
    }
  };

  const playTrack = (idx: number, autoPlay = true) => {
    if (songsRef.current.length === 0) return;
    const track = songsRef.current[idx];

    // Clean up active audio if exists
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }

    const audio = new Audio(track.url);
    audio.crossOrigin = 'anonymous';
    audio.loop = repeatModeRef.current === 'one';
    audio.volume = isMutedRef.current ? 0 : volumeRef.current;
    audioRef.current = audio;

    // Attach play event listeners
    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };
    audio.ondurationchange = () => {
      setDuration(audio.duration || 0);
    };
    audio.onloadedmetadata = () => {
      setDuration(audio.duration || 0);
    };
    audio.onended = () => {
      handleSongEnded();
    };

    // Connect to Web Audio Analyser
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    // Disconnect old source/analyser nodes before creating new ones, otherwise
    // each track change leaks a MediaElementSourceNode tied to the previous
    // (now-discarded) audio element.
    if (sourceRef.current) {
      sourceRef.current.disconnect();
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
    }
    analyserRef.current = audioCtxRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;

    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    try {
      const source = audioCtxRef.current.createMediaElementSource(audio);
      source.connect(analyserRef.current);
      analyserRef.current.connect(audioCtxRef.current.destination);
      sourceRef.current = source;
    } catch (e) {
      console.warn('Media element source setup failed, continuing:', e);
    }

    if (autoPlay) {
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.warn('Audio autoplay blocked, waiting for user gesture:', err));
    }
  };

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

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

      // Read real time-domain data if analyser node is available and playing
      let dataArray = new Uint8Array(0);
      if (analyserRef.current && isPlaying) {
        analyserRef.current.fftSize = 256;
        const bufferLength = analyserRef.current.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteTimeDomainData(dataArray);
      }

      if (analyserRef.current && isPlaying && dataArray.length > 0) {
        const sliceWidth = canvas.width / dataArray.length;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
          const v = dataArray[i] / 128.0; // scale between 0 and 2
          const y = (v * canvas.height) / 2;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);

          x += sliceWidth;
        }
      } else {
        // Draw standard idle wave when paused
        const amplitude = 3;
        const frequency = 0.03;

        for (let x = 0; x < canvas.width; x++) {
          const y = canvas.height / 2 + 
            Math.sin(x * frequency + waveOffset) * amplitude * Math.sin(x * 0.008);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        waveOffset += 0.02;
      }
      ctx.stroke();

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  const handlePlayPause = () => {
    Sound.playClick();
    if (songs.length === 0) return;

    if (!audioRef.current) {
      playTrack(currentSongIdx, true);
    } else {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(err => console.error(err));
      }
    }
  };

  const handleNextTrack = () => {
    Sound.playClick();
    fetchSongs();
    if (songs.length === 0) return;
    const nextIdx = (currentSongIdx + 1) % songs.length;
    setCurrentSongIdx(nextIdx);
    playTrack(nextIdx, true);
  };

  const handlePrevTrack = () => {
    Sound.playClick();
    fetchSongs();
    if (songs.length === 0) return;
    const prevIdx = (currentSongIdx - 1 + songs.length) % songs.length;
    setCurrentSongIdx(prevIdx);
    playTrack(prevIdx, true);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderStarBlocks = (rating: number) => {
    const filled = Math.round(rating);
    const empty = 10 - filled;
    return '\u2588'.repeat(filled) + '\u2591'.repeat(empty);
  };

  const handleAnimeSelect = (idx: number) => {
    if (idx === selectedAnimeIdx) return;
    Sound.playClick();
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedAnimeIdx(idx);
      setIsTransitioning(false);
    }, 280);
  };

  return (
    <div className="content-section" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header */}
      <div className="title-decorator">
        <span className="tag">ART</span>
        <h2>[02_ART] // VISUAL_AND_AUDIO_ARCHIVES</h2>
        <div className="line" />
        <span className="tag">WEEB CORE</span>
      </div>

      <div className="art-grid-main">
        
        {/* Left Side: Art Gallery & Anime Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Concept Gallery Carousel */}
          <div className="nier-panel" style={{ position: 'relative' }}>
            <h3 style={{ fontSize: '15px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Eye size={16} /> WALLPAPER_CONCEPT_GALLERY // DYNAMIC_RECORDS
            </h3>

            {wallpapers.length === 0 ? (
              <div style={{ 
                fontFamily: 'var(--font-mono)', 
                fontSize: '12px', 
                color: 'var(--nier-text-muted)', 
                padding: '40px 0', 
                textAlign: 'center',
                backgroundColor: 'var(--nier-bg-alt)',
                border: '1px dashed var(--nier-border-muted)' 
              }}>
                &gt; NO WALLPAPERS DETECTED IN ARCHIVE DIRECTORY.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', position: 'relative' }}>
                {/* Carousel Container */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  gap: '10px',
                  position: 'relative',
                  height: '240px',
                  backgroundColor: 'var(--nier-bg-alt)',
                  border: '1px solid var(--nier-border-muted)',
                  padding: '15px 10px',
                  overflow: 'hidden'
                }}>
                  {/* Left Navigation Arrow */}
                  <button
                    onClick={() => {
                      Sound.playClick();
                      fetchWallpapers();
                      setCurrentWallpaperIdx(prev => (prev - 1 + wallpapers.length) % wallpapers.length);
                    }}
                    onMouseEnter={() => Sound.playHover()}
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid var(--nier-border)',
                      color: 'var(--nier-text)',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 10,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      userSelect: 'none'
                    }}
                    className="glitch-hover"
                  >
                    &lt;
                  </button>

                  {/* Carousel Cards Flex */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    flex: 1, 
                    minWidth: 0,
                    height: '100%', 
                    position: 'relative',
                    gap: '15px'
                  }}>
                    {/* Left Flanking Image */}
                    <div 
                      onClick={() => {
                        Sound.playClick();
                        fetchWallpapers();
                        setCurrentWallpaperIdx(prev => (prev - 1 + wallpapers.length) % wallpapers.length);
                      }}
                      onMouseEnter={() => Sound.playHover()}
                      className="carousel-flank"
                      style={{
                        width: '18%',
                        height: '75%',
                        opacity: 0.35,
                        cursor: 'pointer',
                        overflow: 'hidden',
                        border: '1px solid var(--nier-border-muted)',
                        transition: 'all 0.3s ease',
                        transform: 'scale(0.9)',
                        filter: 'sepia(0.3) blur(1px)'
                      }}
                    >
                      {!wallpapers[(currentWallpaperIdx - 1 + wallpapers.length) % wallpapers.length]?.thumbnail ? (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', color: 'var(--nier-text-muted)', fontSize: '8px', fontFamily: 'var(--font-mono)' }}>
                          [ GENERATING THUMB... ]
                        </div>
                      ) : (
                        <img 
                          src={wallpapers[(currentWallpaperIdx - 1 + wallpapers.length) % wallpapers.length]?.thumbnail} 
                          alt="Previous preview" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          loading="lazy"
                        />
                      )}
                    </div>

                    {/* Active Centered Image */}
                    <div 
                      onClick={() => {
                        Sound.playClick();
                        setIsZoomOpen(true);
                      }}
                      onMouseEnter={() => Sound.playHover()}
                      className="carousel-active-card glitch-hover"
                      style={{
                        width: '56%',
                        height: '100%',
                        opacity: 1,
                        cursor: 'zoom-in',
                        overflow: 'hidden',
                        border: '2px solid var(--nier-border)',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                        position: 'relative',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {!wallpapers[currentWallpaperIdx]?.thumbnail ? (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', color: 'var(--nier-text-muted)', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                          [ GENERATING THUMBNAIL... ]
                        </div>
                      ) : (
                        <img 
                          src={wallpapers[currentWallpaperIdx]?.thumbnail} 
                          alt="Active wallpaper view" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(0.12)' }}
                        />
                      )}
                      {/* Technical visual coordinates inside image frame */}
                      <div style={{
                        position: 'absolute',
                        bottom: '5px',
                        left: '5px',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: '#d1cdbc',
                        fontSize: '9px',
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 6px',
                        letterSpacing: '0.05em'
                      }}>
                        RESOL_HD // INDEX_0{currentWallpaperIdx + 1}
                      </div>

                      {/* Interactive Zoom Hint */}
                      <div style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: '#d1cdbc',
                        fontSize: '9px',
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 6px',
                        letterSpacing: '0.05em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        [ CLICK TO EXPAND ]
                      </div>
                    </div>

                    {/* Right Flanking Image */}
                    <div 
                      onClick={() => {
                        Sound.playClick();
                        fetchWallpapers();
                        setCurrentWallpaperIdx(prev => (prev + 1) % wallpapers.length);
                      }}
                      onMouseEnter={() => Sound.playHover()}
                      className="carousel-flank"
                      style={{
                        width: '18%',
                        height: '75%',
                        opacity: 0.35,
                        cursor: 'pointer',
                        overflow: 'hidden',
                        border: '1px solid var(--nier-border-muted)',
                        transition: 'all 0.3s ease',
                        transform: 'scale(0.9)',
                        filter: 'sepia(0.3) blur(1px)'
                      }}
                    >
                      {!wallpapers[(currentWallpaperIdx + 1) % wallpapers.length]?.thumbnail ? (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', color: 'var(--nier-text-muted)', fontSize: '8px', fontFamily: 'var(--font-mono)' }}>
                          [ GENERATING THUMB... ]
                        </div>
                      ) : (
                        <img 
                          src={wallpapers[(currentWallpaperIdx + 1) % wallpapers.length]?.thumbnail} 
                          alt="Next preview" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          loading="lazy"
                        />
                      )}
                    </div>
                  </div>

                  {/* Right Navigation Arrow */}
                  <button
                    onClick={() => {
                      Sound.playClick();
                      fetchWallpapers();
                      setCurrentWallpaperIdx(prev => (prev + 1) % wallpapers.length);
                    }}
                    onMouseEnter={() => Sound.playHover()}
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid var(--nier-border)',
                      color: 'var(--nier-text)',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 10,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      userSelect: 'none'
                    }}
                    className="glitch-hover"
                  >
                    &gt;
                  </button>
                </div>

                {/* Carousel Navigation Indicators */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
                  {wallpapers.map((_, idx) => {
                    const active = currentWallpaperIdx === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          Sound.playClick();
                          fetchWallpapers();
                          setCurrentWallpaperIdx(idx);
                        }}
                        onMouseEnter={() => Sound.playHover()}
                        style={{
                          width: active ? '30px' : '8px',
                          height: '8px',
                          backgroundColor: active ? 'var(--nier-accent)' : 'var(--nier-border-muted)',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Anime ratings logs */}
          <div className="nier-panel">
            <h3 style={{ fontSize: '15px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Film size={16} /> OTAKU_DATA_RECORDS
            </h3>

            {recordsLoading ? (
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: 'var(--nier-text-muted)',
                padding: '40px 0',
                textAlign: 'center',
                backgroundColor: 'var(--nier-bg-alt)',
                border: '1px dashed var(--nier-border-muted)'
              }}>
                &gt; LOADING OTAKU DATABASE RECORDS...
              </div>
            ) : animeLogs.length === 0 ? (
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: 'var(--nier-text-muted)',
                padding: '40px 0',
                textAlign: 'center',
                backgroundColor: 'var(--nier-bg-alt)',
                border: '1px dashed var(--nier-border-muted)'
              }}>
                &gt; NO CLASSIFIED ARCHIVE RECTORIES DETECTED.
              </div>
            ) : (
              <>
                {/* Horizontal File Tabs */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {animeLogs.map((log, idx) => {
                    const active = selectedAnimeIdx === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => handleAnimeSelect(idx)}
                        onMouseEnter={() => Sound.playHover()}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          padding: '8px 14px',
                          border: '1px solid var(--nier-border-muted)',
                          borderTop: active ? `3px solid ${log.accentColor}` : '3px solid transparent',
                          backgroundColor: active ? 'var(--nier-bg-alt)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'all 0.18s ease',
                          fontFamily: 'var(--font-mono)',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          transform: active ? 'translateY(-2px)' : 'translateY(0)',
                          boxShadow: active ? '0 2px 10px rgba(0,0,0,0.1)' : 'none',
                        }}
                        className="glitch-hover"
                      >
                        <span style={{ fontSize: '9px', color: active ? log.accentColor : 'var(--nier-text-muted)', marginBottom: '3px' }}>
                          FILE_{String(idx + 1).padStart(2, '0')}
                        </span>
                        <span style={{ fontSize: '12px', color: active ? 'var(--nier-text)' : 'var(--nier-text-muted)', fontWeight: active ? 'bold' : 'normal' }}>
                          {log.title}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Dossier Card */}
                <div style={{
                  border: '1px solid var(--nier-border)',
                  backgroundColor: 'var(--nier-bg-alt)',
                  position: 'relative',
                  overflow: 'hidden',
                  minHeight: '200px',
                }}>
                  {/* Scanline overlay */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(rgba(78,75,66,0.06) 50%, transparent 50%)',
                    backgroundSize: '100% 3px',
                    pointerEvents: 'none',
                    zIndex: 1,
                  }} />

                  {isTransitioning ? (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '200px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      color: 'var(--nier-text-muted)',
                      gap: '10px',
                      position: 'relative',
                      zIndex: 2,
                    }}>
                      <span>&gt; ACCESSING CLASSIFIED RECORD...</span>
                      <span className="nier-cursor" />
                    </div>
                  ) : (
                    <div className="otaku-dossier-card">
                      {/* Left: Tall Poster */}
                      <div 
                        className="otaku-dossier-poster"
                        style={{
                          borderColor: animeLogs[selectedAnimeIdx]?.accentColor || 'var(--nier-border)',
                        }}
                      >
                        <div className="anime-corner-tl" />
                        <div className="anime-corner-br" style={{ bottom: '26px' }} />
                        <img
                          src={animeLogs[selectedAnimeIdx]?.coverUrl}
                          alt={animeLogs[selectedAnimeIdx]?.title}
                          loading="lazy"
                        />
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          backgroundColor: animeLogs[selectedAnimeIdx]?.accentColor || 'var(--nier-border)',
                          color: '#fff',
                          fontSize: '8px',
                          fontFamily: 'var(--font-mono)',
                          padding: '3px 0',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          letterSpacing: '0.12em',
                        }}>
                          {animeLogs[selectedAnimeIdx]?.type?.toUpperCase()}
                        </div>
                      </div>

                      {/* Right: Data Sheet */}
                      <div className="otaku-dossier-details">
                        {/* Title */}
                        <div style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '15px',
                          fontWeight: 'bold',
                          borderBottom: '1px solid var(--nier-border-muted)',
                          paddingBottom: '8px',
                          letterSpacing: '0.04em',
                        }}>
                          {animeLogs[selectedAnimeIdx]?.title?.toUpperCase()}
                        </div>

                        {/* Star Rating Blocks */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '10px', color: 'var(--nier-text-muted)', fontFamily: 'var(--font-mono)' }}>DIAGNOSTIC_RATING:</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <span className="otaku-stars" style={{ fontFamily: 'var(--font-mono)', color: animeLogs[selectedAnimeIdx]?.accentColor || 'var(--nier-text)' }}>
                              {renderStarBlocks(animeLogs[selectedAnimeIdx]?.rating || 0)}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--nier-text-muted)', fontFamily: 'var(--font-mono)' }}>
                              {animeLogs[selectedAnimeIdx]?.rating}/10
                            </span>
                          </div>
                        </div>

                        {/* Existential Threat Bar */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <span style={{ fontSize: '10px', color: 'var(--nier-text-muted)', fontFamily: 'var(--font-mono)' }}>EXISTENTIAL_THREAT_LEVEL:</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ flex: 1, height: '4px', backgroundColor: 'var(--nier-bg)', border: '1px solid var(--nier-border-muted)', overflow: 'hidden' }}>
                              <div style={{
                                width: `${(animeLogs[selectedAnimeIdx]?.existentialThreat || 0) * 10}%`,
                                height: '100%',
                                backgroundColor: animeLogs[selectedAnimeIdx]?.accentColor || 'var(--nier-text)',
                                transition: 'width 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
                              }} />
                            </div>
                            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--nier-text-muted)', minWidth: '30px' }}>
                              {animeLogs[selectedAnimeIdx]?.existentialThreat}/10
                            </span>
                          </div>
                        </div>

                        {/* Genre Tag Chips */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                          {animeLogs[selectedAnimeIdx]?.tags?.map(tag => (
                            <span key={tag} style={{
                              fontSize: '9px',
                              fontFamily: 'var(--font-mono)',
                              border: `1px solid ${animeLogs[selectedAnimeIdx]?.accentColor || 'var(--nier-border)'}`,
                              color: animeLogs[selectedAnimeIdx]?.accentColor || 'var(--nier-text)',
                              padding: '2px 7px',
                              letterSpacing: '0.07em',
                            }}>
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Operator Note */}
                        <blockquote style={{
                          margin: 0,
                          padding: '10px 12px',
                          borderLeft: `3px solid ${animeLogs[selectedAnimeIdx]?.accentColor || 'var(--nier-border)'}`,
                          backgroundColor: 'rgba(0,0,0,0.03)',
                          fontSize: '12px',
                          lineHeight: '1.6',
                          color: 'var(--nier-text)',
                        }}>
                          <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--nier-text-muted)', display: 'block', marginBottom: '5px' }}>
                            OPERATOR_LOG:
                          </span>
                          <em>"{animeLogs[selectedAnimeIdx]?.note}"</em>
                        </blockquote>

                        {/* Kitsu Link */}
                        <a
                          href={animeLogs[selectedAnimeIdx]?.kitsuUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="nier-btn small"
                          onClick={() => Sound.playClick()}
                          onMouseEnter={() => Sound.playHover()}
                          style={{ textDecoration: 'none', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px' }}
                        >
                          <ExternalLink size={10} /> [ VIEW ON KITSU ]
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>


        </div>

        {/* Right Side: Sound Jukebox */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          <div className="nier-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px', height: '100%', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Music size={16} /> YO-RHA JUKEBOX
            </h3>

            {songs.length === 0 ? (
              <div style={{ 
                fontFamily: 'var(--font-mono)', 
                fontSize: '12px', 
                color: 'var(--nier-text-muted)', 
                padding: '40px 0', 
                textAlign: 'center',
                backgroundColor: 'var(--nier-bg-alt)',
                border: '1px dashed var(--nier-border-muted)',
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                &gt; NO AUDIO FILES DETECTED IN public/songs/
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: 1, justifyContent: 'space-between', marginTop: '10px' }}>
                
                <div style={{ backgroundColor: 'var(--nier-bg-alt)', border: '1px solid var(--nier-border)', padding: '12px 15px', textAlign: 'center' }}>
                  <div 
                    style={{ 
                      fontFamily: 'var(--font-mono)', 
                      fontSize: '13px', 
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginBottom: '2px'
                    }}
                  >
                    {isPlaying ? '▶' : '❙❙'} {songs[currentSongIdx]?.title.toUpperCase() || 'UNKNOWN'}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--nier-text-muted)' }}>
                    SOURCE: public/songs/{songs[currentSongIdx]?.url.split('/').pop()}
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

                {/* Timeline Slider */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--nier-text-muted)' }}>
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                  <input 
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="nier-slider"
                  />
                </div>

                {/* Playback Controls Row */}
                <div className="jukebox-controls" style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                  <button 
                    className="nier-btn" 
                    onClick={handlePrevTrack}
                    style={{ fontSize: '11px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    title="PREVIOUS TRACK"
                  >
                    <SkipBack size={12} />
                  </button>

                  <button 
                    className="nier-btn" 
                    onClick={handlePlayPause}
                    style={{ width: '90px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    {isPlaying ? <Pause size={12} /> : <Play size={12} />} 
                    {isPlaying ? 'PAUSE' : 'PLAY'}
                  </button>

                  <button 
                    className="nier-btn" 
                    onClick={handleNextTrack}
                    style={{ fontSize: '11px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    title="NEXT TRACK"
                  >
                    <SkipForward size={12} />
                  </button>

                  <button 
                    className={`nier-btn ${repeatMode === 'none' ? 'muted' : ''}`} 
                    onClick={() => {
                      Sound.playClick();
                      setRepeatMode(prev => prev === 'all' ? 'one' : prev === 'one' ? 'none' : 'all');
                    }}
                    style={{ 
                      fontSize: '10px', 
                      padding: '6px 10px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px'
                    }}
                    title={`REPEAT MODE: ${repeatMode.toUpperCase()}`}
                  >
                    {repeatMode === 'one' ? <Repeat1 size={12} /> : <Repeat size={12} />}
                    <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                      {repeatMode === 'all' ? 'ALL' : repeatMode === 'one' ? 'ONE' : 'OFF'}
                    </span>
                  </button>
                </div>

                {/* Volume Controls Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(0,0,0,0.02)', padding: '6px 10px', border: '1px solid var(--nier-border-muted)', borderRadius: '2px' }}>
                  <button 
                    onClick={() => {
                      Sound.playClick();
                      setIsMuted(prev => !prev);
                    }}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer', 
                      padding: 0, 
                      color: isMuted ? 'var(--nier-accent)' : 'var(--nier-text)',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title={isMuted ? "UNMUTE" : "MUTE"}
                  >
                    {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                  </button>

                  <input 
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setVolume(val);
                      if (isMuted && val > 0) {
                        setIsMuted(false);
                      }
                    }}
                    className="nier-slider"
                    style={{ flex: 1 }}
                  />

                  <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', minWidth: '24px', textAlign: 'right', color: 'var(--nier-text-muted)' }}>
                    {isMuted ? 'MUT' : `${Math.round(volume * 100)}%`}
                  </span>
                </div>

                {/* Playlist log details */}
                <div className="jukebox-tracks-container" style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '6px', 
                  borderTop: '1px solid var(--nier-border-muted)', 
                  paddingTop: '12px',
                  flex: 1,
                  overflowY: 'auto',
                  maxHeight: '260px'
                }}>
                  {songs.map((s, idx) => {
                    const active = currentSongIdx === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          fetchSongs();
                          setCurrentSongIdx(idx);
                          playTrack(idx, true);
                        }}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          cursor: 'pointer',
                          padding: '6px 8px',
                          backgroundColor: active ? 'var(--nier-text)' : 'transparent',
                          color: active ? 'var(--nier-bg)' : 'var(--nier-text)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          border: active ? 'none' : '1px solid transparent',
                          transition: 'all 0.1s ease'
                        }}
                        className="glitch-hover"
                      >
                        <span>{String(idx + 1).padStart(2, '0')}. {s.title}</span>
                        <span style={{ fontSize: '9px', opacity: 0.7 }}>MP3_FILE</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ── SOUNDCLOUD: RECENTLY LIKED ─────────────────────────── */}
      <section className="soundcloud-section" style={{ marginTop: '30px' }}>
        <div className="title-decorator" style={{ marginBottom: '20px' }}>
          <span className="tag">SOUNDCLOUD</span>
          <h3 style={{ fontSize: '16px', margin: 0 }}>
            <Heart size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            RECENTLY_LIKED // LIVE_FEED
          </h3>
          <div className="line" />
          <span className="tag">
            <a
              href="https://soundcloud.com/dev-darshan-046"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--nier-text-muted)', textDecoration: 'none' }}
            >
              dev-darshan-046
            </a>
          </span>
        </div>

        {/* Loading state */}
        {scStatus === 'loading' && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--nier-text-muted)', padding: '20px 0' }}>
            &gt; QUERYING SOUNDCLOUD API...
          </div>
        )}

        {/* No key configured */}
        {scStatus === 'no-key' && (
          <div className="nier-panel" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: 1.8, color: 'var(--nier-text-muted)' }}>
            <div style={{ color: 'var(--nier-accent)', marginBottom: '8px' }}>[ API_KEY_MISSING ]</div>
            <div>&gt; SOUNDCLOUD_CLIENT_ID not set in .env</div>
            <div>&gt; Run: <code style={{ color: 'var(--nier-text)' }}>npm run server</code> and add your key to <code style={{ color: 'var(--nier-text)' }}>.env</code></div>
            <div>&gt; See <code style={{ color: 'var(--nier-text)' }}>.env.example</code> for instructions</div>
          </div>
        )}

        {/* Error state */}
        {scStatus === 'error' && (
          <div className="nier-panel" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--nier-accent)', lineHeight: 1.8 }}>
            <div>[ FETCH_ERROR ]</div>
            <div>&gt; {scError}</div>
            <div style={{ color: 'var(--nier-text-muted)', marginTop: '4px' }}>&gt; Make sure the API server is running: <code>npm run server</code></div>
          </div>
        )}

        {/* Track list */}
        {scStatus === 'ok' && (
          <div>
            {scTracks.length === 0 && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--nier-text-muted)' }}>
                &gt; No liked tracks found.
              </div>
            )}
            <div className="sc-tracks-grid">
              {scTracks.map((track, idx) => {
                const mins = Math.floor(track.duration / 60000);
                const secs = String(Math.floor((track.duration % 60000) / 1000)).padStart(2, '0');
                const rankColor = SC_RANK_COLORS[idx % SC_RANK_COLORS.length];
                return (
                  <a
                    key={track.id}
                    href={track.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                    onClick={() => Sound.playClick()}
                  >
                    <div
                      className="nier-panel sc-track-card"
                      style={{
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease, box-shadow 0.2s ease',
                        borderLeft: `3px solid ${rankColor}`,
                        position: 'relative',
                        height: '100%',
                      }}
                      onMouseEnter={(e) => {
                        Sound.playHover();
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--nier-bg-alt)';
                        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 14px ${rankColor}44`;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = '';
                        (e.currentTarget as HTMLElement).style.boxShadow = '';
                      }}
                    >
                      {/* Rank Badge */}
                      <div className="sc-track-artwork" style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9px',
                        color: rankColor,
                        letterSpacing: '0.05em',
                      }}>
                        LIKED #{String(idx + 1).padStart(2, '0')}
                      </div>

                      {/* Artwork */}
                      <div style={{
                        width: '58px',
                        height: '58px',
                        flexShrink: 0,
                        border: `1px solid ${rankColor}66`,
                        overflow: 'hidden',
                        position: 'relative',
                        backgroundColor: 'var(--nier-bg-alt)',
                      }}>
                        {track.artwork ? (
                          <img
                            src={track.artwork}
                            alt={track.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(0.2) contrast(1.05)' }}
                            loading="lazy"
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Music size={20} style={{ color: 'var(--nier-text-muted)' }} />
                          </div>
                        )}
                        <div style={{
                          position: 'absolute', inset: 0,
                          background: 'linear-gradient(rgba(78,75,66,0.12) 50%, transparent 50%)',
                          backgroundSize: '100% 3px',
                          pointerEvents: 'none',
                        }} />
                      </div>

                      {/* Track info */}
                      <div className="sc-track-info" style={{ flex: 1, overflow: 'hidden', paddingRight: '52px' }}>
                        <div className="sc-track-title" style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '13px',
                          fontWeight: 'bold',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginBottom: '3px',
                        }}>
                          {track.title}
                        </div>
                        <div className="sc-track-artist" style={{ fontSize: '11px', color: 'var(--nier-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '6px' }}>
                          {track.artist}
                        </div>
                        <div className="sc-track-stats" style={{ display: 'flex', gap: '10px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--nier-text-muted)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Play size={8} /> {track.plays.toLocaleString()}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Heart size={8} /> {track.likes.toLocaleString()}
                          </span>
                          <span>{mins}:{secs}</span>
                        </div>
                      </div>

                      <ExternalLink size={12} style={{ color: 'var(--nier-text-muted)', flexShrink: 0 }} />
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Lightbox Zoom Modal Overlay */}
      {isZoomOpen && wallpapers.length > 0 && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'var(--nier-bg-overlay)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(3px)',
            animation: 'zoom-overlay-fade-in 0.2s ease-out forwards',
            padding: '20px'
          }}
          onClick={() => {
            Sound.playClick();
            setIsZoomOpen(false);
          }}
        >
          {/* CRT Noise overlay inside modal */}
          <div className="nier-scanlines" style={{ zIndex: 1, pointerEvents: 'none' }} />

          {/* Modal Left Navigation Button (Viewport Absolute) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              Sound.playClick();
              fetchWallpapers();
              setCurrentWallpaperIdx(prev => (prev - 1 + wallpapers.length) % wallpapers.length);
            }}
            onMouseEnter={() => Sound.playHover()}
            className="zoom-nav-btn left"
            style={{
              position: 'absolute',
              left: '40px',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0,0,0,0.6)',
              border: '1px solid var(--nier-border)',
              color: '#fff',
              width: '46px',
              height: '46px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10000,
              fontFamily: 'var(--font-mono)',
              fontWeight: 'bold',
              fontSize: '22px',
              userSelect: 'none',
              borderRadius: '2px',
              transition: 'background-color 0.2s ease'
            }}
          >
            &lt;
          </button>

          {/* Modal Right Navigation Button (Viewport Absolute) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              Sound.playClick();
              fetchWallpapers();
              setCurrentWallpaperIdx(prev => (prev + 1) % wallpapers.length);
            }}
            onMouseEnter={() => Sound.playHover()}
            className="zoom-nav-btn right"
            style={{
              position: 'absolute',
              right: '40px',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0,0,0,0.6)',
              border: '1px solid var(--nier-border)',
              color: '#fff',
              width: '46px',
              height: '46px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10000,
              fontFamily: 'var(--font-mono)',
              fontWeight: 'bold',
              fontSize: '22px',
              userSelect: 'none',
              borderRadius: '2px',
              transition: 'background-color 0.2s ease'
            }}
          >
            &gt;
          </button>
          
          <div 
            className="zoom-modal-container"
            style={{
              position: 'relative',
              maxWidth: '80%', // Leaves margins on either side for viewport navigation buttons
              maxHeight: '85vh',
              border: '2px solid var(--nier-border)',
              backgroundColor: 'var(--nier-bg)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 2,
              animation: 'zoom-modal-scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
            onClick={(e) => e.stopPropagation()} // Prevent close on clicking image frame
          >
            {/* Header info bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--nier-bg-alt)',
              borderBottom: '1px solid var(--nier-border)',
              padding: '8px 12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px'
            }}>
              <span>DETAILED_VISUAL_FEED // {wallpapers[currentWallpaperIdx]?.original?.split('/').pop() || ''}</span>
              
              <button 
                onClick={() => {
                  Sound.playClick();
                  setIsZoomOpen(false);
                }}
                onMouseEnter={() => Sound.playHover()}
                style={{
                  backgroundColor: 'var(--nier-accent)',
                  color: 'var(--nier-bg)',
                  border: 'none',
                  padding: '2px 8px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}
                className="glitch-hover"
              >
                [ CLOSE ]
              </button>
            </div>

            {/* High-res Image View */}
            <div style={{
              overflow: 'hidden',
              backgroundColor: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%'
            }}>
              <img 
                src={wallpapers[currentWallpaperIdx]?.original} 
                alt="Zoomed wallpaper view" 
                style={{
                  maxWidth: '100%',
                  maxHeight: '75vh',
                  objectFit: 'contain',
                  filter: 'sepia(0.08) contrast(1.02)'
                }}
                loading="lazy"
              />
            </div>

            {/* Footer decoration */}
            <div style={{
              backgroundColor: 'var(--nier-bg-alt)',
              borderTop: '1px solid var(--nier-border)',
              padding: '6px 12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--nier-text-muted)',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>GLORY TO MANKIND // YoRHa COORD MATRIX</span>
              <span>INDEX: 0{currentWallpaperIdx + 1} / 0{wallpapers.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
