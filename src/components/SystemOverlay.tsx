import React, { useEffect, useState } from 'react';

interface SystemOverlayProps {
  phase: 'hidden' | 'sealed' | 'verifying' | 'granted' | 'fading';
}

const LINES = [
  { key: 'sep1',     text: '────────────────────────────────────' },
  { key: 'os',       text: 'YoRHa OS  //  TACTICAL SUPPORT UNIT' },
  { key: 'sep2',     text: '────────────────────────────────────' },
  { key: 'sealed',   text: 'AIRLOCK SEALED' },
  { key: 'verify',   text: 'VERIFYING IDENTITY ...' },
  { key: 'access',   text: 'ACCESS GRANTED' },
  { key: 'sep3',     text: '────────────────────────────────────' },
];

export const SystemOverlay: React.FC<SystemOverlayProps> = ({ phase }) => {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);

  useEffect(() => {
    if (phase === 'hidden' || phase === 'fading') {
      setVisibleLines([]);
      return;
    }

    // Determine which lines to show based on phase
    const toShow =
      phase === 'sealed'
        ? ['sep1', 'os', 'sep2', 'sealed']
        : phase === 'verifying'
        ? ['sep1', 'os', 'sep2', 'sealed', 'verify']
        : ['sep1', 'os', 'sep2', 'sealed', 'verify', 'access', 'sep3'];

    // Display instantly for maximum crispness and readability
    setVisibleLines(toShow);
  }, [phase]);

  const isVisible = phase !== 'hidden';
  const isFading = phase === 'fading';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 600,
        pointerEvents: 'none',
        opacity: isVisible && !isFading ? 1 : 0,
        transition: isFading ? 'opacity 0.15s ease' : 'none',
      }}
    >
      <div
        style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '13px',
          letterSpacing: '0.12em',
          color: '#d1cdbc',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          textShadow: '0 0 12px rgba(209,205,188,0.5)',
          padding: '24px 36px',
          border: '1px solid rgba(209,205,188,0.2)',
          backgroundColor: 'rgba(25,24,21,0.72)',
          backdropFilter: 'blur(2px)',
          minWidth: '380px',
        }}
      >
        {LINES.map((line) => {
          const isShown = visibleLines.includes(line.key);
          const isAccess = line.key === 'access';
          return (
            <div
              key={line.key}
              style={{
                opacity: isShown ? 1 : 0,
                color: isAccess ? '#7ec88a' : line.key.startsWith('sep') ? 'rgba(209,205,188,0.35)' : '#d1cdbc',
                fontWeight: isAccess ? 'bold' : 'normal',
                letterSpacing: isAccess ? '0.25em' : '0.12em',
              }}
            >
              {isShown && line.text}
            </div>
          );
        })}

        {/* Blinking cursor */}
        {phase === 'verifying' && (
          <div style={{ animation: 'airlock-cursor-blink 0.6s step-end infinite', color: '#d1cdbc' }}>
            _
          </div>
        )}
      </div>
    </div>
  );
};
