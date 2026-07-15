import React from 'react';

interface LockMechanismProps {
  state: 'hidden' | 'engaging' | 'locked' | 'unlocking';
  doorState: 'open' | 'closing' | 'closed' | 'opening';
}

// One bolt arm extending from either side of center seam
const Bolt: React.FC<{ side: 'left' | 'right'; state: string; index: number }> = ({ side, state, index }) => {
  const isLeft = side === 'left';
  const engaged = state === 'locked' || state === 'engaging';
  const unlocking = state === 'unlocking';

  const extendAmount = engaged ? '0px' : isLeft ? '-32px' : '32px';
  const unlockAmount = isLeft ? '-32px' : '32px';

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        flexDirection: isLeft ? 'row' : 'row-reverse',
        gap: '2px',
        opacity: state === 'unlocking' ? 0 : 1,
        transition: 'opacity 0.3s ease',
      }}
    >
      {/* Bolt shaft */}
      <div
        style={{
          width: '28px',
          height: '8px',
          backgroundColor: '#4e4b42',
          border: '1px solid #7f7c6e',
          transform: `translateX(${unlocking ? unlockAmount : extendAmount})`,
          transition: unlocking
            ? 'transform 0.3s cubic-bezier(0.55, 0, 1, 0.45)'
            : engaged
            ? `transform 0.25s cubic-bezier(0.16, 1, 0.3, 1) ${index * 60}ms`
            : 'transform 0.2s ease',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
          position: 'relative',
        }}
      >
        {/* Bolt grip ridges */}
        {[4, 10, 16].map((x) => (
          <div
            key={x}
            style={{
              position: 'absolute',
              left: x,
              top: 1,
              bottom: 1,
              width: '2px',
              backgroundColor: 'rgba(0,0,0,0.3)',
            }}
          />
        ))}
      </div>

      {/* Bolt socket housing */}
      <div
        style={{
          width: '14px',
          height: '14px',
          border: '2px solid #7f7c6e',
          backgroundColor: '#4e4b42',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            width: '6px',
            height: '6px',
            backgroundColor: engaged && !unlocking ? '#7ec88a' : unlocking ? '#d1cdbc' : '#b04c3a',
            borderRadius: '50%',
            boxShadow: engaged && !unlocking ? '0 0 6px rgba(126,200,138,0.8)' : 'none',
            transition: 'background-color 0.15s ease, box-shadow 0.15s ease',
            animation: state === 'engaging' ? `airlock-led-blink 0.4s step-end ${index * 80}ms 3` : 'none',
          }}
        />
      </div>
    </div>
  );
};

export const LockMechanism: React.FC<LockMechanismProps> = ({ state, doorState }) => {
  const getDoorTranslateX = (side: 'left' | 'right') => {
    const isLeft = side === 'left';
    return doorState === 'open'
      ? isLeft ? '-50vw' : '50vw'
      : doorState === 'closing'
      ? isLeft ? '-4vw' : '4vw'
      : doorState === 'opening'
      ? isLeft ? '-50vw' : '50vw'
      : '0';
  };

  const getDoorTransition = () => {
    return doorState === 'closing'
      ? 'transform 1.1s cubic-bezier(0.16, 1, 0.3, 1)'
      : doorState === 'opening'
      ? 'transform 1.5s cubic-bezier(0.7, 0, 0.84, 0)'
      : 'none';
  };

  const leftTrans = getDoorTranslateX('left');
  const rightTrans = getDoorTranslateX('right');
  const trans = getDoorTransition();

  // Opacity: hide when doors are fully open/idle, or during unlocking fade-out
  const isFadingOut = state === 'unlocking' || doorState === 'open';
  const opacity = isFadingOut ? 0 : 1;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        height: '100%',
        width: '80px',
        zIndex: 520,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '80px 0',
        pointerEvents: 'none',
        opacity: opacity,
        transition: 'opacity 0.4s ease 0.1s',
      }}
    >
      {/* 4 bolt pairs at vertical intervals */}
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            animation: state === 'engaging' ? `airlock-bolt-vibrate 0.12s ease ${i * 40 + 200}ms 4` : 'none',
          }}
        >
          {/* Seam indicator light above bolt pair — only visible when doors are closed and locks engage */}
          <div
            style={{
              width: '4px',
              height: '4px',
              backgroundColor:
                state === 'locked' ? '#7ec88a' :
                state === 'engaging' ? '#d4a54a' :
                state === 'unlocking' ? '#d1cdbc' : '#7f7c6e',
              borderRadius: '50%',
              transition: 'background-color 0.2s ease, opacity 0.3s ease',
              boxShadow: state === 'locked' ? '0 0 4px rgba(126,200,138,0.6)' : 'none',
              animation: state === 'engaging' ? `airlock-led-blink 0.3s step-end ${i * 60}ms 4` : 'none',
              marginBottom: '4px',
              opacity: (state === 'unlocking' || state === 'hidden') ? 0 : 1,
            }}
          />

          {/* Left bolt wrapper — translates in sync with the left door (using viewport width coordinates) */}
          <div
            style={{
              transform: `translateX(${leftTrans})`,
              transition: trans,
              willChange: 'transform',
            }}
          >
            <Bolt side="left" state={state} index={i} />
          </div>

          {/* Right bolt wrapper — translates in sync with the right door (using viewport width coordinates) */}
          <div
            style={{
              transform: `translateX(${rightTrans})`,
              transition: trans,
              willChange: 'transform',
            }}
          >
            <Bolt side="right" state={state} index={i} />
          </div>
        </div>
      ))}

      {/* Center seam line — only visible when doors are fully closed */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '50%',
          width: '2px',
          backgroundColor: '#191815',
          transform: 'translateX(-50%)',
          boxShadow: state === 'locked'
            ? '0 0 8px rgba(126,200,138,0.3)'
            : '0 0 4px rgba(0,0,0,0.8)',
          transition: 'box-shadow 0.4s ease, opacity 0.3s ease',
          zIndex: -1,
          opacity: (state === 'unlocking' || state === 'hidden') ? 0 : 1,
        }}
      />
    </div>
  );
};
