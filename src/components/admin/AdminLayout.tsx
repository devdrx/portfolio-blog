import React, { useEffect, useState } from 'react';
import { authService } from '../../services/auth';
import { Sound } from '../SoundController';
import { 
  LayoutDashboard, 
  BookOpen, 
  FolderGit, 
  Image, 
  Settings, 
  Terminal, 
  LogOut, 
  Clock,
  House,
  Menu,
  X,
  Film
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sessionTime, setSessionTime] = useState(authService.getSessionExpiry());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/admin');

  // Track hash changes directly — reading window.location.hash only at render
  // time meant sidebar highlighting relied on an unrelated re-render (the
  // session timer) happening to fire after every navigation.
  useEffect(() => {
    const handleHashChange = () => setCurrentHash(window.location.hash || '#/admin');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const left = authService.getSessionExpiry();
      setSessionTime(left);
      if (left <= 0) {
        clearInterval(timer);
        handleLogout(true);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async (auto = false) => {
    if (!auto) Sound.playClick();
    else Sound.playWarning();
    
    await authService.logout();
    window.location.hash = '#/admin/login';
  };

  const handleExitToPublic = () => {
    Sound.playClick();
    authService.logSystemAction('SYS_ACCESS', 'Exited admin console to public view.');
    window.location.hash = '#home';
  };

  const handleNav = (hash: string) => {
    Sound.playClick();
    setIsSidebarOpen(false);
    window.location.hash = hash;
  };

  const menuItems = [
    { label: 'DASHBOARD', hash: '#/admin', icon: LayoutDashboard },
    { label: 'POSTS ARCHIVE', hash: '#/admin/posts', icon: BookOpen },
    { label: 'PROJECT RECORDS', hash: '#/admin/projects', icon: FolderGit },
    { label: 'OTAKU RECORDS', hash: '#/admin/otaku', icon: Film },
    { label: 'MEDIA VAULT', hash: '#/admin/media', icon: Image },
    { label: 'SYSTEM CONFIG', hash: '#/admin/settings', icon: Settings },
    { label: 'DIAGNOSTIC LOGS', hash: '#/admin/logs', icon: Terminal },
  ];

  // Helper formatting for timers
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="admin-shell-container">
      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => { Sound.playClick(); setIsSidebarOpen(false); }}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(2px)',
            zIndex: 99
          }}
        />
      )}

      {/* Sidebar Nav */}
      <div className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        {/* Console headers */}
        <div 
          style={{
            padding: '24px 20px',
            borderBottom: '2px solid var(--nier-border)',
            fontFamily: 'var(--font-mono)'
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--nier-accent)', fontWeight: 'bold' }}>
            YORHA // MAINTENANCE
          </div>
          <h2 style={{ fontSize: '18px', margin: '4px 0 0 0', fontWeight: '500' }}>
            OS_CONSOLE
          </h2>
        </div>

        {/* Menu selections */}
        <div style={{ flex: 1, padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {menuItems.map(item => {
            const isActive = currentHash === item.hash;
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => handleNav(item.hash)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '10px 20px',
                  background: isActive ? 'var(--nier-accent-dim)' : 'transparent',
                  border: 'none',
                  borderLeft: isActive ? '4px solid var(--nier-accent)' : '4px solid transparent',
                  color: isActive ? 'var(--nier-accent)' : 'var(--nier-text)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  fontWeight: isActive ? 'bold' : 'normal',
                  letterSpacing: '0.05em',
                  transition: 'all 0.15s ease'
                }}
                className="glitch-hover"
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Top-level system status and session timer */}
        <div 
          style={{
            padding: '20px',
            borderTop: '1px solid var(--nier-border-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--nier-text-muted)' }}>
            <Clock size={12} />
            <span>SESSION TIME: {formatTime(sessionTime)}</span>
          </div>

          {/* Exit to public site */}
          <button
            onClick={handleExitToPublic}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '8px',
              backgroundColor: 'transparent',
              border: '1px solid var(--nier-border)',
              color: 'var(--nier-text-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              marginBottom: '6px',
            }}
          >
            <House size={12} /> [ EXIT TO PUBLIC ]
          </button>

          <button
            onClick={() => handleLogout(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '8px',
              backgroundColor: 'transparent',
              border: '1px solid var(--nier-accent)',
              color: 'var(--nier-accent)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <LogOut size={12} /> [ LOCK CONSOLE ]
          </button>
        </div>
      </div>

      {/* Main Content Areas */}
      <div className="admin-main-area">
        {/* Top status bar */}
        <div 
          style={{
            height: '45px',
            borderBottom: '1px solid var(--nier-border-muted)',
            padding: '0 30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--nier-text-muted)',
            backgroundColor: 'rgba(0,0,0,0.01)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Mobile Sidebar Toggle Hamburger */}
            <button 
              className="admin-mobile-toggle"
              onClick={() => { Sound.playClick(); setIsSidebarOpen(!isSidebarOpen); }}
              style={{
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--nier-text)',
                padding: '4px'
              }}
            >
              {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <span>PRIVILEGE_LEVEL: LEVEL_01_ADMINISTRATOR // CONSOLE: ONLINE</span>
          </div>
          <span className="admin-mobile-hide">SYSTEM_HEALTH: OPTIMAL</span>
        </div>

        {/* Panel Main Area */}
        <div className="admin-panel-padding" style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
};
export default AdminLayout;
