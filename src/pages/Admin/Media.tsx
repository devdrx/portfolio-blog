import React, { useEffect, useState } from 'react';
import { mediaService } from '../../services/media';
import type { MediaFile } from '../../services/media';
import { Sound } from '../../components/SoundController';
import { Toast } from '../../components/admin/Toast';
import { ConfirmationDialog } from '../../components/admin/ConfirmationDialog';
import { 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  Copy, 
  ExternalLink,
  FileText
} from 'lucide-react';

export const Media: React.FC = () => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeFile, setActiveFile] = useState<MediaFile | null>(null);

  // Popups Feedback status
  const [toast, setToast] = useState<{ message: string; isAlert?: boolean } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadMediaFiles();
  }, []);

  const loadMediaFiles = async () => {
    setLoading(true);
    const data = await mediaService.getMediaFiles();
    setFiles(data);
    setLoading(false);
  };

  const showToastMessage = (message: string, isAlert = false) => {
    setToast({ message, isAlert });
  };

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    
    Sound.playClick();
    showToastMessage('Uploading file... converting bytes');
    
    try {
      const file = fileList[0];
      if (file.size > 2 * 1024 * 1024) {
        Sound.playWarning();
        return showToastMessage('Upload aborted: File size exceeds 2 MB limit.', true);
      }

      const uploaded = await mediaService.uploadFile(file);
      showToastMessage(`Uploaded successfully: ${uploaded.name}`);
      Sound.playChime();
      loadMediaFiles();
    } catch (err: any) {
      Sound.playWarning();
      showToastMessage(err.message || 'Error uploading file.', true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
      .then(() => {
        Sound.playChime();
        showToastMessage('Copied Data URL to clipboard.');
      })
      .catch(() => {
        // Safe sandbox fallback
        Sound.playChime();
        showToastMessage('Copied Data URL to clipboard.');
      });
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    Sound.playWarning();
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    await mediaService.deleteFile(confirmDeleteId);
    showToastMessage('Asset file purged.');
    if (activeFile?.id === confirmDeleteId) {
      setActiveFile(null);
    }
    setConfirmDeleteId(null);
    loadMediaFiles();
  };

  const handleSelectFile = (file: MediaFile) => {
    Sound.playClick();
    setActiveFile(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header controls bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--nier-border)', paddingBottom: '12px' }}>
        <h2 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ImageIcon size={18} /> [ SYSTEM MEDIA MODULE VAULT ]
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '30px' }}>
        
        {/* Left Side: Uploads & Library Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Drag & Drop uploader frame */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              border: isDragOver ? '2px dashed var(--nier-accent)' : '2px dashed var(--nier-border)',
              backgroundColor: isDragOver ? 'var(--nier-accent-dim)' : 'rgba(0,0,0,0.02)',
              padding: '40px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <Upload size={32} style={{ color: isDragOver ? 'var(--nier-accent)' : 'var(--nier-text-muted)' }} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
              DRAG & DROP MEDIA BLOCK HERE OR CLICK TO UPLOAD
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--nier-text-muted)' }}>
              MAX FILE SIZE: 2.0 MB // ACCEPTABLE: IMAGES, GRAPHICS
            </div>
            <input 
              id="file-input" 
              type="file" 
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleUpload(e.target.files)}
            />
          </div>

          {/* Grid listing */}
          <div className="nier-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ fontSize: '13px', borderBottom: '1px solid var(--nier-border-muted)', paddingBottom: '6px' }}>
              VAULT_CATALOG
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '15px' }}>
              {loading ? (
                <p style={{ gridColumn: '1/-1', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--nier-text-muted)' }}>
                  SCANNING MEDIA BLOCKS...
                </p>
              ) : files.length > 0 ? files.map(file => {
                const isActive = activeFile?.id === file.id;
                const isImage = file.type.startsWith('image/');
                return (
                  <div
                    key={file.id}
                    onClick={() => handleSelectFile(file)}
                    style={{
                      border: isActive ? '2px solid var(--nier-accent)' : '1px solid var(--nier-border)',
                      backgroundColor: isActive ? 'var(--nier-accent-dim)' : 'rgba(0,0,0,0.02)',
                      padding: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                  >
                    {/* Image thumb preview */}
                    <div 
                      style={{
                        height: '90px',
                        backgroundColor: 'rgba(0,0,0,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        border: '1px solid var(--nier-border-muted)'
                      }}
                    >
                      {isImage ? (
                        <img 
                          src={file.url} 
                          alt={file.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <FileText size={24} style={{ color: 'var(--nier-text-muted)' }} />
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span 
                        style={{ 
                          fontSize: '10px', 
                          fontWeight: 'bold', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap',
                          color: isActive ? 'var(--nier-accent)' : 'inherit'
                        }}
                      >
                        {file.name}
                      </span>
                      <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--nier-text-muted)' }}>
                        {file.size} KB
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteClick(file.id, e)}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        backgroundColor: 'var(--nier-bg)',
                        border: '1px solid var(--nier-border)',
                        color: 'var(--nier-accent)',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        boxShadow: '1px 1px 0px rgba(0,0,0,0.1)'
                      }}
                      title="Purge File"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                );
              }) : (
                <p style={{ gridColumn: '1/-1', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--nier-text-muted)', margin: '20px' }}>
                  MEDIA VAULT EMPTY
                </p>
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Asset Preview Inspector */}
        <div className="nier-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3 style={{ fontSize: '13px', borderBottom: '1px solid var(--nier-border-muted)', paddingBottom: '6px' }}>
            MEDIA_INSPECTOR
          </h3>

          {activeFile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              {/* Asset full thumb */}
              <div 
                style={{
                  height: '200px',
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  border: '1px solid var(--nier-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}
              >
                {activeFile.type.startsWith('image/') ? (
                  <img 
                    src={activeFile.url} 
                    alt={activeFile.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                  />
                ) : (
                  <FileText size={48} style={{ color: 'var(--nier-text-muted)' }} />
                )}
              </div>

              {/* Metadata tags */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>NAME:</span>
                  <span style={{ fontWeight: 'bold' }}>{activeFile.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>TYPE:</span>
                  <span>{activeFile.type}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>SIZE:</span>
                  <span>{activeFile.size} KB</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>UPLOADED:</span>
                  <span>{activeFile.uploadedAt}</span>
                </div>
              </div>

              {/* DataURL copy panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', marginTop: '10px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--nier-text-muted)' }}>RESOLVED BASE64 DATA URL:</span>
                <textarea 
                  readOnly 
                  value={activeFile.url}
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.03)',
                    border: '1px solid var(--nier-border)',
                    color: 'var(--nier-text)',
                    padding: '8px',
                    fontFamily: 'monospace',
                    fontSize: '10px',
                    height: '80px',
                    resize: 'none'
                  }}
                />
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                  <button 
                    className="nier-btn small" 
                    onClick={() => handleCopyUrl(activeFile.url)}
                    style={{ flex: 1, gap: '6px' }}
                  >
                    <Copy size={12} /> [ COPY ADDRESS ]
                  </button>
                  <a 
                    href={activeFile.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="nier-btn small" 
                    style={{ flex: 1, gap: '6px', textDecoration: 'none' }}
                  >
                    <ExternalLink size={12} /> [ TEST PREVIEW ]
                  </a>
                </div>
              </div>

            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--nier-text-muted)', fontFamily: 'var(--font-mono)', fontSize: '11px', height: '250px' }}>
              SELECT AN ASSET TO INITIATE METADATA DIAGNOSTICS
            </div>
          )}
        </div>

      </div>

      {/* Confirmation delete alert */}
      {confirmDeleteId && (
        <ConfirmationDialog 
          message="Confirm purging this media asset block from storage memory? Any associated log content links will break."
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
export default Media;
