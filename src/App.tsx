import React, { useEffect, useState } from 'react';
import { BootScreen } from './components/BootScreen';
import { Sound } from './components/SoundController';
import { Home } from './pages/Home';
import { ArtWeeb } from './pages/ArtWeeb';
import { Blog } from './pages/Blog';
import { SystemSettings } from './pages/SystemSettings';
import { Volume2, VolumeX } from 'lucide-react';

type Tab = 'home' | 'art' | 'blog' | 'system';

export const App: React.FC = () => {
  const [booted, setBooted] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [soundMuted, setSoundMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Load configuration and start clock & hash routing
  useEffect(() => {
    // Theme load
    const savedTheme = localStorage.getItem('yorha_theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('theme-dark');
    } else {
      document.documentElement.classList.remove('theme-dark');
    }

    // Audio status
    setSoundMuted(Sound.isMuted());

    // Hash sync routing helper
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as Tab;
      if (['home', 'art', 'blog', 'system'].includes(hash)) {
        setActiveTab(hash);
      } else {
        // Default to home hash if invalid or empty
        window.location.hash = '#home';
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    
    // Initial check on mount
    if (window.location.hash) {
      handleHashChange();
    } else {
      window.location.hash = '#home';
    }

    // Telemetry clock
    const updateClock = () => {
      const now = new Date();
      const yr = now.getFullYear();
      const mo = String(now.getMonth() + 1).padStart(2, '0');
      const dy = String(now.getDate()).padStart(2, '0');
      const hr = String(now.getHours()).padStart(2, '0');
      const mi = String(now.getMinutes()).padStart(2, '0');
      const sc = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${yr}-${mo}-${dy} ${hr}:${mi}:${sc}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      clearInterval(interval);
    };
  }, []);

  // Update sound display when settings change
  const handleToggleMute = () => {
    const nextMuted = Sound.toggleMute();
    setSoundMuted(nextMuted);
    Sound.playClick();
  };

  const handleTabClick = (tab: Tab) => {
    Sound.playClick();
    window.location.hash = '#' + tab;
  };

  const handleTabHover = () => {
    Sound.playHover();
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'art':
        return <ArtWeeb />;
      case 'blog':
        return <Blog />;
      case 'system':
        return <SystemSettings />;
      case 'home':
      default:
        return <Home />;
    }
  };

  // Configure Scanlines display on load
  useEffect(() => {
    if (!booted) return;
    const savedScanlines = localStorage.getItem('yorha_scanlines_enabled');
    const scanlineEl = document.querySelector('.nier-scanlines');
    const scanlineBar = document.querySelector('.nier-scanline-bar');
    if (scanlineEl && scanlineBar) {
      if (savedScanlines === 'false') {
        (scanlineEl as HTMLElement).style.display = 'none';
        (scanlineBar as HTMLElement).style.display = 'none';
      } else {
        (scanlineEl as HTMLElement).style.display = 'block';
        (scanlineBar as HTMLElement).style.display = 'block';
      }
    }
  }, [booted]);

  if (!booted) {
    return <BootScreen onComplete={() => setBooted(true)} />;
  }

  return (
    <>
      {/* Background aesthetics overlays */}
      <div className="nier-grid-overlay" />
      <div className="nier-scanlines" />
      <div className="nier-scanline-bar" />
      <div className="nier-noise" />

      {/* Main shell */}
      <div className="app-container">
        
        {/* Horizontal Navigation Header */}
        <header 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            borderBottom: '2px solid var(--nier-border)',
            paddingBottom: '15px'
          }}
        >
          {/* Logo Brand */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '0.15em', fontFamily: 'var(--font-mono)' }} className="glitch-hover">
              YoRHa // SYSTEM_SHELL
            </span>
            <span style={{ fontSize: '10px', color: 'var(--nier-text-muted)', fontFamily: 'var(--font-mono)' }}>
              RECORDS DECRYPTION PANEL v1.0.4
            </span>
          </div>

          {/* Nav Tabs */}
          <nav style={{ display: 'flex', gap: '8px' }}>
            {(['home', 'art', 'blog', 'system'] as Tab[]).map((tab, idx) => {
              const active = activeTab === tab;
              const formattedName = `[ 0${idx + 1}_${tab.toUpperCase()} ]`;
              
              return (
                <button
                  key={tab}
                  className={`nier-btn ${active ? 'active' : ''}`}
                  onClick={() => handleTabClick(tab)}
                  onMouseEnter={handleTabHover}
                  style={{
                    fontSize: '13px',
                    padding: '6px 12px',
                    minWidth: '120px'
                  }}
                >
                  {active ? formattedName.replace('[', '').replace(']', '').trim() : formattedName}
                </button>
              );
            })}
          </nav>

          {/* Quick settings toolbar */}
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            {/* Quick volume controller */}
            <button 
              className="nier-btn small" 
              onClick={handleToggleMute} 
              onMouseEnter={handleTabHover}
              title={soundMuted ? "Unmute sounds" : "Mute sounds"}
              style={{ padding: '6px 10px' }}
            >
              {soundMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          </div>
        </header>

        {/* Dynamic sub-header line */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'var(--font-mono)', padding: '4px 0', color: 'var(--nier-text-muted)', borderBottom: '1px solid var(--nier-border-muted)' }}>
          <span>MODULE_LOCATION: localhost/portfolio-blog/{activeTab}</span>
          <span>YoRHa NETWORK STATUS: DECRYPTED</span>
        </div>

        {/* Content Body View */}
        <main style={{ flex: 1 }}>
          {renderActiveView()}
        </main>

        {/* Footer specifications */}
        <footer 
          style={{ 
            marginTop: '50px',
            borderTop: '2px solid var(--nier-border)',
            paddingTop: '15px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--nier-text-muted)'
          }}
        >
          <div style={{ display: 'flex', gap: '30px' }}>
            <span>GLORY TO MANKIND</span>
            <span>SYSTEM SECURITY: NOMINAL</span>
            <span>OS_HASH: 0x8a9cf2bc</span>
          </div>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <span>TELEMETRY_UTC: {currentTime}</span>
            <span style={{ 
              width: '6px', 
              height: '6px', 
              backgroundColor: 'var(--nier-accent)', 
              borderRadius: '50%',
              display: 'inline-block'
            }} />
          </div>
        </footer>

      </div>
    </>
  );
};

export default App;
