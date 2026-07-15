import React, { useEffect } from 'react';
import { Terminal, AlertTriangle } from 'lucide-react';

interface ToastProps {
  message: string;
  isAlert?: boolean;
  onClose: () => void;
  durationMs?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, isAlert = false, onClose, durationMs = 2500 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [onClose, durationMs]);

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '25px',
        right: '25px',
        zIndex: 99999,
        backgroundColor: 'var(--nier-bg)',
        border: `2px solid ${isAlert ? 'var(--nier-accent)' : 'var(--nier-border)'}`,
        padding: '12px 18px',
        boxShadow: '4px 4px 0px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        minWidth: '280px',
        maxWidth: '450px',
        animation: 'slideIn 0.25s cubic-bezier(0.19, 1, 0.22, 1) forwards'
      }}
    >
      <div style={{ color: isAlert ? 'var(--nier-accent)' : 'var(--nier-text)' }}>
        {isAlert ? <AlertTriangle size={16} /> : <Terminal size={16} />}
      </div>
      <div 
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: 'var(--nier-text)',
          lineHeight: '1.4',
          flex: 1
        }}
      >
        {isAlert ? '[ ALERT ]' : '[ SYSTEM OUT ]'} // {message}
      </div>
    </div>
  );
};
export default Toast;
