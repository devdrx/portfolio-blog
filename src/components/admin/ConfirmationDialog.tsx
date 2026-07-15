import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Sound } from '../SoundController';

interface ConfirmationDialogProps {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  title = 'SYSTEM WARNING // CONFIRM ACTION',
  message,
  confirmLabel = 'CONFIRM',
  cancelLabel = 'CANCEL',
  onConfirm,
  onCancel
}) => {
  const handleConfirm = () => {
    Sound.playChime();
    onConfirm();
  };

  const handleCancel = () => {
    Sound.playHover();
    onCancel();
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--nier-bg-overlay)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        backdropFilter: 'blur(1px)'
      }}
    >
      <div 
        className="nier-panel" 
        style={{
          width: '420px',
          padding: '24px',
          border: '2px solid var(--nier-accent)',
          backgroundColor: 'var(--nier-bg)',
          boxShadow: '6px 6px 0px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}
      >
        {/* Header warnings */}
        <h3 
          style={{
            fontSize: '14px',
            color: 'var(--nier-accent)',
            fontFamily: 'var(--font-mono)',
            margin: 0,
            borderBottom: '1px solid var(--nier-accent)',
            paddingBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <AlertCircle size={16} /> [ {title.toUpperCase()} ]
        </h3>

        {/* Message body */}
        <p 
          style={{
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--nier-text)',
            lineHeight: '1.6',
            margin: '0 0 10px 0'
          }}
        >
          {message.toUpperCase()}
        </p>

        {/* Actions buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button 
            className="nier-btn small" 
            style={{
              padding: '4px 12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--nier-accent)',
              borderColor: 'var(--nier-accent)'
            }}
            onClick={handleConfirm}
          >
            [ {confirmLabel.toUpperCase()} ]
          </button>
          
          <button 
            className="nier-btn small" 
            style={{
              padding: '4px 12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px'
            }}
            onClick={handleCancel}
          >
            [ {cancelLabel.toUpperCase()} ]
          </button>
        </div>
      </div>
    </div>
  );
};
export default ConfirmationDialog;
