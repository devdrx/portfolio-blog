import React, { useEffect, useState } from 'react';
import { otakuService } from '../../services/otaku';
import type { OtakuRecord } from '../../services/otaku';
import { Sound } from '../../components/SoundController';
import { Toast } from '../../components/admin/Toast';
import { ConfirmationDialog } from '../../components/admin/ConfirmationDialog';
import { 
  Film, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Undo2, 
  ExternalLink 
} from 'lucide-react';

export const OtakuRecords: React.FC = () => {
  const [records, setRecords] = useState<OtakuRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Active view states: 'list' | 'editor'
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [activeRecord, setActiveRecord] = useState<OtakuRecord | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Anime');
  const [rating, setRating] = useState<number>(10);
  const [existentialThreat, setExistentialThreat] = useState<number>(5);
  const [note, setNote] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [kitsuUrl, setKitsuUrl] = useState('');
  const [tags, setTags] = useState('');
  const [accentColor, setAccentColor] = useState('hsl(210, 30%, 50%)');

  // Popup feedback status
  const [toast, setToast] = useState<{ message: string; isAlert?: boolean } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await otakuService.getRecords();
      setRecords(data);
    } catch (err: any) {
      console.error(err);
      showToastMessage('Failed to load otaku database records.', true);
    } finally {
      setLoading(false);
    }
  };

  const showToastMessage = (message: string, isAlert = false) => {
    setToast({ message, isAlert });
  };

  const handleCreateRecord = () => {
    Sound.playClick();
    setActiveRecord(null);
    setTitle('');
    setType('Anime');
    setRating(10);
    setExistentialThreat(5);
    setNote('');
    setCoverUrl('');
    setKitsuUrl('');
    setTags('');
    setAccentColor('hsl(210, 30%, 50%)');
    setView('editor');
  };

  const handleEditRecord = (rec: OtakuRecord) => {
    Sound.playClick();
    setActiveRecord(rec);
    setTitle(rec.title);
    setType(rec.type);
    setRating(rec.rating);
    setExistentialThreat(rec.existentialThreat);
    setNote(rec.note);
    setCoverUrl(rec.coverUrl);
    setKitsuUrl(rec.kitsuUrl);
    setTags(rec.tags.join(', '));
    setAccentColor(rec.accentColor);
    setView('editor');
  };

  const handleSaveRecord = async () => {
    if (!title || !note || !coverUrl || !kitsuUrl) {
      Sound.playWarning();
      return showToastMessage('Validation error: Title, Note, Cover URL, and Kitsu URL are required.', true);
    }

    if (rating < 0 || rating > 10 || existentialThreat < 0 || existentialThreat > 10) {
      Sound.playWarning();
      return showToastMessage('Validation error: Rating and Existential Threat must be between 0 and 10.', true);
    }

    const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);

    const payload = {
      title,
      type,
      rating: Number(rating),
      existentialThreat: Number(existentialThreat),
      note,
      coverUrl,
      kitsuUrl,
      tags: tagsArray,
      accentColor
    };

    try {
      if (activeRecord) {
        await otakuService.updateRecord(activeRecord.id, payload);
        showToastMessage('Otaku classified dossier updated.');
      } else {
        await otakuService.createRecord(payload);
        showToastMessage('New otaku dossier registered.');
      }
      Sound.playChime();
      loadRecords();
      setView('list');
    } catch (err: any) {
      console.error(err);
      showToastMessage(err.message || 'Failed saving record.', true);
    }
  };

  const handleDeleteClick = (id: string) => {
    Sound.playWarning();
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      const ok = await otakuService.deleteRecord(confirmDeleteId);
      if (ok) {
        showToastMessage('Otaku dossier purged from archives.');
      } else {
        showToastMessage('Failed deleting record.', true);
      }
      setConfirmDeleteId(null);
      loadRecords();
    } catch (err: any) {
      showToastMessage(err.message || 'Deletion failed.', true);
    }
  };

  const renderStarBlocks = (rating: number) => {
    const filled = Math.round(rating);
    const empty = 10 - filled;
    return '\u2588'.repeat(filled) + '\u2591'.repeat(empty);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {view === 'list' && (
        <>
          {/* Header controls bar */}
          <div className="admin-header-bar">
            <h2 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Film size={18} /> [ OTAKU CLASSIFIED RECORDS ARCHIVE ]
            </h2>
            <button className="nier-btn small" onClick={handleCreateRecord} style={{ gap: '6px' }}>
              <Plus size={14} /> [ DECRYPT NEW DOSSIER ]
            </button>
          </div>

          {/* Grid layout cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {loading ? (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--nier-text-muted)', textAlign: 'center', gridColumn: '1/-1' }}>
                ACCESSING SECURE DATA CYCLES...
              </p>
            ) : records.length > 0 ? records.map(rec => (
              <div 
                key={rec.id} 
                className="nier-panel" 
                style={{ 
                  display: 'flex', 
                  gap: '14px',
                  borderLeft: `4px solid ${rec.accentColor || 'var(--nier-border)'}`
                }}
              >
                {/* Poster Frame */}
                <div style={{
                  width: '72px',
                  height: '100px',
                  flexShrink: 0,
                  border: '1px solid var(--nier-border-muted)',
                  overflow: 'hidden',
                  position: 'relative',
                  backgroundColor: 'var(--nier-bg-alt)'
                }}>
                  <img 
                    src={rec.coverUrl} 
                    alt={rec.title} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(0.1) contrast(1.05)' }} 
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: rec.accentColor || 'var(--nier-accent)',
                    color: '#fff',
                    fontSize: '8px',
                    fontFamily: 'var(--font-mono)',
                    padding: '2px 0',
                    textAlign: 'center',
                    fontWeight: 'bold'
                  }}>
                    {rec.type.toUpperCase()}
                  </div>
                </div>

                {/* Info block */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '4px' }}>
                    <h3 style={{ fontSize: '14px', margin: 0, fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {rec.title}
                    </h3>
                  </div>

                  {/* Rating */}
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: 'var(--nier-text-muted)' }}>RATING: </span>
                    <span style={{ color: rec.accentColor, letterSpacing: '1px' }}>{renderStarBlocks(rec.rating)}</span>
                    <span style={{ color: 'var(--nier-text-muted)', marginLeft: '6px' }}>({rec.rating}/10)</span>
                  </div>

                  {/* Threat */}
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: 'var(--nier-text-muted)' }}>THREAT: </span>
                    <span style={{ fontWeight: 'bold', color: rec.accentColor }}>{rec.existentialThreat}/10</span>
                  </div>

                  {/* Genre tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                    {rec.tags.map(t => (
                      <span 
                        key={t} 
                        style={{ 
                          fontSize: '8px', 
                          fontFamily: 'var(--font-mono)', 
                          border: `1px solid ${rec.accentColor}66`, 
                          padding: '1px 4px',
                          color: rec.accentColor
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Note preview */}
                  <p style={{ 
                    fontSize: '11px', 
                    color: 'var(--nier-text-muted)', 
                    margin: '4px 0 0 0', 
                    lineHeight: '1.4',
                    fontStyle: 'italic',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    "{rec.note}"
                  </p>

                  {/* Action row */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: 'auto', borderTop: '1px solid var(--nier-border-muted)', paddingTop: '8px' }}>
                    <a 
                      href={rec.kitsuUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ display: 'flex', alignItems: 'center', color: 'var(--nier-text-muted)', textDecoration: 'none' }}
                      title="VIEW ON KITSU"
                    >
                      <ExternalLink size={12} />
                    </a>
                    <button 
                      className="nier-btn small" 
                      style={{ padding: '2px 8px' }} 
                      onClick={() => handleEditRecord(rec)}
                    >
                      <Edit3 size={11} />
                    </button>
                    <button 
                      className="nier-btn small" 
                      style={{ padding: '2px 8px', color: 'var(--nier-accent)', borderColor: 'var(--nier-accent)' }} 
                      onClick={() => handleDeleteClick(rec.id)}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            )) : (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', border: '1px dashed var(--nier-border-muted)' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--nier-text-muted)', margin: 0 }}>
                  NO CLASSIFIED DOSSIERS RECORDED // ACCESS GRANTED TO SEED OR REGISTER NEW FILES
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {view === 'editor' && (
        <>
          <div className="admin-header-bar">
            <h2 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Film size={18} /> [ {activeRecord ? `MODIFY RECORD_0x${activeRecord.id.replace('otaku-', '').slice(0, 6)}` : 'REGISTER NEW DOSSIER'} ]
            </h2>
            <button className="nier-btn small" onClick={() => { Sound.playClick(); setView('list'); }} style={{ gap: '6px' }}>
              <Undo2 size={14} /> [ DISCARD CHANGES ]
            </button>
          </div>

          <div className="nier-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '30px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              
              {/* Left Form Block */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--nier-text-muted)' }}>DOSSIER TITLE*</label>
                  <input 
                    type="text" 
                    className="nier-input" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    placeholder="e.g. Serial Experiments Lain"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--nier-text-muted)' }}>CLASSIFICATION_TYPE</label>
                  <select 
                    className="nier-input" 
                    value={type} 
                    onChange={e => setType(e.target.value)}
                  >
                    <option value="Anime">Anime</option>
                    <option value="Game">Game</option>
                    <option value="Manga">Manga</option>
                    <option value="Novel">Novel</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--nier-text-muted)' }}>DIAGNOSTIC_RATING (0-10)*</label>
                    <input 
                      type="number" 
                      step="0.1"
                      min="0"
                      max="10"
                      className="nier-input" 
                      value={rating} 
                      onChange={e => setRating(parseFloat(e.target.value) || 0)} 
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--nier-text-muted)' }}>EXISTENTIAL_THREAT (0-10)*</label>
                    <input 
                      type="number" 
                      step="0.1"
                      min="0"
                      max="10"
                      className="nier-input" 
                      value={existentialThreat} 
                      onChange={e => setExistentialThreat(parseFloat(e.target.value) || 0)} 
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--nier-text-muted)' }}>THEME ACCENT COLOR (HSL)*</label>
                  <input 
                    type="text" 
                    className="nier-input" 
                    value={accentColor} 
                    onChange={e => setAccentColor(e.target.value)} 
                    placeholder="e.g. hsl(210, 30%, 50%)"
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <div style={{ width: '16px', height: '16px', backgroundColor: accentColor, border: '1px solid var(--nier-border-muted)' }} />
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--nier-text-muted)' }}>Accent Highlight Preview</span>
                  </div>
                </div>
              </div>

              {/* Right Form Block */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--nier-text-muted)' }}>GENRE TAG CHIPS (COMMA SEPARATED)</label>
                  <input 
                    type="text" 
                    className="nier-input" 
                    value={tags} 
                    onChange={e => setTags(e.target.value)} 
                    placeholder="e.g. PSYCHOLOGICAL, CYBERPUNK, MECHA"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--nier-text-muted)' }}>POSTER COVER IMAGE URL*</label>
                  <input 
                    type="text" 
                    className="nier-input" 
                    value={coverUrl} 
                    onChange={e => setCoverUrl(e.target.value)} 
                    placeholder="https://media.kitsu.app/..."
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--nier-text-muted)' }}>KITSU.IO REFERENCE URL*</label>
                  <input 
                    type="text" 
                    className="nier-input" 
                    value={kitsuUrl} 
                    onChange={e => setKitsuUrl(e.target.value)} 
                    placeholder="https://kitsu.io/anime/..."
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--nier-text-muted)' }}>OPERATOR COMMENTS / DOSSIER NOTES (MAX 350 CHARS)*</label>
                  <textarea 
                    rows={4}
                    className="nier-input" 
                    value={note} 
                    onChange={e => setNote(e.target.value)} 
                    placeholder="Enter database notes or diagnostic observations..."
                    style={{ resize: 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* Action controls row */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '2px solid var(--nier-border)', paddingTop: '20px', marginTop: '10px' }}>
              <button className="nier-btn" onClick={handleSaveRecord} style={{ padding: '10px 24px', gap: '8px' }}>
                <Save size={16} /> [ COMMENCE DOSSIER SECTOR SAVE ]
              </button>
            </div>
          </div>
        </>
      )}

      {confirmDeleteId && (
        <ConfirmationDialog
          message="WARNING: Commencing dossier purge. This action deletes the records permanently from secure nodes. Proceed?"
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
export default OtakuRecords;
