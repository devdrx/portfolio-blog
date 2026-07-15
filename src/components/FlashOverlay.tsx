import React, { useEffect, useState } from 'react';

interface FlashOverlayProps {
  active: boolean;
  onComplete: () => void;
}

export const FlashOverlay: React.FC<FlashOverlayProps> = ({ active, onComplete }) => {
  const [phase, setPhase] = useState<'idle' | 'flash' | 'glitch' | 'fade'>('idle');

  useEffect(() => {
    if (!active) return;

    // White flash
    setPhase('flash');

    const t1 = setTimeout(() => setPhase('glitch'), 120);
    const t2 = setTimeout(() => setPhase('fade'), 500);
    const t3 = setTimeout(() => {
      setPhase('idle');
      onComplete();
    }, 900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [active, onComplete]);

  if (phase === 'idle') return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      {/* White flash layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: '#f5f2e8',
          opacity: phase === 'flash' ? 1 : 0,
          transition: phase === 'flash' ? 'none' : 'opacity 0.6s ease',
        }}
      />

      {/* CRT glitch scanline distortion */}
      {phase === 'glitch' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            animation: 'airlock-crt-glitch 0.38s steps(3) forwards',
          }}
        >
          {/* Horizontal glitch bars */}
          {[15, 35, 55, 72, 88].map((pct, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: `${pct}%`,
                left: 0,
                right: 0,
                height: `${2 + (i % 3)}%`,
                backgroundColor: i % 2 === 0 ? 'rgba(176,76,58,0.25)' : 'rgba(209,205,188,0.15)',
                transform: `translateX(${(i % 2 === 0 ? 1 : -1) * (8 + i * 3)}px)`,
                animation: `airlock-glitch-bar-${i % 3} 0.38s steps(2) forwards`,
              }}
            />
          ))}

          {/* Chromatic aberration overlay — red channel */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(176,76,58,0.08)',
              transform: 'translateX(4px)',
              mixBlendMode: 'screen',
            }}
          />
          {/* Chromatic aberration overlay — cyan channel */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(80,160,180,0.06)',
              transform: 'translateX(-4px)',
              mixBlendMode: 'screen',
            }}
          />
        </div>
      )}

      {/* Electrical flicker vignette */}
      {(phase === 'glitch' || phase === 'fade') && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)',
            opacity: phase === 'fade' ? 0 : 1,
            transition: phase === 'fade' ? 'opacity 0.6s ease' : 'none',
          }}
        />
      )}

      {/* Scanline overlay during flash */}
      {phase !== 'fade' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 3px)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
};
