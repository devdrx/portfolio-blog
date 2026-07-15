import React, { useEffect, useState } from 'react';
import { authService } from '../../services/auth';
import { Sound } from '../../components/SoundController';
import { Toast } from '../../components/admin/Toast';
import { ConfirmationDialog } from '../../components/admin/ConfirmationDialog';
import { 
  Settings as SettingsIcon, 
  Database, 
  Trash2, 
  Download, 
  Upload, 
  Volume2, 
  Activity,
  UserSquare2,
  ShieldAlert
} from 'lucide-react';

export const Settings: React.FC = () => {
  const [localStorageKB, setLocalStorageKB] = useState(0);
  const [backupTime, setBackupTime] = useState('NEVER');
  const [toast, setToast] = useState<{ message: string; isAlert?: boolean } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [pfpUrl, setPfpUrl] = useState<string>('/pfp.png');

  // Password change states
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPass || !newPass || !confirmNewPass) return;

    if (newPass !== confirmNewPass) {
      showToastMessage('SECURITY CONFLICT: New access keys do not match.', true);
      Sound.playWarning();
      return;
    }

    if (newPass.length < 6) {
      showToastMessage('SECURITY ALIGNMENT: Access key must be at least 6 characters.', true);
      Sound.playWarning();
      return;
    }

    setPassLoading(true);
    Sound.playClick();

    const res = await authService.changePassword(currentPass, newPass);
    setPassLoading(false);

    if (res.success) {
      showToastMessage('Admin access key rotated successfully.');
      Sound.playChime();
      setCurrentPass('');
      setNewPass('');
      setConfirmNewPass('');
    } else {
      showToastMessage(res.error || 'Failed to rotate access key.', true);
      Sound.playWarning();
    }
  };

  useEffect(() => {
    computeStorageUsage();
    // Load config settings dynamically from server database
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data.pfpUrl) setPfpUrl(data.pfpUrl);
        setBackupTime(data.lastBackup || 'NEVER RECORDED');
      })
      .catch(() => {});
  }, []);

  const computeStorageUsage = () => {
    // During backend migration, we query the server stats to check database size
    fetch('/api/settings/stats')
      .then(r => r.json())
      .then(data => {
        setLocalStorageKB(data.mediaSizeKB || 0);
      })
      .catch(() => {
        setLocalStorageKB(0);
      });
  };

  const showToastMessage = (message: string, isAlert = false) => {
    setToast({ message, isAlert });
  };

  // Database actions: Export JSON from Express Server DB
  const handleExportDB = async () => {
    Sound.playClick();
    try {
      const res = await fetch('/api/system/export');
      if (!res.ok) throw new Error();
      const data = await res.json();

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `yorha_database_backup_${Date.now()}.json`;
      link.click();

      showToastMessage('Database bundle exported successfully.');
      Sound.playChime();
      authService.logSystemAction('SYS_MAINT', 'Exported database backup.');
    } catch {
      showToastMessage('Export failed: Server connection error.', true);
      Sound.playWarning();
    }
  };

  // Database actions: Import JSON into Express Server DB
  const handleImportDB = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Sound.playClick();
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        const res = await fetch('/api/system/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (!res.ok) throw new Error();

        showToastMessage('Database bundle imported and restored.');
        Sound.playChime();
        computeStorageUsage();
        authService.logSystemAction('SYS_MAINT', 'Restored database configurations from import.');
      } catch {
        Sound.playWarning();
        showToastMessage('Import failed: invalid json syntax or server error.', true);
      }
    };
    reader.readAsText(file);
  };

  // Generate backup savepoint on Express server
  const handleBackup = async () => {
    Sound.playClick();
    try {
      const res = await fetch('/api/settings/backup', { method: 'POST' });
      if (!res.ok) throw new Error();
      const settings = await res.json();
      setBackupTime(settings.lastBackup);
      showToastMessage('Backup timestamp registered.');
      Sound.playChime();
      authService.logSystemAction('SYS_MAINT', 'Created database restore checkpoint.');
    } catch {
      showToastMessage('Backup failed: Server connection error.', true);
      Sound.playWarning();
    }
  };

  // Flush and reload defaults (Factory reset server databases)
  const handleConfirmClear = async () => {
    try {
      const res = await fetch('/api/system/reset', { method: 'POST' });
      if (!res.ok) throw new Error();

      showToastMessage('Storage purged. Resetting system module cache.');
      Sound.playWarning();
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch {
      showToastMessage('Reset failed: Server connection error.', true);
      Sound.playWarning();
    }
  };

  // Audio testing
  const playTestSound = (type: string) => {
    if (type === 'click') Sound.playClick();
    if (type === 'hover') Sound.playHover();
    if (type === 'chime') Sound.playChime();
    if (type === 'warning') Sound.playWarning();
  };

  // Profile picture upload via standard binary multipart/form-data
  const handlePfpUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToastMessage('Invalid file type — only images accepted.', true);
      return;
    }
    Sound.playClick();

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/settings/pfp', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      setPfpUrl(data.pfpUrl);
      computeStorageUsage();
      showToastMessage('Profile picture updated. Changes are live on homepage.');
      Sound.playChime();
      authService.logSystemAction('SYS_CONFIG', 'Updated unit profile picture.');
    } catch {
      showToastMessage('PFP upload failed: Server connection error.', true);
      Sound.playWarning();
    }
  };

  // Reset pfp to default
  const handlePfpReset = async () => {
    Sound.playWarning();
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pfpUrl: '/pfp.png' })
      });
      if (!res.ok) throw new Error();

      setPfpUrl('/pfp.png');
      computeStorageUsage();
      showToastMessage('Profile picture reset to default (pfp.png).');
      authService.logSystemAction('SYS_CONFIG', 'Reset unit profile picture to default.');
    } catch {
      showToastMessage('Reset failed: Server connection error.', true);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--nier-border)', paddingBottom: '12px' }}>
        <h2 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <SettingsIcon size={18} /> [ SYSTEM CONFIGURATION AND CALIBRATION ]
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* Left Side: Database actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="nier-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ fontSize: '13px', borderBottom: '1px solid var(--nier-border-muted)', paddingBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={14} /> DATABASE_CONTROLLER
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>LOCAL_STORAGE CACHE SIZE:</span>
                <span>{localStorageKB} KB</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>LAST BACKUP SAVEPOINT:</span>
                <span>{backupTime}</span>
              </div>
            </div>

            <div className="nier-double-line" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="nier-btn" onClick={handleExportDB} style={{ justifyContent: 'flex-start', gap: '8px' }}>
                <Download size={14} /> [ EXPORT ARCHIVE BUNDLE ]
              </button>
              
              <button 
                className="nier-btn" 
                onClick={() => document.getElementById('import-input')?.click()}
                style={{ justifyContent: 'flex-start', gap: '8px' }}
              >
                <Upload size={14} /> [ IMPORT ARCHIVE BUNDLE ]
              </button>
              <input id="import-input" type="file" accept=".json" onChange={handleImportDB} style={{ display: 'none' }} />

              <button className="nier-btn" onClick={handleBackup} style={{ justifyContent: 'flex-start', gap: '8px' }}>
                <Database size={14} /> [ WRITE RESTORE POINT ]
              </button>

              <button 
                className="nier-btn" 
                onClick={() => { Sound.playWarning(); setConfirmClear(true); }}
                style={{ justifyContent: 'flex-start', gap: '8px', color: 'var(--nier-accent)', borderColor: 'var(--nier-accent)' }}
              >
                <Trash2 size={14} /> [ CLEAR CACHE / RESTORE TO FACTORY DEFAULTS ]
              </button>
            </div>
          </div>

          {/* Access Key Rotation Panel */}
          <div className="nier-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ fontSize: '13px', borderBottom: '1px solid var(--nier-border-muted)', paddingBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={14} /> ACCESS_KEY_ROTATION
            </h3>

            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '10px', color: 'var(--nier-text-muted)', fontFamily: 'var(--font-mono)' }}>CURRENT ACCESS KEY:</label>
                <input 
                  type="password"
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.03)',
                    border: '1px solid var(--nier-border)',
                    color: 'var(--nier-text)',
                    padding: '6px 10px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '10px', color: 'var(--nier-text-muted)', fontFamily: 'var(--font-mono)' }}>NEW ACCESS KEY (MIN 6 CHARACTERS):</label>
                <input 
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.03)',
                    border: '1px solid var(--nier-border)',
                    color: 'var(--nier-text)',
                    padding: '6px 10px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '10px', color: 'var(--nier-text-muted)', fontFamily: 'var(--font-mono)' }}>CONFIRM NEW ACCESS KEY:</label>
                <input 
                  type="password"
                  value={confirmNewPass}
                  onChange={(e) => setConfirmNewPass(e.target.value)}
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.03)',
                    border: '1px solid var(--nier-border)',
                    color: 'var(--nier-text)',
                    padding: '6px 10px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px'
                  }}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="nier-btn" 
                style={{ marginTop: '5px', justifyContent: 'center' }}
                disabled={passLoading}
              >
                {passLoading ? '[ ROTATING ACCESS KEY... ]' : '[ COMMIT KEY ROTATION ]'}
              </button>
            </form>
          </div>

        </div>

        {/* Right Side: Profile Picture + Diagnostics & Sound tests */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Profile Picture Panel */}
          <div className="nier-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ fontSize: '13px', borderBottom: '1px solid var(--nier-border-muted)', paddingBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserSquare2 size={14} /> UNIT_PROFILE_PICTURE
            </h3>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              {/* Live preview */}
              <div style={{
                width: '90px',
                height: '90px',
                border: '3px double var(--nier-border)',
                overflow: 'hidden',
                flexShrink: 0,
                position: 'relative',
              }}>
                <img
                  src={pfpUrl}
                  alt="Profile preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(0.18) contrast(1.05)' }}
                />
                {/* Scanline overlay */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(rgba(78,75,66,0.12) 50%, transparent 50%)',
                  backgroundSize: '100% 4px',
                  pointerEvents: 'none',
                }} />
              </div>

              {/* Actions */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ fontSize: '11px', color: 'var(--nier-text-muted)', fontFamily: 'var(--font-mono)', lineHeight: 1.5 }}>
                  Upload replaces the portrait on the homepage. Stored in localStorage as base64.
                </p>

                <button
                  className="nier-btn"
                  onClick={() => document.getElementById('pfp-upload-input')?.click()}
                  style={{ justifyContent: 'flex-start', gap: '8px', fontSize: '12px' }}
                >
                  <Upload size={13} /> [ UPLOAD NEW PORTRAIT ]
                </button>
                <input
                  id="pfp-upload-input"
                  type="file"
                  accept="image/*"
                  onChange={handlePfpUpload}
                  style={{ display: 'none' }}
                />

                <button
                  className="nier-btn"
                  onClick={handlePfpReset}
                  style={{ justifyContent: 'flex-start', gap: '8px', fontSize: '12px', color: 'var(--nier-text-muted)', borderColor: 'var(--nier-border-muted)' }}
                >
                  <UserSquare2 size={13} /> [ RESET TO DEFAULT ]
                </button>
              </div>
            </div>
          </div>
          
          <div className="nier-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ fontSize: '13px', borderBottom: '1px solid var(--nier-border-muted)', paddingBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Volume2 size={14} /> PROCEDURAL_AUDIO_CALIBRATION
            </h3>

            <p style={{ fontSize: '12px', color: 'var(--nier-text)', lineHeight: '1.5' }}>
              Test visual sound module configurations. Click triggers Web Audio oscillator synthetics.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button className="nier-btn small" onClick={() => playTestSound('click')}>[ TEST CLICK ]</button>
              <button className="nier-btn small" onClick={() => playTestSound('hover')}>[ TEST HOVER ]</button>
              <button className="nier-btn small" onClick={() => playTestSound('chime')}>[ TEST SUCCESS CHIME ]</button>
              <button className="nier-btn small" onClick={() => playTestSound('warning')} style={{ color: 'var(--nier-accent)', borderColor: 'var(--nier-accent)' }}>[ TEST WARNING ALARM ]</button>
            </div>
          </div>

          <div className="nier-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ fontSize: '13px', borderBottom: '1px solid var(--nier-border-muted)', paddingBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={14} /> MAINTENANCE_DAEMONS
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
              <div>&gt; AUTHENTICATION MONITOR: ACTIVE</div>
              <div>&gt; LOCAL CACHE COMPACTION DAEMON: SLEEPING</div>
              <div>&gt; SECURITY INTRUSION DAEMON: ENFORCING</div>
              <div>&gt; CRITICAL LOG CACHE ROTATION: SUCCESS</div>
            </div>
          </div>

        </div>

      </div>

      {/* Popups */}
      {confirmClear && (
        <ConfirmationDialog 
          message="WARNING: Re-initializing will flush all customized blogs, portfolio projects, and media items. Default templates will reload. Continue?"
          onConfirm={handleConfirmClear}
          onCancel={() => setConfirmClear(false)}
        />
      )}

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
export default Settings;
