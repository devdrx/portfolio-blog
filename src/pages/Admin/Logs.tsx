import React, { useEffect, useState } from 'react';
import { Sound } from '../../components/SoundController';
import { Toast } from '../../components/admin/Toast';
import { Terminal, Trash2, RotateCw } from 'lucide-react';

interface LogEntry {
  timestamp: string;
  module: string;
  message: string;
  isAlert: boolean;
}

export const Logs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [toast, setToast] = useState<{ message: string; isAlert?: boolean } | null>(null);

  useEffect(() => {
    loadLogs(true); // silent load on mount
  }, []);

  const loadLogs = async (silent = false) => {
    if (!silent) Sound.playClick();
    try {
      const res = await fetch('/api/logs');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLogs(data);
    } catch {
      setLogs([]);
    }
  };

  const handleFlushLogs = async () => {
    Sound.playWarning();
    try {
      const res = await fetch('/api/logs', { method: 'DELETE' });
      if (res.ok) {
        setLogs([]);
        setToast({ message: 'Log stacks flushed.' });
      }
    } catch {
      setToast({ message: 'Failed flushing logs from server.', isAlert: true });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header controls bar */}
      <div className="admin-header-bar">
        <h2 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Terminal size={18} /> [ SYSTEM DIAGNOSTIC TRANSMISSION LOGS ]
        </h2>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="nier-btn small" onClick={() => loadLogs(false)} style={{ gap: '4px' }}>
            <RotateCw size={12} /> [ RE-SCAN BUFFER ]
          </button>
          <button 
            className="nier-btn small" 
            style={{ color: 'var(--nier-accent)', borderColor: 'var(--nier-accent)', gap: '4px' }}
            onClick={handleFlushLogs}
          >
            <Trash2 size={12} /> [ FLUSH LOGS ]
          </button>
        </div>
      </div>

      {/* Terminal log logs output box */}
      <div 
        className="nier-panel" 
        style={{ 
          backgroundColor: 'rgba(0,0,0,0.04)', 
          padding: '20px', 
          fontFamily: 'var(--font-mono)', 
          fontSize: '12px',
          height: '520px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)'
        }}
      >
        {logs.length > 0 ? logs.map((log, idx) => (
          <div 
            key={idx} 
            style={{ 
              display: 'flex', 
              gap: '15px', 
              color: log.isAlert ? 'var(--nier-accent)' : 'inherit',
              padding: '4px 8px',
              backgroundColor: log.isAlert ? 'var(--nier-accent-dim)' : 'transparent',
              borderLeft: log.isAlert ? '3px solid var(--nier-accent)' : '3px solid transparent'
            }}
          >
            <span style={{ color: 'var(--nier-text-muted)', minWidth: '70px' }}>[{log.timestamp}]</span>
            <span style={{ fontWeight: 'bold', minWidth: '100px' }}>[{log.module}]</span>
            <span style={{ flex: 1 }}>{log.message}</span>
          </div>
        )) : (
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--nier-text-muted)', fontStyle: 'italic' }}>
            AWAITING SYSTEM TRANSACTIONS // LOGS CLEAR
          </div>
        )}
      </div>

      {toast && (
        <Toast 
          message={toast.message} 
          isAlert={toast.isAlert} 
          onClose={() => setToast(null)} 
        />
      )}

    </div>
  );
};
export default Logs;
