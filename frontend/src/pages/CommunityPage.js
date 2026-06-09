import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import CommunityCard from '../components/CommunityCard';
import { useTranslation } from 'react-i18next';

const WORD_LIMITS = { theory: 200, design: 150, hypotheses: 100, results: 150 };

function countWords(str) {
  return str.trim() === '' ? 0 : str.trim().split(/\s+/).length;
}

function WordCount({ field, value }) {
  const count = countWords(value);
  const max = WORD_LIMITS[field];
  const over = count > max;
  return (
    <span style={{ fontSize: 11, color: over ? '#e05050' : '#B0B8D4', marginLeft: 6, fontWeight: 600 }}>
      {count}/{max}
    </span>
  );
}

const EMPTY_FORM = { title: '', author: '', institution: '', email: '', theory: '', design: '', hypotheses: '', results: '' };

export default function CommunityPage() {
  const { t, i18n } = useTranslation();
  const fr = i18n.language === 'fr';
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'ok' | 'error'

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      // Load all and filter client-side to avoid requiring composite Firestore index
      const snap = await getDocs(query(collection(db, 'submissions'), orderBy('createdAt', 'desc')));
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.approved === true));
    } catch (e) {
      console.error('Failed to load posts:', e);
      setPosts([]);
    }
    setLoading(false);
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  // Try to import design from current session
  const importFromSession = () => {
    const raw = sessionStorage.getItem('ss_last_design');
    if (!raw) { alert(fr ? 'Aucune session active trouvée.' : 'No active session found.'); return; }
    try {
      const data = JSON.parse(raw);
      const lines = [];
      if (data.interFactors?.length) {
        data.interFactors.filter(f => f.name).forEach(f => lines.push(`Between-subjects: ${f.name} (${f.levels.join(', ')})`));
      }
      if (data.intraFactors?.length) {
        data.intraFactors.filter(f => f.name).forEach(f => lines.push(`Within-subjects: ${f.name} (${f.levels.join(', ')})`));
      }
      if (data.selectedTest) lines.push(`Test: ${data.selectedTest}`);
      if (data.alpha) lines.push(`α = ${data.alpha}, Power = ${data.power}`);
      setForm(prev => ({ ...prev, design: lines.join(' · ') }));
    } catch { alert(fr ? 'Impossible de lire la session.' : 'Could not read session data.'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate word limits
    for (const [field, max] of Object.entries(WORD_LIMITS)) {
      if (countWords(form[field]) > max) {
        alert(`${field}: ${fr ? 'trop de mots' : 'too many words'} (max ${max})`);
        return;
      }
    }
    if (!form.title || !form.author) {
      alert(fr ? 'Titre et auteur requis.' : 'Title and author are required.');
      return;
    }
    setSubmitting(true);
    try {
      let photoUrl = null;
      if (photo) {
        const storageRef = ref(storage, `submissions/${Date.now()}_${photo.name}`);
        await uploadBytes(storageRef, photo);
        photoUrl = await getDownloadURL(storageRef);
      }
      await addDoc(collection(db, 'submissions'), {
        ...form,
        photoUrl,
        approved: false,
        createdAt: serverTimestamp(),
      });
      setSubmitStatus('ok');
      setForm(EMPTY_FORM);
      setPhoto(null);
      setPhotoPreview(null);
      setTimeout(() => { setSubmitStatus(null); setFormOpen(false); }, 3000);
    } catch (err) {
      console.error(err);
      setSubmitStatus('error');
    }
    setSubmitting(false);
  };

  const fieldStyle = {
    width: '100%', borderRadius: 9, border: '1.5px solid #d8e0ef',
    padding: '8px 12px', fontSize: 14, color: '#2F344A',
    fontFamily: 'Nunito, Arial, sans-serif', boxSizing: 'border-box',
    background: '#fafcff', resize: 'vertical',
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 36 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#2F344A', margin: '0 0 8px' }}>
            {t('community.title')}
          </h1>
          <p style={{ color: '#8A93B2', fontSize: 15, margin: 0 }}>{t('community.subtitle')}</p>
        </div>
        <button onClick={() => setFormOpen(true)} style={{
          background: 'linear-gradient(90deg,#55D1E3,#4fc6e1)', color: '#fff',
          border: 'none', borderRadius: 12, padding: '11px 24px',
          fontSize: 14, fontWeight: 800, cursor: 'pointer',
          boxShadow: '0 3px 16px #55D1E344', flexShrink: 0,
          fontFamily: 'Nunito, Arial, sans-serif',
        }}>
          + {t('community.share_yours')}
        </button>
      </div>

      {/* Posts grid */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#B0B8D4', padding: '60px 0', fontSize: 15 }}>
          {fr ? 'Chargement...' : 'Loading...'}
        </div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#B0B8D4', padding: '60px 0', fontSize: 15 }}>
          {t('community.no_posts')}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24 }}>
          {posts.map(post => <CommunityCard key={post.id} post={post} />)}
        </div>
      )}

      {/* Submission modal */}
      {formOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 8000,
          background: 'rgba(47,52,74,0.45)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          overflowY: 'auto', padding: '40px 16px',
        }} onClick={e => { if (e.target === e.currentTarget) setFormOpen(false); }}>
          <div style={{
            background: '#fff', borderRadius: 20, padding: '32px 36px',
            maxWidth: 580, width: '100%',
            boxShadow: '0 8px 48px #0003',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#2F344A' }}>{t('community.form_title')}</h2>
              <button onClick={() => setFormOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#B0B8D4' }}>✕</button>
            </div>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: '#8A93B2' }}>{t('community.form_subtitle')}</p>

            <form onSubmit={handleSubmit}>
              {/* Title */}
              <label style={labelStyle}>{t('community.field_title')} *</label>
              <input style={fieldStyle} value={form.title} maxLength={150}
                onChange={e => setForm({ ...form, title: e.target.value })} required />

              {/* Author + institution */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
                <div>
                  <label style={labelStyle}>{t('community.field_author')} *</label>
                  <input style={fieldStyle} value={form.author}
                    onChange={e => setForm({ ...form, author: e.target.value })} required />
                </div>
                <div>
                  <label style={labelStyle}>{t('community.field_institution')}</label>
                  <input style={fieldStyle} value={form.institution}
                    onChange={e => setForm({ ...form, institution: e.target.value })} />
                </div>
              </div>

              {/* Email (hidden) */}
              <div style={{ marginTop: 14 }}>
                <label style={labelStyle}>{t('community.field_email')}</label>
                <input style={fieldStyle} type="email" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>

              {/* IMRAD fields */}
              {[
                { field: 'theory', label: t('community.field_theory') },
                { field: 'design', label: t('community.field_design'), importBtn: true },
                { field: 'hypotheses', label: t('community.field_hypotheses') },
                { field: 'results', label: t('community.field_results') },
              ].map(({ field, label, importBtn }) => (
                <div key={field} style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>
                      {label}
                      <WordCount field={field} value={form[field]} />
                      <span style={{ fontWeight: 400, fontSize: 11, color: '#B0B8D4', marginLeft: 4 }}>
                        ({WORD_LIMITS[field]} {t('community.max_words')})
                      </span>
                    </label>
                    {importBtn && (
                      <button type="button" onClick={importFromSession} style={{
                        fontSize: 11, fontWeight: 700, color: '#1a8fa8',
                        background: '#f0fbfd', border: '1px solid #b3e8f0',
                        borderRadius: 7, padding: '3px 10px', cursor: 'pointer',
                        fontFamily: 'Nunito, Arial, sans-serif',
                      }}>
                        {t('community.import_session')}
                      </button>
                    )}
                  </div>
                  <textarea style={{ ...fieldStyle, minHeight: 80 }}
                    value={form[field]}
                    onChange={e => setForm({ ...form, [field]: e.target.value })}
                  />
                </div>
              ))}

              {/* Photo */}
              <div style={{ marginTop: 16 }}>
                <label style={labelStyle}>{t('community.field_photo')}</label>
                <input type="file" accept="image/*" onChange={handlePhoto}
                  style={{ fontSize: 13, color: '#5a6080' }} />
                {photoPreview && (
                  <img src={photoPreview} alt="preview"
                    style={{ marginTop: 10, maxHeight: 160, borderRadius: 8, border: '1px solid #e8edf4' }} />
                )}
              </div>

              {/* Submit */}
              {submitStatus === 'ok' && (
                <div style={{ marginTop: 16, color: '#1a8fa8', fontWeight: 700, fontSize: 14 }}>
                  {t('community.submitted_ok')}
                </div>
              )}
              {submitStatus === 'error' && (
                <div style={{ marginTop: 16, color: '#e05050', fontWeight: 700, fontSize: 14 }}>
                  {t('community.submitted_error')}
                </div>
              )}
              <button type="submit" disabled={submitting} style={{
                marginTop: 22, width: '100%',
                background: 'linear-gradient(90deg,#55D1E3,#4fc6e1)', color: '#fff',
                border: 'none', borderRadius: 12, padding: '13px',
                fontSize: 15, fontWeight: 800, cursor: 'pointer',
                fontFamily: 'Nunito, Arial, sans-serif',
                opacity: submitting ? 0.7 : 1,
              }}>
                {submitting ? t('community.submitting') : t('community.submit')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', fontWeight: 700, fontSize: 13, color: '#2F344A', marginBottom: 5 };
