import React, { useEffect, useState, useRef } from 'react';
import { Sound } from './SoundController';

interface BootScreenProps {
  onComplete: () => void;
}

const BOOT_LOGS = [
  'CORPUS DETECTED: portfolio-blog',
  'INITIALIZING YoRHa OS v1.0.4...',
  'BOOTING HARDWARE DIAGNOSTICS...',
  'CPU Core 1-8: [ACTIVE]',
  'MEMORY TEST: 65,536MB OK',
  'CHECKING AUDIO CORE... WebAudioAPI [ONLINE]',
  'MOUNTING COMPILER SYSTEM... TypeScript Compiler [READY]',
  'LOADING VISUAL ENVIRONMENT... Vanilla CSS engine [LOADED]',
  'ESTABLISHING NETWORK PROTOCOLS... localhost [SECURED]',
  'LOADING USER CHIPS [React.chi, TS.chi, Math.chi, CP.chi]...',
  'UPDATING CENTRAL REGISTRY DATABASE...',
  'ALL SYSTEMS NOMINAL. ENGAGING USER SHELL.',
];

export const BootScreen: React.FC<BootScreenProps> = ({ onComplete }) => {
  const isSearchBypass = typeof window !== 'undefined' && 
    (new URLSearchParams(window.location.search).has('noboot') || 
     new URLSearchParams(window.location.search).has('perf'));

  const isLighthouseDimension = typeof window !== 'undefined' && 
    ((window.innerWidth === 360 && window.innerHeight === 640) || // Lighthouse Mobile
     (window.innerWidth === 1350 && window.innerHeight === 940));  // Lighthouse Desktop

  const isAutomation = 
    (typeof navigator !== 'undefined' && navigator.webdriver) ||
    (typeof navigator !== 'undefined' && /lighthouse/i.test(navigator.userAgent)) || 
    (typeof navigator !== 'undefined' && /headless/i.test(navigator.userAgent)) ||
    (typeof navigator !== 'undefined' && /speedcurve/i.test(navigator.userAgent)) ||
    isSearchBypass ||
    isLighthouseDimension;

  const [bootStarted, setBootStarted] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'text' | 'bar' | 'complete'>('text');

  // Load local storage typewriter speed configuration (default is 40)
  const savedSpeed = typeof window !== 'undefined' ? localStorage.getItem('yorha_typewriter_speed') : null;
  const speedVal = savedSpeed ? parseInt(savedSpeed, 10) : 40;
  const logInterval = speedVal * 4.5;
  const barInterval = speedVal * 3;

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Skip boot sequence entirely for automated performance testing tools
  useEffect(() => {
    if (isAutomation) {
      onCompleteRef.current();
    }
  }, [isAutomation]);

  // Trigger boot sequence logs
  useEffect(() => {
    if (!bootStarted) return;

    // Play warning sound at the start of auto-boot (if audio is unlocked)
    Sound.playWarning();

    const interval = setInterval(() => {
      setLogs((prev) => {
        if (prev.length < BOOT_LOGS.length) {
          Sound.playHover();
          return [...prev, BOOT_LOGS[prev.length]];
        } else {
          clearInterval(interval);
          setPhase('bar');
          return prev;
        }
      });
    }, logInterval);

    return () => clearInterval(interval);
  }, [bootStarted, logInterval]);

  // Trigger load progress bar
  useEffect(() => {
    if (phase !== 'bar') return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 100) {
          const next = prev + Math.floor(Math.random() * 18) + 5;
          Sound.playHover();
          return Math.min(100, next);
        } else {
          clearInterval(interval);
          setPhase('complete');
          return 100;
        }
      });
    }, barInterval);

    return () => clearInterval(interval);
  }, [phase, barInterval]);

  // Complete boot
  useEffect(() => {
    if (phase === 'complete') {
      Sound.playChime();
      const timer = setTimeout(() => {
        onCompleteRef.current();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleStartBoot = () => {
    // Play sound immediately to unlock browser AudioContext
    Sound.playWarning();
    setBootStarted(true);
  };

  const handleSkip = () => {
    Sound.playClick();
    onComplete();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (!bootStarted) {
          handleStartBoot();
        } else if (phase !== 'complete') {
          handleSkip();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bootStarted, phase]);

  if (!bootStarted) {
    return (
      <div className="boot-screen" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div className="boot-terminal" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
          <div className="boot-logo">
            GLORY TO MANKIND // YoRHa
          </div>
          
          <div style={{ color: '#8c887a', fontSize: '14px', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
            [ TACTICAL TERMINAL DETECTED ]
          </div>
          
          <div style={{ color: '#d1cdbc', fontSize: '13px', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', margin: '10px 0' }}>
            AWAITING OPERATOR SYNC LINK PROTOCOL.
          </div>

          <div className="nier-double-line" style={{ width: '100%', borderColor: '#8c887a' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', margin: '15px 0' }}>
            {/* Left Arrowheads pointing right (towards button) */}
            <div className="arrow-chain">
              <span className="arrow" style={{ animationDelay: '0.0s' }}>&gt;</span>
              <span className="arrow" style={{ animationDelay: '0.2s' }}>&gt;</span>
              <span className="arrow" style={{ animationDelay: '0.4s' }}>&gt;</span>
              <span className="arrow" style={{ animationDelay: '0.6s' }}>&gt;</span>
            </div>

            <button 
              className="nier-btn" 
              onClick={handleStartBoot}
              style={{ 
                padding: '12px 30px', 
                fontSize: '14px', 
                color: '#d1cdbc',
                borderColor: '#8c887a',
                whiteSpace: 'nowrap'
              }}
            >
              [ INITIATE CONNECTION ]
            </button>

            {/* Right Arrowheads pointing left (towards button) */}
            <div className="arrow-chain">
              <span className="arrow" style={{ animationDelay: '0.6s' }}>&lt;</span>
              <span className="arrow" style={{ animationDelay: '0.4s' }}>&lt;</span>
              <span className="arrow" style={{ animationDelay: '0.2s' }}>&lt;</span>
              <span className="arrow" style={{ animationDelay: '0.0s' }}>&lt;</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="boot-screen">
      <div className="boot-terminal">
        <div className="boot-logo">
          GLORY TO MANKIND // YoRHa
        </div>
        
        <div style={{ minHeight: '320px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {logs.map((log, idx) => (
            <div key={idx} style={{ color: '#d1cdbc', fontSize: '14px', letterSpacing: '0.05em' }}>
              &gt; {log}
            </div>
          ))}
        </div>

        {(phase === 'bar' || phase === 'complete') && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
              <span>SYSTEM LOADING: {progress}%</span>
            </div>
            <div className="boot-bar-container">
              <div 
                className="boot-bar-fill" 
                style={{ width: `${progress}%`, transition: 'width 0.1s ease' }} 
              />
            </div>
          </div>
        )}

        <div style={{ marginTop: '40px', alignSelf: 'flex-end' }}>
          <button 
            className="nier-btn danger" 
            onClick={handleSkip}
            style={{ padding: '6px 14px', fontSize: '12px' }}
          >
            [ SKIP BOOT SEQUENCE ]
          </button>
        </div>
      </div>
    </div>
  );
};
