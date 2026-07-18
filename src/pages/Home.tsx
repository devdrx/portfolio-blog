import React, { useEffect, useState, useRef, useCallback } from 'react';
import { GlitchText } from '../components/GlitchText';
import { Sound } from '../components/SoundController';
import { projectsService } from '../services/projects';
import type { Project } from '../services/projects';
import { Terminal, Cpu, Binary, ShieldCheck, GitBranch, Link2, Mail, ExternalLink } from 'lucide-react';

// ─── Static pools ────────────────────────────────────────────────────────────
const STATUS_CYCLE = [
  '> WRITING CODE...',
  '> LISTENING TO MUSIC...',
  '> READING MANGA...',
  '> DEBUGGING AT 2AM...',
  '> CONSUMING ANIME...',
  '> SOLVING PROBLEMS...',
  '> SIPPING CHAI...',
];

const LOG_POOL = [
  'INFO: Scanning project archives... complete.',
  'INFO: Sound synthesizers re-calibrated.',
  'INFO: Portfolio rendering engine optimized.',
  'DEBUG: Weeb data module engaged.',
  'INFO: GitHub API heartbeat confirmed.',
  'WARNING: High anime intake detected on local system.',
  'INFO: Competitive programming neural cores ACTIVE.',
  'WARNING: Caffeine levels approaching critical threshold.',
  'INFO: LLM sub-processors spooling up.',
  'DEBUG: CSS animation pipeline rendered in < 16ms.',
  'INFO: SoundCloud playlist sync successful.',
  'WARNING: Feelings overflow buffer detected.',
  'INFO: Jukebox arpeggiator clocked at 150ms lookahead.',
  'DEBUG: Blog markdown parser compiled successfully.',
  'INFO: IIIT Lucknow academic core: ONLINE.',
  'WARNING: Detected 3 unsquashed Git commits.',
  'INFO: MediSense TensorFlow diagnostic module deployed.',
  'DEBUG: Hash router transition — seamless.',
];

const SCAN_SEQUENCE = [
  'SCAN: Initiating deep scan on port 9S-DEV...',
  'SCAN: Checking for unauthorized feelings...',
  'SCAN: Detecting weeb subroutines...',
  'SCAN: Weeb subroutines QUARANTINED (95 instances).',
  'SCAN: Checking caffeine dependency modules... WARNING.',
  'CRITICAL: Emotional levels monitored. Suppression failed.',
  '> SCAN COMPLETE. Stay safe, Operator.',
];

const RESOURCE_BARS = [
  { key: 'ALGORITHMS_CRAVING', pct: 99, color: 'var(--nier-accent)', tooltip: 'Send help. Cannot stop solving DP problems at midnight.' },
  { key: 'CAFFEINE_DEPENDENCY', pct: 78, color: 'var(--nier-text)', tooltip: '3 cups/day average. Spikes during hackathons to 7+.' },
  { key: 'SLEEP_CYCLE_COMPLIANCE', pct: 12, color: 'var(--nier-text-muted)', tooltip: 'Sleep is a myth. Deadlines are real.' },
  { key: 'WEEB_CONTENT_INTAKE', pct: 95, color: 'var(--nier-accent)', tooltip: '40+ completed series. Tracking via AniList. Send help.' },
];

const OBJECTIVES = [
  { text: 'Deploy MediSense TensorFlow diagnostic models', pct: 70, done: false },
  { text: 'Scale CP-Helper to 1,000+ active users', pct: 45, done: false },
  { text: 'Train local LLMs for grievance classification', pct: 30, done: false },
  { text: 'Build YoRHa OS v2.0 portfolio shell', pct: 92, done: false },
];

// ─── Redacted Text Component ──────────────────────────────────────────────────
const Redacted: React.FC<{ children: string }> = ({ children }) => {
  const [revealed, setRevealed] = useState(false);
  return (
    <span
      onClick={() => { setRevealed(r => !r); Sound.playClick(); }}
      onMouseEnter={() => Sound.playHover()}
      title="Click to reveal"
      style={{
        backgroundColor: revealed ? 'transparent' : 'var(--nier-text)',
        color: revealed ? 'var(--nier-accent)' : 'var(--nier-text)',
        cursor: 'pointer',
        padding: '0 2px',
        borderRadius: '1px',
        transition: 'all 0.3s ease',
        fontWeight: revealed ? 'bold' : 'normal',
        userSelect: 'none',
      }}
    >
      {children}
    </span>
  );
};

// ─── Animated Bar Component ───────────────────────────────────────────────────
const ResourceBar: React.FC<{ label: string; pct: number; color: string; tooltip: string }> = ({
  label, pct, color, tooltip,
}) => {
  const [width, setWidth] = useState(0);
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 200);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
        <span style={{ fontSize: '11px' }}>{label}:</span>
        <span style={{ fontSize: '11px', color: pct > 90 ? 'var(--nier-accent)' : 'inherit' }}>{pct}%</span>
      </div>
      <div
        style={{ height: '4px', backgroundColor: 'var(--nier-bg)', border: '1px solid var(--nier-border-muted)', cursor: 'help', position: 'relative' }}
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
      >
        <div style={{
          width: `${width}%`,
          height: '100%',
          backgroundColor: color,
          transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }} />
      </div>
      {showTip && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'var(--nier-bg-alt)',
          border: '1px solid var(--nier-border)',
          padding: '6px 8px',
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--nier-text)',
          zIndex: 10,
          marginBottom: '4px',
          lineHeight: 1.4,
        }}>
          {tooltip}
        </div>
      )}
    </div>
  );
};

// ─── Animated Status Dot ──────────────────────────────────────────────────────
const StatusDot: React.FC<{ color: string }> = ({ color }) => (
  <span style={{
    display: 'inline-block',
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: color,
    marginRight: '6px',
    flexShrink: 0,
    animation: 'status-pulse 2s ease-in-out infinite',
  }} />
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const Home: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [pfpUrl, setPfpUrl] = useState('/pfp.png');
  const [statusIdx, setStatusIdx] = useState(0);
  const [clock, setClock] = useState('');
  const [logs, setLogs] = useState<{ text: string; type: 'info' | 'warn' | 'critical' | 'scan' }[]>([]);
  const [scanning, setScanning] = useState(false);
  const [ghStats, setGhStats] = useState<{ repos: number; followers: number } | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const logIdxRef = useRef(0);
  const scanTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Auto-scroll terminal on new log
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  // Seed initial log lines
  useEffect(() => {
    const seed = [
      { text: 'INFO: Connecting to central database... success.', type: 'info' as const },
      { text: 'INFO: Found 8 components, building DOM layouts...', type: 'info' as const },
      { text: 'WARNING: High art aesthetic discovered on local system.', type: 'warn' as const },
      { text: 'DEBUG: Sound synthesizers initialized successfully.', type: 'info' as const },
      { text: 'CRITICAL: Emotional levels monitored, suppressing feelings...', type: 'critical' as const },
    ];
    setLogs(seed);
  }, []);

  // Fetch GitHub stats
  useEffect(() => {
    fetch('https://api.github.com/users/devdrx')
      .then(r => r.json())
      .then(data => {
        setGhStats({ repos: data.public_repos, followers: data.followers });
      })
      .catch(() => {});
  }, []);

  // Live clock
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-IN', { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Cycling status tag
  useEffect(() => {
    const id = setInterval(() => setStatusIdx(i => (i + 1) % STATUS_CYCLE.length), 3500);
    return () => clearInterval(id);
  }, []);

  // Append random log lines every ~5 seconds
  useEffect(() => {
    const id = setInterval(() => {
      if (scanning) return;
      const text = LOG_POOL[logIdxRef.current % LOG_POOL.length];
      logIdxRef.current++;
      const type = text.startsWith('WARNING') ? 'warn' : text.startsWith('CRITICAL') ? 'critical' : 'info';
      setLogs(prev => [...prev.slice(-30), { text, type }]);
    }, 5000);
    return () => clearInterval(id);
  }, [scanning]);

  // Load projects + pfp
  useEffect(() => {
    projectsService.getProjects({ includeHidden: false })
      .then(setProjects)
      .catch(err => console.error('Failed loading projects:', err));
    fetch('/api/settings').then(r => r.json()).then(data => {
      if (data.pfpUrl) setPfpUrl(data.pfpUrl);
    }).catch(() => {});
  }, []);

  // Malware scan handler
  const handleScan = useCallback(() => {
    if (scanning) return;
    Sound.playWarning();
    setScanning(true);
    SCAN_SEQUENCE.forEach((line, i) => {
      const id = setTimeout(() => {
        setLogs(prev => [...prev, { text: line, type: i >= 4 ? 'critical' : 'scan' }]);
        if (i === SCAN_SEQUENCE.length - 1) setScanning(false);
      }, i * 600);
      scanTimeoutsRef.current.push(id);
    });
  }, [scanning]);

  // Cancel any pending scan timeouts if the component unmounts mid-scan
  useEffect(() => {
    const timeouts = scanTimeoutsRef.current;
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []);

  const getLogColor = (type: string) => {
    if (type === 'critical' || type === 'scan') return 'var(--nier-accent)';
    if (type === 'warn') return '#c8a24b';
    return 'inherit';
  };

  const nowTs = () => new Date().toLocaleTimeString('en-IN', { hour12: false });

  return (
    <div className="content-section" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Top Header */}
      <div className="title-decorator">
        <span className="tag">INFO</span>
        <h2>[01_HOME] // SYSTEM_OVERVIEW</h2>
        <div className="line" />
        <span className="tag" style={{ backgroundColor: 'var(--nier-accent)' }}>ONLINE</span>
      </div>

      {/* Main Grid Layout */}
      <div className="home-grid">

        {/* ── Left Column ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Avatar Card */}
          <div className="nier-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            <div className="nier-header-line" style={{ width: '100%' }} />

            {/* Portrait with animated ring */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="portrait-ring" />
              <div style={{
                width: '180px',
                height: '180px',
                border: '4px double var(--nier-border)',
                backgroundColor: 'rgba(0,0,0,0.05)',
                position: 'relative',
                overflow: 'hidden',
                zIndex: 1,
              }}>
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(rgba(78,75,66,0.1) 50%, transparent 50%)',
                  backgroundSize: '100% 4px',
                  zIndex: 2,
                }} />
                <img
                  src={pfpUrl}
                  alt="Unit Profile"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(0.18) contrast(1.05)' }}
                />
              </div>
            </div>

            <div style={{ textAlign: 'center', width: '100%' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>UNIT ID: 9S-DEV</h3>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--nier-text-muted)' }}>
                CLASSIFICATION: SOFTWARE ENGINEER
              </p>
              {/* Cycling live status tag */}
              <div style={{
                marginTop: '8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--nier-accent)',
                minHeight: '16px',
                transition: 'opacity 0.3s ease',
              }}>
                {STATUS_CYCLE[statusIdx]}
              </div>
            </div>

            <div className="nier-double-line" style={{ width: '100%' }} />

            {/* Live stats */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>OPERATOR_ONLINE:</span>
                <span style={{ color: 'var(--nier-accent)' }}>{clock}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>GH_PUBLIC_REPOS:</span>
                <span>{ghStats ? ghStats.repos : '...'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>GH_FOLLOWERS:</span>
                <span>{ghStats ? ghStats.followers : '...'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>CF_RATING_MAX:</span>
                <span>1491 <span style={{ color: 'var(--nier-accent)', fontSize: '10px' }}>SPECIALIST</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>OS VERSION:</span>
                <span>YoRHa v1.0.9</span>
              </div>
            </div>

            {/* Social Links Row */}
            <div style={{ width: '100%', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <a
                href="https://github.com/devdrx"
                target="_blank" rel="noreferrer"
                className="nier-btn small"
                onMouseEnter={() => Sound.playHover()}
                onClick={() => Sound.playClick()}
                style={{ flex: 1, justifyContent: 'center', gap: '5px', textDecoration: 'none', fontSize: '10px' }}
              >
                <GitBranch size={11} /> GITHUB
              </a>
              <a
                href="https://www.linkedin.com/in/dev-darshanx7124/"
                target="_blank" rel="noreferrer"
                className="nier-btn small"
                onMouseEnter={() => Sound.playHover()}
                onClick={() => Sound.playClick()}
                style={{ flex: 1, justifyContent: 'center', gap: '5px', textDecoration: 'none', fontSize: '10px' }}
              >
                <Link2 size={11} /> LINKEDIN
              </a>
              <a
                href="mailto:devclasher001@gmail.com"
                className="nier-btn small"
                onMouseEnter={() => Sound.playHover()}
                onClick={() => Sound.playClick()}
                style={{ flex: 1, justifyContent: 'center', gap: '5px', textDecoration: 'none', fontSize: '10px' }}
              >
                <Mail size={11} /> EMAIL
              </a>
            </div>
          </div>

          {/* Resource Load Bars */}
          <div className="nier-panel" style={{ padding: '15px' }}>
            <h4 style={{ fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={16} /> SYSTEM RESOURCE LOAD
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
              {RESOURCE_BARS.map(bar => (
                <ResourceBar key={bar.key} label={bar.key} pct={bar.pct} color={bar.color} tooltip={bar.tooltip} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Column ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Bio Panel */}
          <div className="nier-panel" style={{ flex: 1 }}>
            <div className="nier-header-line" />
            <h3 style={{ fontSize: '18px', marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
              <GlitchText text="&gt; OPERATOR LOG // MISSION PROFILE" speed={30} />
              <span className="nier-cursor" />
            </h3>

            <p style={{ marginBottom: '15px', color: 'var(--nier-text)', fontSize: '14px', lineHeight: '1.7', textAlign: 'justify' }}>
              Welcome to the archives of <strong>9S-DEV</strong>. Operator <Redacted>Dev Darshan</Redacted>, deployed by{' '}
              <Redacted>IIIT Lucknow (CS, Batch 2027)</Redacted> to build scalable architectures and solve{' '}
              <Redacted>unnecessarily hard competitive programming problems at 2AM</Redacted>.
              This console showcases expertise in <strong>Software Development</strong> and{' '}
              <strong>Web Engineering</strong>, wrapped in YoRHa OS aesthetics.
            </p>

            <p style={{ marginBottom: '20px', color: 'var(--nier-text)', fontSize: '14px', lineHeight: '1.7', textAlign: 'justify' }}>
              Explore music loops and digital media inside <strong>[02_ART]</strong>, read technical write-ups
              and code syntax highlights in <strong>[03_BLOG]</strong>, or calibrate configurations in{' '}
              <strong>[04_SYSTEM]</strong>. <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--nier-text-muted)' }}>
                (Click redacted text to reveal classified data.)
              </span>
            </p>

            <div className="nier-double-line" />

            {/* Objectives & Diagnostics Grid */}
            <div className="objectives-grid" style={{ marginTop: '15px' }}>

              {/* Active Objectives */}
              <div className="nier-panel" style={{ backgroundColor: 'rgba(0,0,0,0.02)', padding: '12px' }}>
                <h4 style={{ fontSize: '13px', marginBottom: '10px', color: 'var(--nier-accent)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Binary size={14} /> ACTIVE OBJECTIVES
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {OBJECTIVES.map((obj, i) => (
                    <div key={i} style={{ animationDelay: `${i * 150}ms`, animation: 'objective-scan 0.5s ease-out both' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '11px', marginBottom: '4px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--nier-accent)', flexShrink: 0 }}>
                          {obj.pct >= 90 ? '[~]' : '[-]'}
                        </span>
                        <span style={{ lineHeight: 1.4 }}>{obj.text}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '3px', backgroundColor: 'var(--nier-bg)', border: '1px solid var(--nier-border-muted)', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            backgroundColor: obj.pct >= 90 ? 'var(--nier-accent)' : 'var(--nier-text)',
                            width: `${obj.pct}%`,
                            transition: `width 1.4s cubic-bezier(0.16, 1, 0.3, 1) ${i * 150}ms`,
                          }} />
                        </div>
                        <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--nier-text-muted)', flexShrink: 0 }}>
                          {obj.pct}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Diagnostics */}
              <div className="nier-panel" style={{ backgroundColor: 'rgba(0,0,0,0.02)', padding: '12px' }}>
                <h4 style={{ fontSize: '13px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} style={{ color: 'var(--nier-text)' }} /> SYSTEM DIAGNOSTICS
                </h4>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <StatusDot color="#7fc47f" />
                    Academic Core: IIIT Lucknow CS (9.02 CGPA)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <StatusDot color="#c8a24b" />
                    Algorithmic Rating: CF Specialist (1491 max)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <StatusDot color="#7fc47f" />
                    Hackofiesta 6.0: WINNER
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <StatusDot color="#c8a24b" />
                    ML/AI Stack: TensorFlow, Ollama, AssemblyAI
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <StatusDot color="var(--nier-accent)" />
                    Portfolio OS: YoRHa v1.0.9 ACTIVE
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Projects showcase */}
          <div className="nier-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ fontSize: '15px', borderBottom: '1px solid var(--nier-border-muted)', paddingBottom: '6px', fontFamily: 'var(--font-mono)' }}>
              [ PROJECT_ARCHIVES ] // LOGGED_DEPLOYMENTS
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {projects.length > 0 ? projects.map(proj => (
                <div
                  key={proj.id}
                  style={{
                    border: '1px solid var(--nier-border-muted)',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    backgroundColor: 'rgba(0,0,0,0.01)',
                    transition: 'border-color 0.2s ease, background-color 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    Sound.playHover();
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--nier-border)';
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,0,0,0.04)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--nier-border-muted)';
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,0,0,0.01)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '13px', margin: 0, fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>{proj.title}</h4>
                    {proj.featured && (
                      <span style={{ fontSize: '9px', backgroundColor: 'var(--nier-accent)', color: 'var(--nier-bg)', padding: '1px 4px', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
                        FEATURED
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--nier-text)', margin: 0, lineHeight: '1.4' }}>{proj.description}</p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    {proj.techStack.map(tech => (
                      <span key={tech} style={{ fontSize: '8px', fontFamily: 'var(--font-mono)', border: '1px solid var(--nier-border-muted)', padding: '1px 4px' }}>
                        {tech.toUpperCase()}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
                    {proj.githubUrl && (
                      <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="nier-btn small"
                        style={{ fontSize: '9px', padding: '2px 8px', textDecoration: 'none', gap: '4px' }}
                        onMouseEnter={() => Sound.playHover()} onClick={() => Sound.playClick()}
                      >
                        <GitBranch size={9} /> [ GITHUB SOURCE ]
                      </a>
                    )}
                    {proj.demoUrl && (
                      <a href={proj.demoUrl} target="_blank" rel="noreferrer" className="nier-btn small"
                        style={{ fontSize: '9px', padding: '2px 8px', textDecoration: 'none', gap: '4px' }}
                        onMouseEnter={() => Sound.playHover()} onClick={() => Sound.playClick()}
                      >
                        <ExternalLink size={9} /> [ LIVE DEMO ]
                      </a>
                    )}
                  </div>
                </div>
              )) : (
                <p style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--nier-text-muted)', fontStyle: 'italic' }}>
                  No logged deployments cataloged.
                </p>
              )}
            </div>
          </div>

          {/* Live Console Terminal */}
          <div className="nier-panel" style={{ backgroundColor: 'rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--nier-border-muted)', paddingBottom: '6px' }}>
              <Terminal size={14} /> CONSOLE OUT // DIAGNOSTIC_RECORDS
              <span style={{ marginLeft: 'auto', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--nier-text-muted)' }}>
                {scanning ? '[ SCANNING... ]' : '[ LIVE ]'}
              </span>
            </h4>
            <div
              ref={terminalRef}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                height: '120px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              {logs.map((log, i) => (
                <div key={i} style={{ color: getLogColor(log.type) }}>
                  [{nowTs()}] {log.text}
                </div>
              ))}
              {scanning && (
                <div style={{ color: 'var(--nier-text-muted)' }}>
                  ▌<span className="nier-cursor" />
                </div>
              )}
            </div>

            <button
              className={`nier-btn small ${scanning ? 'active' : ''}`}
              onClick={handleScan}
              disabled={scanning}
              style={{ alignSelf: 'flex-end' }}
            >
              {scanning ? '[ SCANNING... ]' : '[ RUN MALWARE SCAN ]'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Home;
