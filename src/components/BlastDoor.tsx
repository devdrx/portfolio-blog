//BlastDoor.tsx

import React from 'react';

interface BlastDoorProps {
  side: 'left' | 'right';
  state: 'open' | 'closing' | 'closed' | 'opening';
}

// Reusable recessed panel with depth shadow
const RecessedPanel: React.FC<{
  width?: string;
  height?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ width = '100%', height = '60px', style, children }) => (
  <div
    style={{
      width,
      height,
      border: '1px solid rgba(0,0,0,0.35)',
      backgroundColor: 'rgba(0,0,0,0.08)',
      boxShadow: 'inset 2px 2px 6px rgba(0,0,0,0.35), inset -1px -1px 3px rgba(255,255,255,0.04)',
      position: 'relative',
      ...style,
    }}
  >
    {/* Corner accent brackets */}
    <div style={{ position: 'absolute', top: 3, left: 3, width: 8, height: 8, borderTop: '2px solid rgba(0,0,0,0.4)', borderLeft: '2px solid rgba(0,0,0,0.4)' }} />
    <div style={{ position: 'absolute', top: 3, right: 3, width: 8, height: 8, borderTop: '2px solid rgba(0,0,0,0.4)', borderRight: '2px solid rgba(0,0,0,0.4)' }} />
    <div style={{ position: 'absolute', bottom: 3, left: 3, width: 8, height: 8, borderBottom: '2px solid rgba(0,0,0,0.4)', borderLeft: '2px solid rgba(0,0,0,0.4)' }} />
    <div style={{ position: 'absolute', bottom: 3, right: 3, width: 8, height: 8, borderBottom: '2px solid rgba(0,0,0,0.4)', borderRight: '2px solid rgba(0,0,0,0.4)' }} />
    {children}
  </div>
);

// Ventilation slot strip
const VentSlots: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px 12px' }}>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        style={{
          height: '4px',
          backgroundColor: 'rgba(0,0,0,0.4)',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.6)',
          borderRadius: '1px',
        }}
      />
    ))}
  </div>
);

// Panel groove line
const GrooveLine: React.FC<{ horizontal?: boolean; style?: React.CSSProperties }> = ({
  horizontal = true,
  style,
}) => (
  <div
    style={{
      ...(horizontal
        ? { height: '1px', width: '100%' }
        : { width: '1px', height: '100%' }),
      backgroundColor: 'rgba(0,0,0,0.3)',
      boxShadow: horizontal
        ? '0 1px 0 rgba(255,255,255,0.04)'
        : '1px 0 0 rgba(255,255,255,0.04)',
      ...style,
    }}
  />
);

// Warning / Identification label
const Label: React.FC<{ text: string; size?: string; muted?: boolean; accent?: boolean }> = ({
  text,
  size = '9px',
  muted = false,
  accent = false,
}) => (
  <span
    style={{
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: size,
      letterSpacing: '0.12em',
      color: accent ? '#b04c3a' : muted ? 'rgba(78,75,66,0.45)' : 'rgba(78,75,66,0.65)',
      userSelect: 'none',
    }}
  >
    {text}
  </span>
);

// Hazard stripe bar (diagonal amber/black)
const HazardStripe: React.FC<{ height?: string; style?: React.CSSProperties }> = ({
  height = '28px',
  style,
}) => (
  <div
    style={{
      width: '100%',
      height,
      background:
        'repeating-linear-gradient(45deg, #1a1815 0px, #1a1815 10px, #c49a2a 10px, #c49a2a 20px)',
      opacity: 0.7,
      ...style,
    }}
  />
);

// Small status LED indicator
const StatusLED: React.FC<{ color?: string }> = ({ color = '#b04c3a' }) => (
  <div
    style={{
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      backgroundColor: color,
      boxShadow: `0 0 4px ${color}80`,
      flexShrink: 0,
    }}
  />
);

export const BlastDoor: React.FC<BlastDoorProps> = ({ side, state }) => {
  const isLeft = side === 'left';

  // Translation X values based on state
  const translateX =
    state === 'open'
      ? isLeft ? '-100%' : '100%'
      : state === 'closing'
      ? isLeft ? '-8%' : '8%'   // starts off-screen
      : state === 'opening'
      ? isLeft ? '-100%' : '100%'
      : '0%';  // closed

  const transition =
    state === 'closing'
      ? 'transform 1.1s cubic-bezier(0.16, 1, 0.3, 1)'    // heavy inertia, overshoot-settle
      : state === 'opening'
      ? 'transform 1.5s cubic-bezier(0.7, 0, 0.84, 0)'    // heavier retraction
      : 'none';

  // Door base color — warm industrial beige-grey
  const doorColor = '#b8b4a2';
  const doorShade = '#a8a495';
  const doorDark  = '#8c8878';

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        [isLeft ? 'left' : 'right']: 0,
        width: '50%',
        backgroundColor: doorColor,
        transform: `translateX(${translateX})`,
        transition,
        willChange: 'transform',
        zIndex: 500,
        overflow: 'hidden',
        // Deep edge shadow toward center seam
        boxShadow: isLeft
          ? 'inset -8px 0 20px rgba(0,0,0,0.35), inset -2px 0 4px rgba(0,0,0,0.2)'
          : 'inset 8px 0 20px rgba(0,0,0,0.35), inset 2px 0 4px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >

      {/* ─── TOP HAZARD BAR ─────────────────────────────────────── */}
      <HazardStripe height="32px" />

      {/* STAND CLEAR text */}
      <div
        style={{
          padding: '8px 20px 6px',
          display: 'flex',
          justifyContent: isLeft ? 'flex-end' : 'flex-start',
          borderBottom: `1px solid ${doorDark}`,
        }}
      >
        <span
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '18px',
            fontWeight: 'bold',
            letterSpacing: '0.3em',
            color: '#6a1a14',
            textShadow: '1px 1px 0 rgba(0,0,0,0.3)',
            userSelect: 'none',
          }}
        >
          {isLeft ? 'STAND' : 'CLEAR'}
        </span>
      </div>

      {/* ─── MAIN BODY ──────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          position: 'relative',
        }}
      >

        {/* Outer frame groove */}
        <div
          style={{
            position: 'absolute',
            inset: 8,
            border: `1px solid ${doorDark}`,
            pointerEvents: 'none',
          }}
        />

        {/* ── Top small panels row ── */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
          <RecessedPanel width="45%" height="70px">
            <VentSlots count={4} />
          </RecessedPanel>

          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            {/* Identification badge */}
            <RecessedPanel height="28px" style={{ display: 'flex', alignItems: 'center', padding: '0 10px', gap: 6 }}>
              <StatusLED color="#d4a54a" />
              <Label text="PRESSURE: OK" size="9px" />
            </RecessedPanel>
            <RecessedPanel height="28px" style={{ display: 'flex', alignItems: 'center', padding: '0 10px', gap: 6 }}>
              <StatusLED color="#b04c3a" />
              <Label text="LOCK: ACTIVE" size="9px" />
            </RecessedPanel>
          </div>
        </div>

        {/* Panel groove separator */}
        <GrooveLine />

        {/* ── Large central recessed panel ── */}
        <RecessedPanel
          height="180px"
          style={{
            backgroundColor: `${doorShade}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '14px 16px',
          }}
        >
          {/* Top label row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <Label text="YoRHa OS" size="10px" accent />
              <Label text={`UNIT: C${isLeft ? '5' : '6'}-0${isLeft ? '2' : '3'}`} size="16px" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-end' }}>
              <Label text={isLeft ? 'A DECK' : 'B DECK'} size="9px" muted />
              <Label text="LEVEL 3" size="9px" muted />
            </div>
          </div>

          {/* Horizontal ribs through the panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <GrooveLine />
            <GrooveLine />
          </div>

          {/* Bottom decal row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div
              style={{
                background: 'repeating-linear-gradient(45deg, #1a1815 0px, #1a1815 5px, #c49a2a 5px, #c49a2a 10px)',
                width: '40px',
                height: '12px',
                opacity: 0.75,
              }}
            />
            <Label text={`SN: YRH-0${isLeft ? '1' : '2'}-${isLeft ? '4471' : '8823'}`} size="8px" muted />
            {/* Warning triangle decal */}
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderBottom: '14px solid rgba(180,60,40,0.7)',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '5px',
                  left: '-3px',
                  fontFamily: 'monospace',
                  fontSize: '7px',
                  color: '#c8c4b4',
                  fontWeight: 'bold',
                }}
              >
                !
              </div>
            </div>
          </div>
        </RecessedPanel>

        {/* ── Handle/grip indentations ── */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: isLeft ? 'flex-end' : 'flex-start' }}>
          {[0, 1].map((i) => (
            <div
              key={i}
              style={{
                width: '50px',
                height: '20px',
                backgroundColor: doorDark,
                border: `1px solid rgba(0,0,0,0.4)`,
                boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.5), inset 0 -1px 2px rgba(255,255,255,0.05)',
                borderRadius: '2px',
              }}
            />
          ))}
        </div>

        {/* Panel groove separator */}
        <GrooveLine />

        {/* ── Lower panel with rivet details ── */}
        <RecessedPanel height="80px" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', padding: '0 12px' }}>
            {/* Rivet dots */}
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: doorDark,
                  border: '1px solid rgba(0,0,0,0.4)',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.06)',
                }}
              />
            ))}
          </div>
          <GrooveLine style={{ margin: '0 12px', width: 'auto' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 12px' }}>
            <Label text={`CAUTION  ${isLeft ? 'CLASS-6' : 'CLASS-4'}`} size="8px" muted />
            <Label text="AUTHORIZED ACCESS ONLY" size="8px" accent />
          </div>
        </RecessedPanel>

        {/* Vertical side groove (inset from inner edge toward center) */}
        <GrooveLine
          horizontal={false}
          style={{
            position: 'absolute',
            top: '8px',
            bottom: '8px',
            [isLeft ? 'right' : 'left']: '16px',
            height: 'auto',
          }}
        />
      </div>

      {/* ─── BOTTOM HAZARD BAR ──────────────────────────────────── */}
      <div style={{ marginTop: 'auto' }}>
        <GrooveLine />
        <HazardStripe height="24px" style={{ opacity: 0.5 }} />
      </div>

      {/* ─── EDGE SHADOW toward center seam ─────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          [isLeft ? 'right' : 'left']: 0,
          width: '40px',
          background: isLeft
            ? 'linear-gradient(to right, transparent, rgba(0,0,0,0.3))'
            : 'linear-gradient(to left, transparent, rgba(0,0,0,0.3))',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};
