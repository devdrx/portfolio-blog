import React, { useEffect, useState, useRef } from 'react';
import { postsService } from '../../services/posts';
import type { BlogPost } from '../../services/posts';
import { renderMarkdownToHtml, handleCodeCopyClick } from '../Blog';
import { Sound } from '../../components/SoundController';
import { Toast } from '../../components/admin/Toast';
import { ConfirmationDialog } from '../../components/admin/ConfirmationDialog';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Copy, 
  Archive, 
  CheckSquare, 
  Square,
  ChevronLeft,
  ChevronRight,
  Save,
  Undo2,
  Bold,
  Code,
  Link,
  Percent
} from 'lucide-react';

export const Posts: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'published' | 'draft'>('ALL');
  const [sortField, setSortField] = useState<'date' | 'title'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Selection states (for bulk actions)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Active view states: 'list' | 'editor' | 'preview'
  const [view, setView] = useState<'list' | 'editor' | 'preview'>('list');
  const [activePost, setActivePost] = useState<BlogPost | null>(null);

  // Editor states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('SOFTWARE');
  const [summary, setSummary] = useState('');
  const [tags, setTags] = useState('');
  const [slug, setSlug] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');


  // Popup & Alert states
  const [toast, setToast] = useState<{ message: string; isAlert?: boolean } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  // Autosave timer ref
  const autosaveIntervalRef = useRef<any>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  // Autosave monitor when inside editor
  useEffect(() => {
    if (view === 'editor') {
      autosaveIntervalRef.current = setInterval(() => {
        saveAutosaveBackup();
      }, 10000); // Trigger autosave every 10 seconds
    } else {
      if (autosaveIntervalRef.current) {
        clearInterval(autosaveIntervalRef.current);
      }
    }
    return () => {
      if (autosaveIntervalRef.current) {
        clearInterval(autosaveIntervalRef.current);
      }
    };
  }, [view, title, content, category, summary, tags, slug, seoTitle, seoDescription]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await postsService.getPosts({ includeDrafts: true });
      setPosts(data);
    } catch (err) {
      console.error('Failed loading posts:', err);
      showToastMessage('Failed to load records archive from server.', true);
    } finally {
      setLoading(false);
    }
  };

  const showToastMessage = (message: string, isAlert = false) => {
    setToast({ message, isAlert });
  };

  const saveAutosaveBackup = () => {
    if (!title && !content) return;
    const backup = {
      title, content, category, summary, tags, slug, seoTitle, seoDescription,
      timestamp: Date.now()
    };
    localStorage.setItem('yorha_editor_autosave', JSON.stringify(backup));
    // Brief visual notification log
    console.log('[AUTOSAVE] Backup successfully committed.');
  };

  const loadAutosaveBackup = () => {
    const backupData = localStorage.getItem('yorha_editor_autosave');
    if (!backupData) {
      return showToastMessage('No backup logs located in memory.', true);
    }
    try {
      const b = JSON.parse(backupData);
      setTitle(b.title || '');
      setContent(b.content || '');
      setCategory(b.category || 'SOFTWARE');
      setSummary(b.summary || '');
      setTags(b.tags || '');
      setSlug(b.slug || '');
      setSeoTitle(b.seoTitle || '');
      setSeoDescription(b.seoDescription || '');
      Sound.playChime();
      showToastMessage('Editor state restored from backup.');
    } catch {
      showToastMessage('Autosave parse error.', true);
    }
  };

  // Trigger editing a post
  const handleEditPost = (post: BlogPost) => {
    Sound.playClick();
    setActivePost(post);
    setTitle(post.title);
    setContent(post.content);
    setCategory(post.category);
    setSummary(post.summary);
    setTags(post.tags ? post.tags.join(', ') : '');
    setSlug(post.slug || '');
    setSeoTitle(post.seoTitle || '');
    setSeoDescription(post.seoDescription || '');
    setFeaturedImage(post.featuredImage || '');
    setView('editor');
  };

  // Trigger creating a new post
  const handleCreatePost = () => {
    Sound.playClick();
    setActivePost(null);
    setTitle('');
    setContent('');
    setCategory('SOFTWARE');
    setSummary('');
    setTags('');
    setSlug('');
    setSeoTitle('');
    setSeoDescription('');
    setFeaturedImage('');
    setView('editor');
  };

  const handleSave = async (saveStatus: 'draft' | 'published') => {
    if (!title || !content) {
      Sound.playWarning();
      return showToastMessage('Validation failed: Title and Content are required.', true);
    }

    const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
    const readTime = `${Math.max(1, Math.ceil(content.split(' ').length / 150))} min read`;

    const payload = {
      title,
      content,
      category,
      summary: summary || content.slice(0, 120) + '...',
      status: saveStatus,
      tags: tagsArray,
      slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      seoTitle: seoTitle || title,
      seoDescription: seoDescription || summary,
      featuredImage,
      readTime
    };

    try {
      if (activePost) {
        await postsService.updatePost(activePost.id, payload);
        showToastMessage('Record updated successfully.');
      } else {
        await postsService.createPost(payload);
        showToastMessage('Record archived successfully.');
      }
    } catch (err: any) {
      Sound.playWarning();
      showToastMessage(err.message || 'Failed to save record to server.', true);
      return;
    }

    // Clear autosave backup
    localStorage.removeItem('yorha_editor_autosave');

    Sound.playChime();
    loadPosts();
    setView('list');
  };

  const handleDuplicate = async (post: BlogPost) => {
    Sound.playClick();
    const payload = {
      title: `${post.title} (Copy)`,
      content: post.content,
      category: post.category,
      summary: post.summary,
      status: 'draft' as const,
      tags: post.tags,
      slug: `${post.slug}-copy`,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      featuredImage: post.featuredImage,
      readTime: post.readTime
    };
    await postsService.createPost(payload);
    showToastMessage('Record duplicated.');
    loadPosts();
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    Sound.playWarning();
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    await postsService.deletePost(confirmDeleteId);
    showToastMessage('Record purged.');
    setConfirmDeleteId(null);
    loadPosts();
  };

  // Selection helpers
  const handleSelectToggle = (id: string) => {
    Sound.playHover();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    Sound.playClick();
    const currentItemsIds = filteredAndSortedPosts.map(p => p.id);
    const allSelected = currentItemsIds.every(id => selectedIds.includes(id));
    
    if (allSelected) {
      setSelectedIds(selectedIds.filter(id => !currentItemsIds.includes(id)));
    } else {
      const merged = Array.from(new Set([...selectedIds, ...currentItemsIds]));
      setSelectedIds(merged);
    }
  };

  // Bulk operation actions
  const handleBulkPublish = async () => {
    if (selectedIds.length === 0) return;
    await postsService.bulkUpdateStatus(selectedIds, 'published');
    showToastMessage(`Published ${selectedIds.length} logs.`);
    setSelectedIds([]);
    loadPosts();
  };

  const handleBulkDraft = async () => {
    if (selectedIds.length === 0) return;
    await postsService.bulkUpdateStatus(selectedIds, 'draft');
    showToastMessage(`Drafted ${selectedIds.length} logs.`);
    setSelectedIds([]);
    loadPosts();
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedIds.length === 0) return;
    await postsService.bulkDelete(selectedIds);
    showToastMessage(`Purged ${selectedIds.length} records.`);
    setSelectedIds([]);
    setConfirmBulkDelete(false);
    loadPosts();
  };

  // Markdown editor insert helpers
  const insertTextAtCursor = (prefix: string, suffix = '') => {
    Sound.playHover();
    const textarea = document.getElementById('md-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = prefix + selected + suffix;

    setContent(text.substring(0, start) + replacement + text.substring(end));
    
    // Reset cursor focus
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 50);
  };

  // Filter, Search and Sort computations
  const filteredAndSortedPosts = posts.filter(post => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.tags && post.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
    
    const matchesStatus = 
      statusFilter === 'ALL' || post.status === statusFilter;
      
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    let comp = 0;
    if (sortField === 'date') {
      comp = a.date.localeCompare(b.date);
    } else {
      comp = a.title.localeCompare(b.title);
    }
    return sortOrder === 'asc' ? comp : -comp;
  });

  const handleSortChange = (field: 'date' | 'title') => {
    Sound.playHover();
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Pagination computations
  const totalPages = Math.ceil(filteredAndSortedPosts.length / itemsPerPage) || 1;
  const paginatedPosts = filteredAndSortedPosts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {view === 'list' && (
        <>
          {/* Header controls bar */}
          <div className="admin-header-bar">
            <h2 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Archive size={18} /> [ RECORDS ARCHIVE REGISTRY ]
            </h2>
            <button className="nier-btn small" onClick={handleCreatePost} style={{ gap: '6px' }}>
              <Plus size={14} /> [ COMPOSE RECORD ]
            </button>
          </div>

          {/* Search filters panel */}
          <div className="nier-panel" style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', padding: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px', border: '1px solid var(--nier-border)', padding: '6px 12px', backgroundColor: 'rgba(0,0,0,0.02)' }}>
              <Search size={14} style={{ color: 'var(--nier-text-muted)' }} />
              <input 
                type="text" 
                placeholder="SEARCH ARCHIVE ENTRIES..." 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                style={{ border: 'none', background: 'transparent', width: '100%', color: 'var(--nier-text)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
              />
            </div>

            {/* Filter statuses buttons */}
            <div style={{ display: 'flex', gap: '6px', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
              {(['ALL', 'published', 'draft'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => { Sound.playHover(); setStatusFilter(f); setCurrentPage(1); }}
                  style={{
                    border: '1px solid var(--nier-border-muted)',
                    background: statusFilter === f ? 'var(--nier-text)' : 'transparent',
                    color: statusFilter === f ? 'var(--nier-bg)' : 'var(--nier-text)',
                    padding: '4px 10px',
                    cursor: 'pointer'
                  }}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk operation options bar */}
          {selectedIds.length > 0 && (
            <div 
              style={{ 
                display: 'flex', 
                gap: '12px', 
                alignItems: 'center', 
                backgroundColor: 'var(--nier-accent-dim)', 
                border: '1px solid var(--nier-accent)', 
                padding: '10px 15px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px'
              }}
            >
              <span>SELECTED RECORDS: {selectedIds.length}</span>
              <div style={{ flexGrow: 1 }} />
              <button className="nier-btn small" onClick={handleBulkPublish}>[ COMMUNE PUBLISH ]</button>
              <button className="nier-btn small" onClick={handleBulkDraft}>[ COMMUNE DRAFT ]</button>
              <button 
                className="nier-btn small" 
                style={{ color: 'var(--nier-accent)', borderColor: 'var(--nier-accent)' }}
                onClick={() => { Sound.playWarning(); setConfirmBulkDelete(true); }}
              >
                [ COMMUNE PURGE ]
              </button>
            </div>
          )}

          {/* Database table archives */}
          <div className="nier-panel" style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--nier-border)', backgroundColor: 'var(--nier-bg-alt)', color: 'var(--nier-text-muted)' }}>
                  <th style={{ padding: '12px 15px', width: '45px' }}>
                    <button 
                      onClick={handleSelectAll}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', padding: 0 }}
                    >
                      {filteredAndSortedPosts.length > 0 && filteredAndSortedPosts.every(p => selectedIds.includes(p.id)) ? (
                        <CheckSquare size={14} style={{ color: 'var(--nier-accent)' }} />
                      ) : (
                        <Square size={14} />
                      )}
                    </button>
                  </th>
                  <th style={{ padding: '12px 15px' }}>ID</th>
                  <th
                    style={{ padding: '12px 15px', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSortChange('title')}
                    title="Sort by title"
                  >
                    TITLE {sortField === 'title' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th style={{ padding: '12px 15px', width: '100px' }}>STATUS</th>
                  <th
                    style={{ padding: '12px 15px', width: '100px', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSortChange('date')}
                    title="Sort by date"
                  >
                    DATE {sortField === 'date' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th style={{ padding: '12px 15px', width: '120px' }}>CATEGORY</th>
                  <th style={{ padding: '12px 15px', width: '130px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: 'var(--nier-text-muted)', fontStyle: 'italic' }}>
                      SCANNING DATA BLOCKS...
                    </td>
                  </tr>
                ) : paginatedPosts.length > 0 ? paginatedPosts.map(post => {
                  const isChecked = selectedIds.includes(post.id);
                  return (
                    <tr 
                      key={post.id} 
                      style={{ 
                        borderBottom: '1px solid var(--nier-border-muted)',
                        backgroundColor: isChecked ? 'rgba(78,75,66,0.02)' : 'transparent',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '12px 15px' }}>
                        <button 
                          onClick={() => handleSelectToggle(post.id)}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', padding: 0 }}
                        >
                          {isChecked ? (
                            <CheckSquare size={14} style={{ color: 'var(--nier-accent)' }} />
                          ) : (
                            <Square size={14} />
                          )}
                        </button>
                      </td>
                      <td style={{ padding: '12px 15px', color: 'var(--nier-text-muted)', fontSize: '10px' }}>{post.id.slice(0, 10)}</td>
                      <td style={{ padding: '12px 15px', fontWeight: 'bold' }}>{post.title}</td>
                      <td style={{ padding: '12px 15px' }}>
                        <span 
                          style={{ 
                            fontSize: '9px', 
                            padding: '2px 6px', 
                            border: `1px solid ${post.status === 'published' ? 'var(--nier-border)' : 'var(--nier-accent)'}`,
                            color: post.status === 'published' ? 'inherit' : 'var(--nier-accent)',
                            fontWeight: 'bold'
                          }}
                        >
                          {post.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 15px' }}>{post.date}</td>
                      <td style={{ padding: '12px 15px', color: 'var(--nier-text-muted)', fontSize: '11px' }}>{post.category}</td>
                      <td style={{ padding: '12px 15px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            className="nier-btn small" 
                            style={{ padding: '2px 6px', fontSize: '10px' }}
                            onClick={() => handleEditPost(post)}
                            title="Edit"
                          >
                            <Edit3 size={10} />
                          </button>
                          <button 
                            className="nier-btn small" 
                            style={{ padding: '2px 6px', fontSize: '10px' }}
                            onClick={() => handleDuplicate(post)}
                            title="Duplicate"
                          >
                            <Copy size={10} />
                          </button>
                          <button 
                            className="nier-btn small" 
                            style={{ padding: '2px 6px', fontSize: '10px', color: 'var(--nier-accent)', borderColor: 'var(--nier-accent)' }}
                            onClick={(e) => handleDeleteClick(post.id, e)}
                            title="Purge"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: 'var(--nier-text-muted)', fontStyle: 'italic' }}>
                      NO DATABASE LOGS RECORDED
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', alignItems: 'center', marginTop: '10px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
              <button 
                className="nier-btn small" 
                disabled={currentPage === 1}
                onClick={() => { Sound.playClick(); setCurrentPage(currentPage - 1); }}
              >
                <ChevronLeft size={14} />
              </button>
              <span>PAGE {currentPage} OF {totalPages}</span>
              <button 
                className="nier-btn small" 
                disabled={currentPage === totalPages}
                onClick={() => { Sound.playClick(); setCurrentPage(currentPage + 1); }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}

      {view === 'editor' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Editor Header Nav */}
          <div className="admin-header-bar">
            <h2 style={{ fontSize: '18px', margin: 0, fontFamily: 'var(--font-mono)' }}>
              {activePost ? `[ MODIFY RECORD // ${activePost.id.toUpperCase()} ]` : '[ COMPOSE NEW DATABASE RECORD ]'}
            </h2>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="nier-btn small" onClick={loadAutosaveBackup} title="Load backup snapshot">
                [ RESTORE BACKUP ]
              </button>
              <button 
                className="nier-btn small" 
                onClick={() => { Sound.playClick(); setView('list'); }}
                style={{ gap: '4px' }}
              >
                <Undo2 size={12} /> [ RETURN INDEX ]
              </button>
            </div>
          </div>

          {/* Input Form Grids */}
          <div className="admin-dashboard-grid">
            
            {/* Left Inputs */}
            <div className="nier-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              {/* Record Title */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                <label style={{ fontFamily: 'var(--font-mono)' }}>RECORD TITLE</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Optimized Pathfinding Matrices in YoRHa HUDs"
                  style={{ backgroundColor: 'var(--nier-bg)', border: '1px solid var(--nier-border)', color: 'var(--nier-text)', padding: '8px 12px', fontFamily: 'var(--font-sans)', fontSize: '13px' }}
                />
              </div>

              {/* Slug, Category, Featured Image grid */}
              <div className="admin-grid-1-2" style={{ fontSize: '13px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontFamily: 'var(--font-mono)' }}>RECORD SLUG</label>
                  <input 
                    type="text" 
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="pathfinding-optimization-matrix"
                    style={{ backgroundColor: 'var(--nier-bg)', border: '1px solid var(--nier-border)', color: 'var(--nier-text)', padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontFamily: 'var(--font-mono)' }}>MODULE CATEGORY</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ backgroundColor: 'var(--nier-bg)', border: '1px solid var(--nier-border)', color: 'var(--nier-text)', padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                  >
                    <option value="SOFTWARE">SOFTWARE</option>
                    <option value="ALGORITHMS">ALGORITHMS</option>
                    <option value="ART & CULTURE">ART & CULTURE</option>
                    <option value="SYSTEMS">SYSTEMS</option>
                  </select>
                </div>
              </div>

              {/* Tags, Featured image */}
              <div className="admin-grid-2-1" style={{ fontSize: '13px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontFamily: 'var(--font-mono)' }}>TAGS (COMMA SEPARATED)</label>
                  <input 
                    type="text" 
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="pathfinding, algorithms, 2d-grids"
                    style={{ backgroundColor: 'var(--nier-bg)', border: '1px solid var(--nier-border)', color: 'var(--nier-text)', padding: '8px 12px', fontFamily: 'var(--font-sans)', fontSize: '13px' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontFamily: 'var(--font-mono)' }}>FEATURED IMAGE URL</label>
                  <input 
                    type="text" 
                    value={featuredImage}
                    onChange={(e) => setFeaturedImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    style={{ backgroundColor: 'var(--nier-bg)', border: '1px solid var(--nier-border)', color: 'var(--nier-text)', padding: '8px 12px', fontSize: '12px' }}
                  />
                </div>
              </div>

              {/* Summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                <label style={{ fontFamily: 'var(--font-mono)' }}>PREVIEW SUMMARY</label>
                <input 
                  type="text" 
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="A brief metadata summary for search indexes..."
                  style={{ backgroundColor: 'var(--nier-bg)', border: '1px solid var(--nier-border)', color: 'var(--nier-text)', padding: '8px 12px', fontFamily: 'var(--font-sans)', fontSize: '13px' }}
                />
              </div>

              {/* Markdown Content Editor */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontFamily: 'var(--font-mono)' }}>MARKDOWN CONTENT</label>
                  
                  {/* Text Editor toolbar */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="nier-btn small" style={{ padding: '2px 6px' }} onClick={() => insertTextAtCursor('**', '**')} title="Bold">
                      <Bold size={10} />
                    </button>
                    <button className="nier-btn small" style={{ padding: '2px 6px' }} onClick={() => insertTextAtCursor('`', '`')} title="Inline Code">
                      <Code size={10} />
                    </button>
                    <button className="nier-btn small" style={{ padding: '2px 6px' }} onClick={() => insertTextAtCursor('```typescript\n', '\n```')} title="Code Block">
                      <Code size={10} style={{ strokeWidth: 3 }} />
                    </button>
                    <button className="nier-btn small" style={{ padding: '2px 6px' }} onClick={() => insertTextAtCursor('$', '$')} title="Inline Math">
                      <Percent size={10} />
                    </button>
                    <button className="nier-btn small" style={{ padding: '2px 6px' }} onClick={() => insertTextAtCursor('[', '](url)')} title="Hyperlink">
                      <Link size={10} />
                    </button>
                  </div>
                </div>

                <textarea 
                  id="md-textarea"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write content using markdown syntax here..."
                  rows={15}
                  style={{
                    backgroundColor: 'var(--nier-bg)',
                    border: '1px solid var(--nier-border)',
                    color: 'var(--nier-text)',
                    padding: '12px',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    resize: 'vertical',
                    lineHeight: '1.4'
                  }}
                />
              </div>

              {/* SEO metadata */}
              <div style={{ borderTop: '1px solid var(--nier-border-muted)', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--nier-text-muted)' }}>SEO META CONFIGURATION</h4>
                <div className="admin-grid-1-1" style={{ fontSize: '13px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontFamily: 'var(--font-mono)' }}>META TITLE</label>
                    <input type="text" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="Meta title..." style={{ backgroundColor: 'var(--nier-bg)', border: '1px solid var(--nier-border)', color: 'var(--nier-text)', padding: '6px 10px', fontSize: '12px' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontFamily: 'var(--font-mono)' }}>META DESCRIPTION</label>
                    <input type="text" value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} placeholder="Meta description..." style={{ backgroundColor: 'var(--nier-bg)', border: '1px solid var(--nier-border)', color: 'var(--nier-text)', padding: '6px 10px', fontSize: '12px' }} />
                  </div>
                </div>
              </div>

              {/* Publish / Draft buttons */}
              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button 
                  className="nier-btn" 
                  onClick={() => handleSave('published')}
                  style={{ flex: 1, gap: '6px' }}
                >
                  <Save size={14} /> [ SAVE AND PUBLISH LOG ]
                </button>
                <button 
                  className="nier-btn" 
                  onClick={() => handleSave('draft')}
                  style={{ flex: 1, color: 'var(--nier-accent)', borderColor: 'var(--nier-accent)' }}
                >
                  [ SAVE AS LOCAL DRAFT ]
                </button>
              </div>

            </div>

            {/* Right Live Preview Panel */}
            <div className="nier-panel" style={{ display: 'flex', flexDirection: 'column', maxHeight: '720px', overflowY: 'auto' }}>
              <h3 style={{ fontSize: '13px', color: 'var(--nier-accent)', borderBottom: '1px solid var(--nier-border-muted)', paddingBottom: '6px', marginBottom: '15px' }}>
                YoRHa REAL-TIME PREVIEW
              </h3>
              
              {title || content ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ borderBottom: '2px solid var(--nier-border)', paddingBottom: '12px', marginBottom: '15px' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--nier-accent)' }}>
                      [{category.toUpperCase()}] // COMPILE_STATUS: LIVE
                    </div>
                    <h2 style={{ fontSize: '18px', fontFamily: 'var(--font-mono)', margin: '4px 0 0 0' }}>
                      {title || 'UNTITLED OPERATION'}
                    </h2>
                  </div>

                  <div style={{ fontSize: '13px', textAlign: 'justify', color: 'var(--nier-text)' }} onClick={handleCodeCopyClick}>
                    {content ? (
                      <div dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(content) }} />
                    ) : (
                      <p style={{ fontStyle: 'italic', color: 'var(--nier-text-muted)' }}>Awaiting compile inputs...</p>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--nier-text-muted)', fontFamily: 'var(--font-mono)', fontSize: '11px', height: '300px' }}>
                  AWAITING LIVE COMPILE INPUTS
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* Confirmation overlays */}
      {confirmDeleteId && (
        <ConfirmationDialog 
          message="Confirm purging this log record from the YoRHa database archive? This operation is permanent."
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {confirmBulkDelete && (
        <ConfirmationDialog 
          message={`Confirm purging ${selectedIds.length} selected records from the database registry?`}
          onConfirm={handleBulkDeleteConfirm}
          onCancel={() => setConfirmBulkDelete(false)}
        />
      )}

      {/* Toast popup */}
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
export default Posts;
