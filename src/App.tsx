import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BootScreen } from './components/BootScreen';
import { Sound } from './components/SoundController';
import { Volume2, VolumeX, Sun, Moon } from 'lucide-react';

// Admin layout / wrapper components imported statically
import { ProtectedRoute } from './middleware/ProtectedRoute';
import { AdminLayout } from './components/admin/AdminLayout';

// Injected during build by Vite config
declare const __COMMIT_HASH__: string;

// Lazily load route views for chunk code splitting, preloading them eagerly in the background during boot sequence
const HomePromise = import('./pages/Home').then(m => ({ default: m.Home }));
const Home = lazy(() => HomePromise);

const ArtPromise = import('./pages/ArtWeeb').then(m => ({ default: m.ArtWeeb }));
const ArtWeeb = lazy(() => ArtPromise);

const BlogPromise = import('./pages/Blog').then(m => ({ default: m.Blog }));
const Blog = lazy(() => BlogPromise);

const SystemPromise = import('./pages/SystemSettings').then(m => ({ default: m.SystemSettings }));
const SystemSettings = lazy(() => SystemPromise);

// Admin views
const Login = lazy(() => import('./pages/Admin/Login').then(m => ({ default: m.Login })));
const Dashboard = lazy(() => import('./pages/Admin/Dashboard').then(m => ({ default: m.Dashboard })));
const Posts = lazy(() => import('./pages/Admin/Posts').then(m => ({ default: m.Posts })));
const Projects = lazy(() => import('./pages/Admin/Projects').then(m => ({ default: m.Projects })));
const Media = lazy(() => import('./pages/Admin/Media').then(m => ({ default: m.Media })));
const Settings = lazy(() => import('./pages/Admin/Settings').then(m => ({ default: m.Settings })));
const Logs = lazy(() => import('./pages/Admin/Logs').then(m => ({ default: m.Logs })));

type Tab = 'home' | 'art' | 'blog' | 'system';

type AppPhase = 'boot' | 'app';

export const App: React.FC = () => {
  const [appPhase, setAppPhase] = useState<AppPhase>('boot');
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [soundMuted, setSoundMuted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);

  // Load configuration and start clock & hash routing
  useEffect(() => {
    // Theme load
    const savedTheme = localStorage.getItem('yorha_theme');
    const startDark = savedTheme === 'dark';
    if (startDark) {
      document.documentElement.classList.add('theme-dark');
    } else {
      document.documentElement.classList.remove('theme-dark');
    }
    setIsDark(startDark);

    // Audio status
    setSoundMuted(Sound.isMuted());

    // Hash sync routing helper
    const handleHashChange = () => {
      const hashString = window.location.hash;
      
      if (hashString.startsWith('#/admin')) {
        setIsAdminMode(true);
      } else {
        setIsAdminMode(false);
        const hash = hashString.replace('#', '') as Tab;
        if (['home', 'art', 'blog', 'system'].includes(hash)) {
          setActiveTab(hash);
        } else {
          // Default to home hash if invalid or empty
          window.location.hash = '#home';
        }
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

    // Global hidden keyboard triggers
    let typedSequence = '';
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape — exit admin back to public
      if (e.key === 'Escape' && window.location.hash.startsWith('#/admin')) {
        e.preventDefault();
        Sound.playClick();
        window.location.hash = '#home';
        return;
      }

      // Guard: some synthetic events have no key value
      if (!e.key) return;

      // Check Ctrl+Shift+A
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        Sound.playWarning();
        window.location.hash = '#/admin/login';
        return;
      }
      
      // Capture typed letters for sequence check
      if (e.key.length === 1) {
        typedSequence = (typedSequence + e.key.toLowerCase()).slice(-12);
        if (typedSequence === 'access yorha') {
          Sound.playWarning();
          window.location.hash = '#/admin/login';
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(interval);
    };
  }, []);

  // Update sound display when settings change
  const handleToggleMute = () => {
    const nextMuted = Sound.toggleMute();
    setSoundMuted(nextMuted);
    Sound.playClick();
  };

  const handleThemeToggle = () => {
    Sound.playClick();
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('theme-dark');
      localStorage.setItem('yorha_theme', 'dark');
    } else {
      document.documentElement.classList.remove('theme-dark');
      localStorage.setItem('yorha_theme', 'light');
    }
  };

  const handleTabClick = (tab: Tab) => {
    Sound.playClick();
    window.location.hash = '#' + tab;
  };

  const handleTabHover = () => {
    Sound.playHover();
  };

  const renderActiveView = () => {
    return (
      <Suspense fallback={<div className="loading-fallback" style={{ fontFamily: 'var(--font-mono)', color: 'var(--nier-text-muted)', fontSize: '11px', textAlign: 'center', padding: '40px' }}>&gt; LOADING MODULE DATA...</div>}>
        {(() => {
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
        })()}
      </Suspense>
    );
  };

  const renderAdminView = () => {
    const hash = window.location.hash;
    
    return (
      <Suspense fallback={<div className="loading-fallback" style={{ fontFamily: 'var(--font-mono)', color: 'var(--nier-text-muted)', fontSize: '11px', textAlign: 'center', padding: '40px' }}>&gt; LOADING SECURE MODULE...</div>}>
        {(() => {
          if (hash === '#/admin/login') {
            return <Login />;
          }

          let childPage = <Dashboard />;
          if (hash === '#/admin/posts') childPage = <Posts />;
          else if (hash === '#/admin/projects') childPage = <Projects />;
          else if (hash === '#/admin/media') childPage = <Media />;
          else if (hash === '#/admin/settings') childPage = <Settings />;
          else if (hash === '#/admin/logs') childPage = <Logs />;

          return (
            <ProtectedRoute>
              <AdminLayout>
                {childPage}
              </AdminLayout>
            </ProtectedRoute>
          );
        })()}
      </Suspense>
    );
  };

  // Configure Scanlines display on load
  useEffect(() => {
    if (appPhase === 'boot') return;
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
  }, [appPhase]);

  if (appPhase === 'boot') {
    return <BootScreen onComplete={() => setAppPhase('app')} />;
  }

  const appShell = (
    <>
      {/* Background aesthetics overlays */}
      <div className="nier-grid-overlay" />
      <div className="nier-scanlines" />
      <div className="nier-scanline-bar" />
      <div className="nier-noise" />

      {isAdminMode ? (
        /* Render Administrative Shell Directly */
        <div className="app-container-admin">
          {renderAdminView()}
        </div>
      ) : (
        /* Standard Public Website Shell */
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
                RECORDS DECRYPTION PANEL v1.0.9
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
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* Theme toggle */}
              <button
                className={`nier-btn small ${isDark ? 'active' : ''}`}
                onClick={handleThemeToggle}
                onMouseEnter={handleTabHover}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                style={{ padding: '6px 10px' }}
              >
                {isDark ? <Sun size={14} /> : <Moon size={14} />}
              </button>
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
            <span>MODULE_LOCATION: {window.location.hostname.replace('.onrender.com', '').toUpperCase()}://portfolio-blog/{activeTab}</span>
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
              <a 
                href={__COMMIT_HASH__ === 'dev-local' ? 'https://github.com/devdrx/portfolio-blog' : `https://github.com/devdrx/portfolio-blog/commit/${__COMMIT_HASH__}`}
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ 
                  color: 'inherit', 
                  textDecoration: 'underline', 
                  textDecorationColor: 'var(--nier-border-muted)',
                  textUnderlineOffset: '2px'
                }}
                title="VIEW DEPLOYED COMMIT ON GITHUB"
              >
                OS_HASH: 0x{__COMMIT_HASH__}
              </a>
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
      )}
    </>
  );
  
  return appShell;
};

export default App;
