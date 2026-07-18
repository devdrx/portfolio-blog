import React, { useEffect, useState } from 'react';
import { Sound } from '../components/SoundController';
import { Volume2, VolumeX, ShieldCheck, PlayCircle } from 'lucide-react';

export const SystemSettings: React.FC = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(30);
  const [showScanlines, setShowScanlines] = useState(true);
  const [typeSpeed, setTypeSpeed] = useState(40);

  useEffect(() => {
    setIsMuted(Sound.isMuted());
    setVolume(Math.round(Sound.getVolume() * 100));

    const savedScanlines = localStorage.getItem('yorha_scanlines_enabled');
    setShowScanlines(savedScanlines !== 'false');

    const savedSpeed = localStorage.getItem('yorha_typewriter_speed');
    if (savedSpeed) {
      const parsed = parseInt(savedSpeed, 10);
      // Guard against a corrupt stored value making the range input value={NaN}.
      if (!Number.isNaN(parsed)) setTypeSpeed(parsed);
    }
  }, []);

  const handleMuteToggle = () => {
    const nextMuted = Sound.toggleMute();
    setIsMuted(nextMuted);
    Sound.playClick();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setVolume(val);
    Sound.setVolume(val / 100);
  };

  const handleVolumeRelease = () => {
    Sound.playHover();
  };

  const handleScanlineToggle = () => {
    Sound.playClick();
    const nextVal = !showScanlines;
    setShowScanlines(nextVal);
    localStorage.setItem('yorha_scanlines_enabled', String(nextVal));
    
    // Toggle element directly
    const scanlineEl = document.querySelector('.nier-scanlines');
    const scanlineBar = document.querySelector('.nier-scanline-bar');
    if (scanlineEl && scanlineBar) {
      if (nextVal) {
        (scanlineEl as HTMLElement).style.display = 'block';
        (scanlineBar as HTMLElement).style.display = 'block';
      } else {
        (scanlineEl as HTMLElement).style.display = 'none';
        (scanlineBar as HTMLElement).style.display = 'none';
      }
    }
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setTypeSpeed(val);
    localStorage.setItem('yorha_typewriter_speed', String(val));
  };

  const testChime = () => {
    Sound.playChime();
  };

  const testWarning = () => {
    Sound.playWarning();
  };

  return (
    <div className="content-section" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header */}
      <div className="title-decorator">
        <span className="tag">SYSTEM</span>
        <h2>[04_SYSTEM] // CONFIGURATION_PANEL</h2>
        <div className="line" />
        <span className="tag">YoRHa OS v1.0.4</span>
      </div>

      <div className="settings-grid">
        
        {/* Left Side: System Options */}
        <div className="nier-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '15px', borderBottom: '1px solid var(--nier-border-muted)', paddingBottom: '6px' }}>
            DISPLAY CONFIGS
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '14px' }}>

            {/* Scanlines Select */}
            <div className="settings-row">
              <div>
                <strong>SCREEN_SCANLINES:</strong>
                <div style={{ fontSize: '11px', color: 'var(--nier-text-muted)' }}>Toggles the pixelated vertical scan overlays.</div>
              </div>
              <button 
                className={`nier-btn small ${showScanlines ? 'active' : ''}`}
                onClick={handleScanlineToggle}
                style={{ width: '120px', flexShrink: 0 }}
              >
                {showScanlines ? '[ ENABLED ]' : '[ DISABLED ]'}
              </button>
            </div>

            <div className="nier-double-line" />

            {/* Typewriter Speed Select */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>TYPEWRITER_TEXT_SPEED:</strong>
                  <div style={{ fontSize: '11px', color: 'var(--nier-text-muted)' }}>Adjust speed of text printout cycles.</div>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{typeSpeed} ms/char</span>
              </div>
              <input 
                type="range" 
                min={10} 
                max={100} 
                step={5}
                value={typeSpeed} 
                onChange={handleSpeedChange}
                style={{ 
                  width: '100%', 
                  accentColor: 'var(--nier-accent)',
                  cursor: 'pointer'
                }}
              />
            </div>

          </div>
        </div>

        {/* Right Side: Audio and Calibration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Audio controls */}
          <div className="nier-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ fontSize: '15px', borderBottom: '1px solid var(--nier-border-muted)', paddingBottom: '6px' }}>
              SYNTHESIZER AUDIO CORE
            </h3>

            <div className="settings-row">
              <div>
                <strong>AUDIO_SYNTHESIS:</strong>
              </div>
              <button 
                className={`nier-btn small ${isMuted ? 'danger active' : ''}`}
                onClick={handleMuteToggle}
                style={{ width: '120px', flexShrink: 0 }}
              >
                {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />} 
                {isMuted ? ' [ MUTED ]' : ' [ ON ]'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span>VOLUME_GAIN:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{isMuted ? '0' : volume}%</span>
              </div>
              <input 
                type="range" 
                min={0} 
                max={100} 
                value={volume} 
                onChange={handleVolumeChange}
                onMouseUp={handleVolumeRelease}
                onTouchEnd={handleVolumeRelease}
                disabled={isMuted}
                style={{ 
                  width: '100%', 
                  accentColor: 'var(--nier-text)',
                  cursor: isMuted ? 'not-allowed' : 'pointer'
                }}
              />
            </div>

            <div className="settings-actions">
              <button className="nier-btn small" onClick={testChime} style={{ flexGrow: 1 }} disabled={isMuted}>
                <PlayCircle size={12} /> TEST CHIME
              </button>
              <button className="nier-btn small danger" onClick={testWarning} style={{ flexGrow: 1 }} disabled={isMuted}>
                <PlayCircle size={12} /> TEST WARN
              </button>
            </div>
          </div>

          {/* Unit Info Diagnostics */}
          <div className="nier-panel" style={{ display: 'flex', gap: '10px', padding: '15px' }}>
            <ShieldCheck size={20} style={{ color: 'var(--nier-accent)', flexShrink: 0 }} />
            <div style={{ fontSize: '12px' }}>
              <strong>YoRHa FIRMWARE OK:</strong> All settings are validated and cached in the browser's sandbox index (localStorage). Reboots will not clean loaded chip values.
            </div>
          </div>

          {/* Encrypted admin subport gateway */}
          <div 
            style={{ 
              border: '1px dashed var(--nier-border-muted)', 
              padding: '12px', 
              backgroundColor: 'rgba(0,0,0,0.01)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--nier-text-muted)', letterSpacing: '0.05em' }}>
              DIAGNOSTIC_SUBPORT // MAINTENANCE_PORTAL_ENCRYPTED
            </div>
            <button 
              className="nier-btn small" 
              style={{ width: '100%', fontSize: '10px', color: 'var(--nier-text-muted)', border: '1px dashed var(--nier-border-muted)' }}
              onClick={() => {
                Sound.playWarning();
                window.location.hash = '#/admin/login';
              }}
            >
              [ CALIBRATE SYSTEM PORTAL ]
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
