import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Sound } from '../components/SoundController';
import { postsService } from '../services/posts';
import type { BlogPost } from '../services/posts';
import { BookOpen, Settings, Clock, ChevronRight } from 'lucide-react';
import { marked } from 'marked';
import katex from 'katex';
import hljs from 'highlight.js';

// Setup marked code block custom renderer for YoRHa style and highlight.js integration
const renderer = {
  code(firstArg: any, secondArg?: any) {
    // Handle both old marked signature (code, lang) and new marked signature ({ text, lang })
    let text = '';
    let lang = 'plaintext';
    if (typeof firstArg === 'object' && firstArg !== null) {
      text = firstArg.text || '';
      lang = firstArg.lang || 'plaintext';
    } else {
      text = firstArg || '';
      lang = secondArg || 'plaintext';
    }

    let highlighted = text;
    try {
      if (hljs.getLanguage(lang)) {
        highlighted = hljs.highlight(text, { language: lang }).value;
      } else {
        highlighted = hljs.highlightAuto(text).value;
      }
    } catch (err) {
      console.warn(err);
    }

    const escapedText = encodeURIComponent(text);

    return `
      <div class="code-block-container" style="margin: 18px 0; border: 1px solid var(--nier-border); background-color: rgba(0,0,0,0.03); box-shadow: 1px 1px 0px rgba(0,0,0,0.05);">
        <div style="display: flex; justify-content: space-between; align-items: center; background-color: var(--nier-bg-alt); padding: 4px 10px; font-size: 11px; font-family: var(--font-mono); border-bottom: 1px solid var(--nier-border-muted);">
          <span>CODE_MODULE // ${lang.toUpperCase()}</span>
          <button 
            class="nier-btn small" 
            style="padding: 2px 6px; font-size: 9px; cursor: pointer;"
            onclick="navigator.clipboard.writeText(decodeURIComponent('${escapedText}')).then(() => { this.textContent = '[ COPIED ]'; setTimeout(() => this.textContent = '[ COPY ]', 1500); }).catch(() => { this.textContent = '[ COPIED ]'; setTimeout(() => this.textContent = '[ COPY ]', 1500); });"
          >
            [ COPY ]
          </button>
        </div>
        <pre style="padding: 12px; margin: 0; overflow-x: auto; font-family: var(--font-mono); font-size: 13px; text-align: left; line-height: 1.4; white-space: pre;"><code class="hljs language-${lang}">${highlighted}</code></pre>
      </div>
    `;
  }
};

marked.use({ renderer });

// Math preprocessor using KaTeX
const preprocessMath = (text: string): string => {
  let temp = text;

  // 1. Process block math $$ ... $$
  temp = temp.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    try {
      return `<div class="katex-block-wrapper" style="margin: 18px 0; text-align: center; overflow-x: auto; overflow-y: hidden; width: 100%;">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`;
    } catch (err) {
      return `<div class="katex-error" style="color: var(--nier-accent);">${math}</div>`;
    }
  });

  // 2. Process inline math $ ... $
  temp = temp.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
    } catch (err) {
      return `<span class="katex-error" style="color: var(--nier-accent);">${math}</span>`;
    }
  });

  return temp;
};

// Render full markdown to HTML (Exported for admin editor preview)
export const renderMarkdownToHtml = (markdown: string): string => {
  if (!markdown) return '';
  const preprocessed = preprocessMath(markdown);
  return marked.parse(preprocessed, { async: false }) as string;
};

// Simple media query hook
const useIsMobile = (breakpoint = 992) => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
  );
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);
  return isMobile;
};

export const Blog: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [activePostId, setActivePostId] = useState<string | null>(null);

  // Customize Reading options
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [fontFamily, setFontFamily] = useState<'mono' | 'sans'>('mono');

  // Search and Category states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  // Mobile drawer state
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef(0);
  const touchCurrentXRef = useRef(0);
  const isDraggingRef = useRef(false);

  // Initial load
  useEffect(() => {
    const loadBlogPosts = async () => {
      const data = await postsService.getPosts({ includeDrafts: false });
      setPosts(data);
      if (data.length > 0) {
        setActivePostId(data[0].id);
      }
    };
    loadBlogPosts();
  }, []);

  const selectPost = (postId: string) => {
    Sound.playClick();
    setActivePostId(postId);
    if (isMobile) setDrawerOpen(false);
  };

  const getFontSizeStyle = () => {
    switch (fontSize) {
      case 'small':
        return { fontSize: '13px', lineHeight: '1.5' };
      case 'large':
        return { fontSize: '17px', lineHeight: '1.7' };
      case 'medium':
      default:
        return { fontSize: '15px', lineHeight: '1.6' };
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.summary.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = 
      selectedCategoryFilter === 'ALL' || post.category === selectedCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  const activePost = posts.find(p => p.id === activePostId);

  // Touch drag handlers for the drawer
  const DRAWER_WIDTH = 280;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchCurrentXRef.current = e.touches[0].clientX;
    isDraggingRef.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current || !drawerRef.current) return;
    touchCurrentXRef.current = e.touches[0].clientX;
    const delta = touchCurrentXRef.current - touchStartXRef.current;

    if (drawerOpen) {
      // Dragging to close (swipe left)
      const clampedX = Math.min(0, Math.max(-DRAWER_WIDTH, delta));
      drawerRef.current.style.transition = 'none';
      drawerRef.current.style.transform = `translateX(${clampedX}px)`;
    } else {
      // Dragging to open (swipe right)
      const clampedX = Math.max(0, Math.min(DRAWER_WIDTH, delta));
      drawerRef.current.style.transition = 'none';
      drawerRef.current.style.transform = `translateX(${-DRAWER_WIDTH + clampedX}px)`;
    }
  }, [drawerOpen]);

  const handleTouchEnd = useCallback(() => {
    if (!isDraggingRef.current || !drawerRef.current) return;
    isDraggingRef.current = false;
    const delta = touchCurrentXRef.current - touchStartXRef.current;
    drawerRef.current.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';

    if (drawerOpen) {
      // If swiped left more than 80px, close
      if (delta < -80) {
        setDrawerOpen(false);
        drawerRef.current.style.transform = `translateX(-${DRAWER_WIDTH}px)`;
      } else {
        drawerRef.current.style.transform = 'translateX(0)';
      }
    } else {
      // If swiped right more than 80px, open
      if (delta > 80) {
        setDrawerOpen(true);
        drawerRef.current.style.transform = 'translateX(0)';
      } else {
        drawerRef.current.style.transform = `translateX(-${DRAWER_WIDTH}px)`;
      }
    }
  }, [drawerOpen]);

  // Sync drawer transform with state changes
  useEffect(() => {
    if (!drawerRef.current || !isMobile) return;
    drawerRef.current.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
    drawerRef.current.style.transform = drawerOpen ? 'translateX(0)' : `translateX(-${DRAWER_WIDTH}px)`;
  }, [drawerOpen, isMobile]);

  // Archive index content (shared between desktop and mobile drawer)
  const archiveIndexContent = (
    <div className="nier-panel" style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: isMobile ? 'none' : '580px', height: isMobile ? '100%' : undefined }}>
      <h3 style={{ fontSize: '14px', borderBottom: '1px solid var(--nier-border-muted)', paddingBottom: '6px', margin: 0 }}>ARCHIVE INDEX</h3>
      
      {/* Filter inputs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <input 
          type="text"
          placeholder="SEARCH MODULES..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            backgroundColor: 'var(--nier-bg)',
            border: '1px solid var(--nier-border)',
            color: 'var(--nier-text)',
            padding: '6px 10px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            width: '100%',
            boxSizing: 'border-box'
          }}
        />
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
          {['ALL', 'SOFTWARE', 'ALGORITHMS', 'ART & CULTURE', 'SYSTEMS'].map(cat => (
            <button
              key={cat}
              onClick={() => { Sound.playHover(); setSelectedCategoryFilter(cat); }}
              style={{
                border: '1px solid var(--nier-border-muted)',
                background: selectedCategoryFilter === cat ? 'var(--nier-text)' : 'transparent',
                color: selectedCategoryFilter === cat ? 'var(--nier-bg)' : 'var(--nier-text)',
                padding: '2px 6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontSize: '8px'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: '1', paddingRight: '4px' }}>
        {filteredPosts.length > 0 ? filteredPosts.map((post) => (
          <div
            key={post.id}
            onClick={() => selectPost(post.id)}
            style={{
              border: activePostId === post.id ? '2px solid var(--nier-text)' : '1px solid var(--nier-border-muted)',
              padding: '10px',
              cursor: 'pointer',
              backgroundColor: activePostId === post.id ? 'rgba(78,75,66,0.05)' : 'transparent',
            }}
            className="glitch-hover"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--nier-text-muted)', marginBottom: '4px' }}>
              <span>[{post.category}]</span>
              <span>{post.date}</span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', lineHeight: '1.3' }}>
              {post.title}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
              <span style={{ fontSize: '10px', color: 'var(--nier-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={10} /> {post.readTime}
              </span>
            </div>
          </div>
        )) : (
          <p style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--nier-text-muted)', fontStyle: 'italic', textAlign: 'center', marginTop: '20px' }}>
            NO COMPATIBLE LOGS LOCATED
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="content-section" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header */}
      <div className="title-decorator">
        <span className="tag">DATA</span>
        <h2>[03_BLOG] // KNOWLEDGE_ARCHIVES</h2>
        <div className="line" />
        <span className="tag">{posts.length} RECORDS</span>
      </div>

      {/* Mobile: Archive drawer toggle button */}
      {isMobile && (
        <button
          className="nier-btn small"
          onClick={() => { Sound.playClick(); setDrawerOpen(true); }}
          style={{ alignSelf: 'flex-start', fontSize: '11px' }}
        >
          <BookOpen size={12} /> OPEN ARCHIVE INDEX
        </button>
      )}

      {/* Mobile: Swipeable drawer overlay */}
      {isMobile && (
        <>
          {/* Backdrop */}
          {drawerOpen && (
            <div
              onClick={() => setDrawerOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 998,
                transition: 'opacity 0.3s ease',
              }}
            />
          )}
          {/* Drawer panel */}
          <div
            ref={drawerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: `${DRAWER_WIDTH}px`,
              height: '100vh',
              backgroundColor: 'var(--nier-bg)',
              borderRight: '2px solid var(--nier-border)',
              zIndex: 999,
              display: 'flex',
              flexDirection: 'column',
              padding: '20px 15px',
              transform: `translateX(-${DRAWER_WIDTH}px)`,
              transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              overflowY: 'auto',
              boxShadow: drawerOpen ? '4px 0 20px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            {/* Drawer close handle */}
            <button
              onClick={() => setDrawerOpen(false)}
              style={{
                alignSelf: 'flex-end',
                background: 'transparent',
                border: '1px solid var(--nier-border-muted)',
                color: 'var(--nier-text-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                padding: '4px 8px',
                cursor: 'pointer',
                marginBottom: '12px',
              }}
            >
              [ CLOSE ]
            </button>
            {archiveIndexContent}

            {/* Drag handle tab on right edge */}
            <div
              style={{
                position: 'absolute',
                right: '-28px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '28px',
                height: '64px',
                backgroundColor: 'var(--nier-bg-alt)',
                border: '1px solid var(--nier-border)',
                borderLeft: 'none',
                borderRadius: '0 6px 6px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              onClick={() => { Sound.playClick(); setDrawerOpen(!drawerOpen); }}
            >
              <ChevronRight
                size={16}
                style={{
                  color: 'var(--nier-text-muted)',
                  transform: drawerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease',
                }}
              />
            </div>
          </div>
        </>
      )}

      {/* READ RECORDS INTERFACE */}
      <div className="blog-grid">
        
        {/* Post Selection Side panel (desktop only) */}
        {!isMobile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {archiveIndexContent}
          </div>
        )}

        {/* Reader Panel */}
        <div className="nier-panel" style={{ display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
          {activePost ? (
            <div style={{ display: 'flex', flexDirection: 'column', flex: '1' }}>
              
              {/* Reading settings options */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.03)', padding: '6px 12px', borderBottom: '1px solid var(--nier-border-muted)', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <Settings size={12} style={{ color: 'var(--nier-text-muted)' }} />
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--nier-text-muted)' }}>VIEW_OPT:</span>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                    <button 
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: fontFamily === 'sans' ? 'bold' : 'normal', textDecoration: fontFamily === 'sans' ? 'underline' : 'none' }}
                      onClick={() => { Sound.playHover(); setFontFamily('sans'); }}
                    >
                      SANS
                    </button>
                    <span style={{ color: 'var(--nier-border-muted)' }}>/</span>
                    <button 
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: fontFamily === 'mono' ? 'bold' : 'normal', textDecoration: fontFamily === 'mono' ? 'underline' : 'none' }}
                      onClick={() => { Sound.playHover(); setFontFamily('mono'); }}
                    >
                      MONO
                    </button>
                  </div>
                  
                  <span style={{ color: 'var(--nier-border-muted)' }}>|</span>

                  <div style={{ display: 'flex', gap: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                    <button 
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: fontSize === 'small' ? 'bold' : 'normal', textDecoration: fontSize === 'small' ? 'underline' : 'none' }}
                      onClick={() => { Sound.playHover(); setFontSize('small'); }}
                    >
                      A-
                    </button>
                    <button 
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: fontSize === 'medium' ? 'bold' : 'normal', textDecoration: fontSize === 'medium' ? 'underline' : 'none' }}
                      onClick={() => { Sound.playHover(); setFontSize('medium'); }}
                    >
                      A
                    </button>
                    <button 
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: fontSize === 'large' ? 'bold' : 'normal', textDecoration: fontSize === 'large' ? 'underline' : 'none' }}
                      onClick={() => { Sound.playHover(); setFontSize('large'); }}
                    >
                      A+
                    </button>
                  </div>
                </div>
              </div>

              {/* Article Header */}
              <div style={{ borderBottom: '2px solid var(--nier-border)', paddingBottom: '12px', marginBottom: '20px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--nier-accent)', marginBottom: '6px' }}>
                  [{activePost.category}] // RECORDED: {activePost.date}
                </div>
                <h2 style={{ fontSize: '24px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: 'var(--nier-text)' }}>
                  {activePost.title}
                </h2>
              </div>

              {/* Content Area */}
              <div 
                style={{
                  ...getFontSizeStyle(),
                  fontFamily: fontFamily === 'mono' ? 'var(--font-mono)' : 'var(--font-sans)',
                  textAlign: 'justify',
                  color: 'var(--nier-text)',
                }}
                className="blog-content"
              >
                <div dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(activePost.content) }} />
              </div>

            </div>
          ) : (
            <div style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--nier-text-muted)' }}>
              <BookOpen size={48} style={{ strokeWidth: 1, marginBottom: '15px' }} />
              <p style={{ fontFamily: 'var(--font-mono)' }}>SELECT A DATABASE MODULE TO BEGIN DIAGNOSTICS</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
export default Blog;
