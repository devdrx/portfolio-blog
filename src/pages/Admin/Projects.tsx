import React, { useEffect, useState } from 'react';
import { projectsService } from '../../services/projects';
import type { Project } from '../../services/projects';
import { Sound } from '../../components/SoundController';
import { Toast } from '../../components/admin/Toast';
import { ConfirmationDialog } from '../../components/admin/ConfirmationDialog';
import { 
  FolderGit, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  Star, 
  Save, 
  Undo2 
} from 'lucide-react';

export const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Active view states: 'list' | 'editor'
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [techStack, setTechStack] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [order, setOrder] = useState<number>(0);
  const [featured, setFeatured] = useState(false);
  const [visibility, setVisibility] = useState<'visible' | 'hidden'>('visible');

  // Popup feedback status
  const [toast, setToast] = useState<{ message: string; isAlert?: boolean } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    const data = await projectsService.getProjects({ includeHidden: true });
    setProjects(data);
    setLoading(false);
  };

  const showToastMessage = (message: string, isAlert = false) => {
    setToast({ message, isAlert });
  };

  const handleCreateProject = () => {
    Sound.playClick();
    setActiveProject(null);
    setTitle('');
    setDescription('');
    setTechStack('');
    setGithubUrl('');
    setDemoUrl('');
    setImageUrl('');
    setOrder(projects.length + 1);
    setFeatured(false);
    setVisibility('visible');
    setView('editor');
  };

  const handleEditProject = (proj: Project) => {
    Sound.playClick();
    setActiveProject(proj);
    setTitle(proj.title);
    setDescription(proj.description);
    setTechStack(proj.techStack.join(', '));
    setGithubUrl(proj.githubUrl || '');
    setDemoUrl(proj.demoUrl || '');
    setImageUrl(proj.imageUrl || '');
    setOrder(proj.order);
    setFeatured(proj.featured);
    setVisibility(proj.visibility);
    setView('editor');
  };

  const handleSaveProject = async () => {
    if (!title || !description) {
      Sound.playWarning();
      return showToastMessage('Validation error: Title and Description are required.', true);
    }

    const techArray = techStack.split(',').map(t => t.trim()).filter(t => t.length > 0);

    const payload = {
      title,
      description,
      techStack: techArray,
      githubUrl,
      demoUrl,
      imageUrl,
      order: Number(order) || 0,
      featured,
      visibility
    };

    if (activeProject) {
      await projectsService.updateProject(activeProject.id, payload);
      showToastMessage('Project configuration updated.');
    } else {
      await projectsService.createProject(payload);
      showToastMessage('New project registered.');
    }

    Sound.playChime();
    loadProjects();
    setView('list');
  };

  const handleDeleteClick = (id: string) => {
    Sound.playWarning();
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    await projectsService.deleteProject(confirmDeleteId);
    showToastMessage('Project record deleted.');
    setConfirmDeleteId(null);
    loadProjects();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {view === 'list' && (
        <>
          {/* Header controls bar */}
          <div className="admin-header-bar">
            <h2 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FolderGit size={18} /> [ PORTFOLIO PROJECT CARDS REGISTRY ]
            </h2>
            <button className="nier-btn small" onClick={handleCreateProject} style={{ gap: '6px' }}>
              <Plus size={14} /> [ REGISTER CARD ]
            </button>
          </div>

          {/* Grid layout cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {loading ? (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--nier-text-muted)', textAlign: 'center', gridColumn: '1/-1' }}>
                SCANNING DATA BLOCKS...
              </p>
            ) : projects.length > 0 ? projects.map(proj => (
              <div 
                key={proj.id} 
                className="nier-panel" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px',
                  border: proj.visibility === 'hidden' ? '1px dashed var(--nier-border-muted)' : '1px solid var(--nier-border)',
                  opacity: proj.visibility === 'hidden' ? 0.7 : 1
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--nier-text-muted)', fontFamily: 'var(--font-mono)' }}>#{proj.order}</span>
                    <h3 style={{ fontSize: '15px', margin: 0, fontWeight: 'bold' }}>{proj.title}</h3>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    {proj.featured && <Star size={12} fill="var(--nier-accent)" style={{ color: 'var(--nier-accent)' }} />}
                    {proj.visibility === 'hidden' ? <EyeOff size={12} style={{ color: 'var(--nier-accent)' }} /> : <Eye size={12} />}
                  </div>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--nier-text)', lineHeight: '1.5', flex: 1 }}>{proj.description}</p>

                {/* Tech chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {proj.techStack.map(t => (
                    <span 
                      key={t} 
                      style={{ 
                        fontSize: '9px', 
                        fontFamily: 'var(--font-mono)', 
                        border: '1px solid var(--nier-border-muted)', 
                        padding: '1px 5px',
                        backgroundColor: 'rgba(0,0,0,0.02)'
                      }}
                    >
                      {t.toUpperCase()}
                    </span>
                  ))}
                </div>

                {/* Card controls action bar */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--nier-border-muted)', paddingTop: '10px', marginTop: '5px' }}>
                  <button className="nier-btn small" onClick={() => handleEditProject(proj)}>
                    <Edit3 size={11} /> [ EDIT ]
                  </button>
                  <button 
                    className="nier-btn small" 
                    style={{ color: 'var(--nier-accent)', borderColor: 'var(--nier-accent)' }}
                    onClick={() => handleDeleteClick(proj.id)}
                  >
                    <Trash2 size={11} /> [ PURGE ]
                  </button>
                </div>
              </div>
            )) : (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--nier-text-muted)', textAlign: 'center', gridColumn: '1/-1', margin: '30px' }}>
                NO PORTFOLIO DEPLOYMENTS FOUND
              </p>
            )}
          </div>
        </>
      )}

      {view === 'editor' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--nier-border)', paddingBottom: '12px' }}>
            <h2 style={{ fontSize: '18px', margin: 0, fontFamily: 'var(--font-mono)' }}>
              {activeProject ? `[ MODIFY PROJECT CARD // ${activeProject.id.toUpperCase()} ]` : '[ REGISTER NEW PROJECT CARD ]'}
            </h2>
            <button className="nier-btn small" onClick={() => { Sound.playClick(); setView('list'); }} style={{ gap: '4px' }}>
              <Undo2 size={12} /> [ RETURN INDEX ]
            </button>
          </div>

          {/* Form grid layout */}
          <div className="nier-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '650px', margin: '0 auto', width: '100%' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '15px', fontSize: '13px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontFamily: 'var(--font-mono)' }}>PROJECT TITLE</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. JansunwAI classification matrix"
                  style={{ backgroundColor: 'var(--nier-bg)', border: '1px solid var(--nier-border)', color: 'var(--nier-text)', padding: '8px 12px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontFamily: 'var(--font-mono)' }}>DISPLAY ORDER (SORT INDEX)</label>
                <input 
                  type="number" 
                  value={order} 
                  onChange={(e) => setOrder(Number(e.target.value) || 0)}
                  style={{ backgroundColor: 'var(--nier-bg)', border: '1px solid var(--nier-border)', color: 'var(--nier-text)', padding: '8px 12px', fontFamily: 'var(--font-mono)' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
              <label style={{ fontFamily: 'var(--font-mono)' }}>PROJECT SUMMARY / DESCRIPTION</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write summary of project role, stack purpose, and execution details..."
                rows={4}
                style={{ backgroundColor: 'var(--nier-bg)', border: '1px solid var(--nier-border)', color: 'var(--nier-text)', padding: '12px', fontFamily: 'var(--font-sans)', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
              <label style={{ fontFamily: 'var(--font-mono)' }}>TECH STACK (COMMA SEPARATED)</label>
              <input 
                type="text" 
                value={techStack} 
                onChange={(e) => setTechStack(e.target.value)}
                placeholder="React, Node.js, Express, TensorFlow, Python"
                style={{ backgroundColor: 'var(--nier-bg)', border: '1px solid var(--nier-border)', color: 'var(--nier-text)', padding: '8px 12px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '13px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontFamily: 'var(--font-mono)' }}>GITHUB SOURCE URL</label>
                <input type="text" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/..." style={{ backgroundColor: 'var(--nier-bg)', border: '1px solid var(--nier-border)', color: 'var(--nier-text)', padding: '8px 12px', fontSize: '12px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontFamily: 'var(--font-mono)' }}>LIVE DEPLOYMENT DEMO URL</label>
                <input type="text" value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} placeholder="https://demo.yorha..." style={{ backgroundColor: 'var(--nier-bg)', border: '1px solid var(--nier-border)', color: 'var(--nier-text)', padding: '8px 12px', fontSize: '12px' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '13px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontFamily: 'var(--font-mono)' }}>IMAGE PREVIEW URL</label>
                <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://images.unsplash..." style={{ backgroundColor: 'var(--nier-bg)', border: '1px solid var(--nier-border)', color: 'var(--nier-text)', padding: '8px 12px', fontSize: '12px' }} />
              </div>
              
              {/* Toggles */}
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', height: '100%', paddingTop: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '12px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={featured} onChange={(e) => { Sound.playHover(); setFeatured(e.target.checked); }} style={{ cursor: 'pointer' }} />
                  <span>FEATURED CARD</span>
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '12px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={visibility === 'visible'} 
                    onChange={(e) => { Sound.playHover(); setVisibility(e.target.checked ? 'visible' : 'hidden'); }} 
                    style={{ cursor: 'pointer' }} 
                  />
                  <span>CARD VISIBILITY</span>
                </label>
              </div>
            </div>

            <button 
              className="nier-btn" 
              onClick={handleSaveProject}
              style={{ width: '100%', gap: '6px', marginTop: '15px' }}
            >
              <Save size={14} /> [ SAVE PROJECT CONFIGURATION ]
            </button>

          </div>

        </div>
      )}

      {/* Popups */}
      {confirmDeleteId && (
        <ConfirmationDialog 
          message="Confirm purging this project record from the public registry index? This operation is permanent."
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDeleteId(null)}
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
export default Projects;
