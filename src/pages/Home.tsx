import React, { useEffect, useState } from 'react';
import { GlitchText } from '../components/GlitchText';
import { Sound } from '../components/SoundController';
import { projectsService } from '../services/projects';
import type { Project } from '../services/projects';
import { Terminal, Cpu, ShieldAlert, Binary } from 'lucide-react';

export const Home: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [pfpUrl, setPfpUrl] = useState('/pfp.png');

  useEffect(() => {
    const loadProjects = async () => {
      const data = await projectsService.getProjects({ includeHidden: false });
      setProjects(data);
    };
    loadProjects();

    // Fetch active profile picture from Express backend configuration
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data.pfpUrl) setPfpUrl(data.pfpUrl);
      })
      .catch(() => {});
  }, []);

  const handleSystemDiagnose = () => {
    Sound.playWarning();
  };

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
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 2fr', gap: '30px' }}>
        
        {/* Left Side: Avatar and Quick Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="nier-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            <div className="nier-header-line" style={{ width: '100%' }} />
            
            {/* Retro Portrait Avatar */}
            <div 
              style={{
                width: '180px',
                height: '180px',
                border: '4px double var(--nier-border)',
                backgroundColor: 'rgba(0,0,0,0.05)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Scanline overlay inside portrait */}
              <div 
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(rgba(78,75,66,0.1) 50%, transparent 50%)',
                  backgroundSize: '100% 4px',
                }} 
              />
              
            {/* Profile Picture */}
              <img
                src={pfpUrl}
                alt="Unit Profile"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  imageRendering: 'auto',
                  filter: 'sepia(0.18) contrast(1.05)',
                }}
              />
            </div>

            <div style={{ textAlign: 'center', width: '100%' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>UNIT ID: 9S-DEV</h3>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--nier-text-muted)' }}>
                CLASSIFICATION: SOFTWARE ENGINEER
              </p>
            </div>

            <div className="nier-double-line" style={{ width: '100%' }} />

            {/* Quick Stats list */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>HP / EXP:</span>
                <span>9999 / 99.9%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>PROJECT CATALOGS:</span>
                <span>DECRYPTED</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>LEVEL:</span>
                <span>+99 (SENIOR)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>OS VERSION:</span>
                <span>YoRHa v1.0.9</span>
              </div>
            </div>
          </div>

          {/* System Load */}
          <div className="nier-panel" style={{ padding: '15px' }}>
            <h4 style={{ fontSize: '14px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={16} /> SYSTEM RESOURCE LOAD
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span>TS_ENGINE:</span>
                  <span>45%</span>
                </div>
                <div style={{ height: '4px', backgroundColor: 'var(--nier-bg)', border: '1px solid var(--nier-border-muted)' }}>
                  <div style={{ width: '45%', height: '100%', backgroundColor: 'var(--nier-text)' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span>CANVAS_RENDER:</span>
                  <span>12%</span>
                </div>
                <div style={{ height: '4px', backgroundColor: 'var(--nier-bg)', border: '1px solid var(--nier-border-muted)' }}>
                  <div style={{ width: '12%', height: '100%', backgroundColor: 'var(--nier-text)' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span>ANIME_WEEB_DRIVE:</span>
                  <span>95%</span>
                </div>
                <div style={{ height: '4px', backgroundColor: 'var(--nier-bg)', border: '1px solid var(--nier-border-muted)' }}>
                  <div style={{ width: '95%', height: '100%', backgroundColor: 'var(--nier-accent)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Core Mission Logs / Bio & Projects list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Main Bio / Overview */}
          <div className="nier-panel" style={{ flex: '1' }}>
            <div className="nier-header-line" />
            <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>
              <GlitchText text="&gt; OPERATOR LOG // MISSION PROFILE" speed={30} />
            </h3>
            
            <p style={{ marginBottom: '15px', color: 'var(--nier-text)', fontSize: '14px', textAlign: 'justify' }}>
              Welcome to the archives of 9S-DEV. This console serves as a visual and interactive portal showcasing expertise in 
              <strong> Software Development</strong> and <strong>Web Engineering</strong>, modeled with precision and borrowing 
              tactical UI aesthetics directly from the YoRHa OS.
            </p>

            <p style={{ marginBottom: '20px', color: 'var(--nier-text)', fontSize: '14px', textAlign: 'justify' }}>
              Explore music loops and digital media inside <strong>[02_ART]</strong>, read customized technical write-ups and 
              code syntax highlights inside <strong>[03_BLOG]</strong>, or calibrate configurations in <strong>[04_SYSTEM]</strong>.
            </p>

            <div className="nier-double-line" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="nier-panel" style={{ backgroundColor: 'rgba(0,0,0,0.02)', padding: '12px' }}>
                <h4 style={{ fontSize: '13px', marginBottom: '6px', color: 'var(--nier-accent)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Binary size={14} /> ACTIVE OBJECTIVES
                </h4>
                <ul style={{ fontSize: '12px', paddingLeft: '15px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>Build flawless, responsive web structures</li>
                  <li>Develop rich code highlighting capabilities</li>
                  <li>Collect and display aesthetic digital art pieces</li>
                </ul>
              </div>

              <div className="nier-panel" style={{ backgroundColor: 'rgba(0,0,0,0.02)', padding: '12px' }}>
                <h4 style={{ fontSize: '13px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldAlert size={14} /> COMPILER WARNINGS
                </h4>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                  <div>&gt; Deprecated coffee dependencies found.</div>
                  <div>&gt; Weeb levels approaching peak capacity.</div>
                  <div>&gt; Sleep reserves critical (3.2%).</div>
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
                    backgroundColor: 'rgba(0,0,0,0.01)'
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

                  <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                    {proj.githubUrl && (
                      <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="nier-btn small" style={{ fontSize: '9px', padding: '2px 8px', textDecoration: 'none' }}>
                        [ GITHUB SOURCE ]
                      </a>
                    )}
                    {proj.demoUrl && (
                      <a href={proj.demoUrl} target="_blank" rel="noreferrer" className="nier-btn small" style={{ fontSize: '9px', padding: '2px 8px', textDecoration: 'none' }}>
                        [ LIVE DEMO ]
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

          {/* Diagnostic Console logs */}
          <div className="nier-panel" style={{ backgroundColor: 'rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--nier-border-muted)', paddingBottom: '6px' }}>
              <Terminal size={14} /> CONSOLE OUT // DIAGNOSTIC_RECORDS
            </h4>
            <div 
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                height: '100px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <div>[10:45:12] INFO: Connecting to central database... success.</div>
              <div>[10:45:13] INFO: Found 8 components, building DOM layouts...</div>
              <div>[10:45:13] WARNING: High art aesthetic discovered on local system.</div>
              <div>[10:45:14] DEBUG: Sound synthesizers initialized successfully.</div>
              <div style={{ color: 'var(--nier-accent)' }}>[10:45:15] CRITICAL: Emotional levels monitored, suppressing feelings...</div>
            </div>
            
            <button 
              className="nier-btn small" 
              onClick={handleSystemDiagnose}
              style={{ alignSelf: 'flex-end' }}
            >
              [ RUN MALWARE SCAN ]
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;
