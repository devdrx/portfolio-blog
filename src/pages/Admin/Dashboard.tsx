import React, { useEffect, useState } from 'react';
import { authService } from '../../services/auth';
import { Sound } from '../../components/SoundController';
import { 
  FileText, 
  FolderGit, 
  HardDrive, 
  Activity, 
  ShieldCheck, 
  PlusSquare, 
  FolderOpen 
} from 'lucide-react';

interface Stats {
  postsCount: number;
  draftsCount: number;
  projectsCount: number;
  mediaCount: number;
  mediaSizeKB: number;
  health: string;
  lastBackup: string;
}

interface LogEntry {
  timestamp: string;
  module: string;
  message: string;
  isAlert: boolean;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const data = await authService.getStats();
        setStats(data);

        const res = await fetch('/api/logs');
        if (res.ok) {
          const logsData = await res.json();
          setLogs(logsData);
        }
      } catch (err) {
        console.error('Failed loading dashboard metrics or logs:', err);
      }
    };
    loadDashboardData();
  }, []);

  const handleQuickAction = (hash: string) => {
    Sound.playClick();
    window.location.hash = hash;
  };

  if (!stats) {
    return (
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--nier-text-muted)', textAlign: 'center', marginTop: '50px' }}>
        LOADING SYSTEM METRICS...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Welcome header info */}
      <div 
        className="nier-panel" 
        style={{ 
          padding: '20px 24px', 
          backgroundColor: 'var(--nier-bg-alt)', 
          borderLeft: '4px solid var(--nier-accent)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <h2 style={{ fontSize: '20px', fontFamily: 'var(--font-mono)', margin: 0, fontWeight: '500' }}>
            YoRHa // TACTICAL ADMINISTRATION CONSOLE
          </h2>
          <p style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--nier-text-muted)', marginTop: '4px' }}>
            SYSTEM SECURE // AWAITING OPERATOR INSTRUCTIONS // MAINT_SECTOR_05
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#5b8a61', fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 'bold' }}>
          <ShieldCheck size={14} /> SECURE_LINK
        </div>
      </div>

      {/* Grid Stats panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        
        <div className="nier-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--nier-text-muted)' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>PUBLISHED LOGS</span>
            <FileText size={14} />
          </div>
          <span style={{ fontSize: '28px', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{stats.postsCount}</span>
          <span style={{ fontSize: '10px', color: 'var(--nier-text-muted)', fontFamily: 'var(--font-mono)' }}>STATUS: COMMITTED</span>
        </div>

        <div className="nier-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--nier-text-muted)' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>UNCOMMITTED DRAFTS</span>
            <FileText size={14} style={{ color: 'var(--nier-accent)' }} />
          </div>
          <span style={{ fontSize: '28px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: stats.draftsCount > 0 ? 'var(--nier-accent)' : 'inherit' }}>{stats.draftsCount}</span>
          <span style={{ fontSize: '10px', color: 'var(--nier-text-muted)', fontFamily: 'var(--font-mono)' }}>STATUS: AWAITING SYNC</span>
        </div>

        <div className="nier-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--nier-text-muted)' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>PROJECT REVISIONS</span>
            <FolderGit size={14} />
          </div>
          <span style={{ fontSize: '28px', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{stats.projectsCount}</span>
          <span style={{ fontSize: '10px', color: 'var(--nier-text-muted)', fontFamily: 'var(--font-mono)' }}>DEPLOYMENTS: DETECTED</span>
        </div>

        <div className="nier-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--nier-text-muted)' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>MEDIA BANK SIZE</span>
            <HardDrive size={14} />
          </div>
          <span style={{ fontSize: '28px', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{stats.mediaSizeKB} KB</span>
          <span style={{ fontSize: '10px', color: 'var(--nier-text-muted)', fontFamily: 'var(--font-mono)' }}>ASSET TOTAL: {stats.mediaCount}</span>
        </div>

      </div>

      {/* Main split sections: Actions & Logs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '30px' }}>
        
        {/* Left Side: System Details & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Quick Actions Panel */}
          <div className="nier-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ fontSize: '13px', borderBottom: '1px solid var(--nier-border-muted)', paddingBottom: '6px' }}>
              QUICK_ACTIONS
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                className="nier-btn" 
                onClick={() => handleQuickAction('#/admin/posts')}
                style={{ width: '100%', justifyContent: 'flex-start', gap: '10px' }}
              >
                <PlusSquare size={14} /> [ CREATE ARCHIVE RECORD ]
              </button>
              <button 
                className="nier-btn" 
                onClick={() => handleQuickAction('#/admin/projects')}
                style={{ width: '100%', justifyContent: 'flex-start', gap: '10px' }}
              >
                <PlusSquare size={14} /> [ COMPOSE NEW PROJECT CARD ]
              </button>
              <button 
                className="nier-btn" 
                onClick={() => handleQuickAction('#/admin/media')}
                style={{ width: '100%', justifyContent: 'flex-start', gap: '10px' }}
              >
                <FolderOpen size={14} /> [ LAUNCH MEDIA UPLOADER ]
              </button>
            </div>
          </div>

          {/* System Health details */}
          <div className="nier-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '13px', borderBottom: '1px solid var(--nier-border-muted)', paddingBottom: '6px' }}>
              CORE_DIAGNOSTICS
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>DAEMON HEALTH:</span>
                <span style={{ color: stats.health === 'OPTIMAL' ? 'inherit' : 'var(--nier-accent)', fontWeight: 'bold' }}>{stats.health}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>LAST DATABASE BACKUP:</span>
                <span>{stats.lastBackup}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                <span>ACTIVE MEMORY BLOCK STATUS:</span>
                <div style={{ height: '5px', backgroundColor: 'rgba(0,0,0,0.06)', border: '1px solid var(--nier-border-muted)' }}>
                  <div style={{ width: '38%', height: '100%', backgroundColor: 'var(--nier-text)' }} />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Recent Activity log streams */}
        <div className="nier-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '350px' }}>
          <h3 style={{ fontSize: '13px', borderBottom: '1px solid var(--nier-border-muted)', paddingBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={14} /> RECENT_DAEMON_ACTIVITIES
          </h3>

          <div 
            style={{ 
              flex: 1, 
              overflowY: 'auto', 
              fontFamily: 'var(--font-mono)', 
              fontSize: '11px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              paddingRight: '6px'
            }}
          >
            {logs.length > 0 ? logs.map((log, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  color: log.isAlert ? 'var(--nier-accent)' : 'inherit',
                  padding: '4px',
                  backgroundColor: log.isAlert ? 'var(--nier-accent-dim)' : 'transparent',
                  borderLeft: log.isAlert ? '2px solid var(--nier-accent)' : '2px solid transparent'
                }}
              >
                <span style={{ color: 'var(--nier-text-muted)' }}>[{log.timestamp}]</span>
                <span style={{ fontWeight: 'bold' }}>[{log.module}]</span>
                <span>{log.message}</span>
              </div>
            )) : (
              <p style={{ fontStyle: 'italic', color: 'var(--nier-text-muted)', textAlign: 'center', marginTop: '30px' }}>
                NO RECENT LOG TRANSACTIONS IN BUFFER
              </p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
export default Dashboard;
