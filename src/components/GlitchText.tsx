import React, { useEffect, useState } from 'react';

interface GlitchTextProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
}

const GLITCH_CHARS = 'XΔΦΩΨ01██▓▒░';

export const GlitchText: React.FC<GlitchTextProps> = ({ 
  text, 
  speed = 40, 
  delay = 0, 
  className = '' 
}) => {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    let startTimeout = setTimeout(() => {
      let currentIdx = 0;
      let interval = setInterval(() => {
        if (currentIdx <= text.length) {
          // Sometimes add a glitch character at the end
          if (currentIdx < text.length && Math.random() < 0.15) {
            const glitchChar = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
            setDisplayText(text.slice(0, currentIdx) + glitchChar);
          } else {
            setDisplayText(text.slice(0, currentIdx));
            currentIdx++;
          }
        } else {
          clearInterval(interval);
        }
      }, speed);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [text, speed, delay]);

  return <span className={className}>{displayText}</span>;
};
