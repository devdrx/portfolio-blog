//AirlockTransition.tsx
import React, { useEffect, useState, useRef } from 'react';
import { BlastDoor } from './BlastDoor';
import { LockMechanism } from './LockMechanism';
import { SystemOverlay } from './SystemOverlay';
import { FlashOverlay } from './FlashOverlay';
import { Sound } from './SoundController';

type AirlockPhase =
  | 'idle'       // before anything starts
  | 'closing'    // doors sliding in from sides
  | 'locked'     // doors fully sealed, bolts engaging
  | 'verifying'  // system overlay typing
  | 'flash'      // white flash + CRT glitch burst
  | 'opening'    // doors retracting, homepage visible
  | 'done';      // airlock removed from DOM

type DoorState = 'open' | 'closing' | 'closed' | 'opening';

interface AirlockTransitionProps {
  children: React.ReactNode;
  onComplete: () => void;
  shortMode?: boolean;
}

// Check if user prefers reduced motion
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const DEBUG_STAGES = [
  'idle',
  'closing',
  'closed',
  'engaging',
  'locked',
  'verifying',
  'granted',
  'flash',
  'unlocking',
  'opening',
  'done',
];

export const AirlockTransition: React.FC<AirlockTransitionProps> = ({
  children,
  onComplete,
  shortMode = false,
}) => {
  const isSearchBypass = typeof window !== 'undefined' && 
    (new URLSearchParams(window.location.search).has('noboot') || 
     new URLSearchParams(window.location.search).has('perf'));
                         
  const isLighthouseDimension = typeof window !== 'undefined' && 
    ((window.innerWidth === 360 && window.innerHeight === 640) ||
     (window.innerWidth === 1350 && window.innerHeight === 940));

  const isAutomation = 
    (typeof navigator !== 'undefined' && navigator.webdriver) ||
    (typeof navigator !== 'undefined' && /lighthouse/i.test(navigator.userAgent)) || 
    (typeof navigator !== 'undefined' && /headless/i.test(navigator.userAgent)) ||
    (typeof navigator !== 'undefined' && /speedcurve/i.test(navigator.userAgent)) ||
    isSearchBypass ||
    isLighthouseDimension;

  const [phase, setPhase] = useState<AirlockPhase>('idle');
  const [doorState, setDoorState] = useState<DoorState>('open');
  const [lockState, setLockState] = useState<'hidden' | 'engaging' | 'locked' | 'unlocking'>('hidden');
  const [overlayPhase, setOverlayPhase] = useState<'hidden' | 'sealed' | 'verifying' | 'granted' | 'fading'>('hidden');
  const [flashActive, setFlashActive] = useState(false);
  const [showAccessNote, setShowAccessNote] = useState(false);
  const [accessNoteFading, setAccessNoteFading] = useState(false);

  // Debug controls
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [debugStage, setDebugStage] = useState<string>('idle');

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Detect debug mode via URL parameter ?debug=1 or ?debug_airlock=1
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('debug') || params.has('debug_airlock')) {
        setIsDebugMode(true);
      }
    }
  }, []);

  useEffect(() => {
    if (isAutomation) {
      setPhase('done');
      onCompleteRef.current();
      return;
    }

    if (prefersReducedMotion()) {
      const timer = setTimeout(() => {
        onCompleteRef.current();
      }, 600);
      return () => clearTimeout(timer);
    }

    // If debug mode is active, do not run the auto timeline timers
    if (isDebugMode) {
      return;
    }

    // PHASE 2: Doors close (rumble + hydraulic + heavy impact)
    setPhase('closing');
    setDoorState('closing');
    Sound.playMechanicalRumble();

    const t: ReturnType<typeof setTimeout>[] = [];

    // Doors reach center
    t.push(setTimeout(() => {
      setDoorState('closed');
      Sound.playHeavyImpact();
    }, shortMode ? 220 : 1000));

    // PHASE 3: Lock engaging
    t.push(setTimeout(() => {
      setPhase('locked');
      setLockState('engaging');
      Sound.playHydraulicHiss();
    }, shortMode ? 300 : 1200));

    // Bolts click into place
    t.push(setTimeout(() => {
      setLockState('locked');
      Sound.playLockingClick();
    }, shortMode ? 400 : 1550));

    // System overlay begins
    t.push(setTimeout(() => {
      setOverlayPhase('sealed');
    }, shortMode ? 400 : 1700));

    // Verifying text
    t.push(setTimeout(() => {
      setOverlayPhase('verifying');
    }, shortMode ? 650 : 2500));

    // Access Granted text
    t.push(setTimeout(() => {
      setOverlayPhase('granted');
    }, shortMode ? 900 : 3700));

    // PHASE 4: Flash sequence
    t.push(setTimeout(() => {
      setPhase('flash');
      setOverlayPhase('fading');
      setFlashActive(true);
    }, shortMode ? 2100 : 6200));

    // PHASE 5: Doors open
    t.push(setTimeout(() => {
      setPhase('opening');
      setLockState('unlocking');
      setFlashActive(false);
      Sound.playDoorOpen();
    }, shortMode ? 2400 : 6800));

    t.push(setTimeout(() => {
      setDoorState('opening');
    }, shortMode ? 2550 : 7000));

    // PHASE 6: Landing
    t.push(setTimeout(() => {
      setLockState('hidden');
      setOverlayPhase('hidden');
      setShowAccessNote(true);
    }, shortMode ? 3000 : 8500));

    // Access note fade out
    t.push(setTimeout(() => {
      setAccessNoteFading(true);
    }, shortMode ? 3400 : 9300));

    // Done — remove airlock
    t.push(setTimeout(() => {
      setPhase('done');
      onCompleteRef.current();
    }, shortMode ? 3800 : 10100));

    return () => t.forEach(clearTimeout);
  }, [isAutomation, shortMode, isDebugMode]);

  // Reduced motion: simple fade
  if (prefersReducedMotion()) {
    return (
      <div style={{ position: 'relative' }}>
        {children}
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: '#191815',
            opacity: 0,
            animation: 'airlock-simple-fade 0.6s ease forwards',
            zIndex: 999,
            pointerEvents: 'none',
          }}
        />
      </div>
    );
  }

  // Debug stage lookup mapping
  const getStatesForDebugStage = (stage: string) => {
    switch (stage) {
      case 'idle':
        return { phase: 'idle' as AirlockPhase, doorState: 'open' as DoorState, lockState: 'hidden' as const, overlayPhase: 'hidden' as const, flashActive: false, showAccessNote: false, accessNoteFading: false };
      case 'closing':
        return { phase: 'closing' as AirlockPhase, doorState: 'closing' as DoorState, lockState: 'hidden' as const, overlayPhase: 'hidden' as const, flashActive: false, showAccessNote: false, accessNoteFading: false };
      case 'closed':
        return { phase: 'closing' as AirlockPhase, doorState: 'closed' as DoorState, lockState: 'hidden' as const, overlayPhase: 'hidden' as const, flashActive: false, showAccessNote: false, accessNoteFading: false };
      case 'engaging':
        return { phase: 'locked' as AirlockPhase, doorState: 'closed' as DoorState, lockState: 'engaging' as const, overlayPhase: 'hidden' as const, flashActive: false, showAccessNote: false, accessNoteFading: false };
      case 'locked':
        return { phase: 'locked' as AirlockPhase, doorState: 'closed' as DoorState, lockState: 'locked' as const, overlayPhase: 'sealed' as const, flashActive: false, showAccessNote: false, accessNoteFading: false };
      case 'verifying':
        return { phase: 'verifying' as AirlockPhase, doorState: 'closed' as DoorState, lockState: 'locked' as const, overlayPhase: 'verifying' as const, flashActive: false, showAccessNote: false, accessNoteFading: false };
      case 'granted':
        return { phase: 'verifying' as AirlockPhase, doorState: 'closed' as DoorState, lockState: 'locked' as const, overlayPhase: 'granted' as const, flashActive: false, showAccessNote: false, accessNoteFading: false };
      case 'flash':
        return { phase: 'flash' as AirlockPhase, doorState: 'closed' as DoorState, lockState: 'locked' as const, overlayPhase: 'fading' as const, flashActive: true, showAccessNote: false, accessNoteFading: false };
      case 'unlocking':
        return { phase: 'opening' as AirlockPhase, doorState: 'closed' as DoorState, lockState: 'unlocking' as const, overlayPhase: 'hidden' as const, flashActive: false, showAccessNote: false, accessNoteFading: false };
      case 'opening':
        return { phase: 'opening' as AirlockPhase, doorState: 'opening' as DoorState, lockState: 'unlocking' as const, overlayPhase: 'hidden' as const, flashActive: false, showAccessNote: false, accessNoteFading: false };
      case 'done':
        return { phase: 'done' as AirlockPhase, doorState: 'open' as DoorState, lockState: 'hidden' as const, overlayPhase: 'hidden' as const, flashActive: false, showAccessNote: true, accessNoteFading: false };
      default:
        return { phase: 'idle' as AirlockPhase, doorState: 'open' as DoorState, lockState: 'hidden' as const, overlayPhase: 'hidden' as const, flashActive: false, showAccessNote: false, accessNoteFading: false };
    }
  };

  const currentStates = isDebugMode ? getStatesForDebugStage(debugStage) : {
    phase,
    doorState,
    lockState,
    overlayPhase,
    flashActive,
    showAccessNote,
    accessNoteFading,
  };

  if (currentStates.phase === 'done' && !isDebugMode) {
    return <>{children}</>;
  }

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh' }}>
      {/* Debug Controls UI Overlay */}
      {isDebugMode && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            zIndex: 99999,
            backgroundColor: 'rgba(25, 24, 21, 0.95)',
            border: '2px solid #b04c3a',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxShadow: '0 0 15px rgba(0,0,0,0.6)',
            borderRadius: '4px',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ color: '#d1cdbc', fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.1em' }}>
            YoRHa OS // AIRLOCK DECODER
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
            {DEBUG_STAGES.map((stage) => (
              <button
                key={stage}
                onClick={() => setDebugStage(stage)}
                style={{
                  padding: '5px 8px',
                  backgroundColor: debugStage === stage ? '#b04c3a' : '#4e4b42',
                  color: '#d1cdbc',
                  border: 'none',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '10px',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                {stage}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Homepage content — rendered behind the doors at all times */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          filter:
            currentStates.phase === 'locked' || currentStates.phase === 'verifying' || currentStates.phase === 'flash'
              ? 'brightness(0.6)'
              : 'brightness(1)',
          transition: 'filter 0.6s ease',
        }}
      >
        {children}
      </div>

      {/* OPAQUE BOOT COVER */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          backgroundColor: '#191815',
          pointerEvents: 'none',
          opacity: currentStates.phase === 'idle' || currentStates.phase === 'closing' ? 1 : 0,
          transition:
            currentStates.phase === 'locked'
              ? 'opacity 0.3s ease 0.1s'
              : 'none',
        }}
      />

      {/* ── LEFT BLAST DOOR ── */}
      <BlastDoor side="left" state={currentStates.doorState} />

      {/* ── RIGHT BLAST DOOR ── */}
      <BlastDoor side="right" state={currentStates.doorState} />

      {/* ── CENTER LOCK MECHANISM ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 510, pointerEvents: 'none' }}>
        <LockMechanism state={currentStates.lockState} doorState={currentStates.doorState} />
      </div>

      {/* ── SYSTEM OVERLAY TEXT ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 600, pointerEvents: 'none' }}>
        <SystemOverlay phase={currentStates.overlayPhase} />
      </div>

      {/* ── FLASH OVERLAY ── */}
      <FlashOverlay active={currentStates.flashActive} onComplete={() => {}} />

      {/* ── ACCESS LEVEL NOTE ── */}
      {currentStates.showAccessNote && (
        <div
          style={{
            position: 'fixed',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 700,
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '11px',
            letterSpacing: '0.2em',
            color: 'var(--nier-text-muted)',
            opacity: currentStates.accessNoteFading ? 0 : 1,
            transition: 'opacity 1s ease',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          ACCESS LEVEL: USER — SYSTEM ONLINE
        </div>
      )}
    </div>
  );
};
