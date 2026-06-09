import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

// Admin key is set via Vercel env var REACT_APP_ADMIN_KEY
// If not set, defaults to 'simplesize-admin' — CHANGE THIS in Vercel dashboard
const ADMIN_KEY = process.env.REACT_APP_ADMIN_KEY || 'simplesize-admin';

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState('');
  const [pwdError, setPwdError] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('pending'); // 'pending' | 'approved'

  const handleLogin = (e) => {
    e.preventDefault();
    if (pwd === ADMIN_KEY) { setAuthed(true); loadPosts(); }
    else { setPwdError(true); setTimeout(() => setPwdError(false), 2000); }
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'submissions'), orderBy('createdAt', 'desc')));
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const approve = async (id) => {
    await updateDoc(doc(db, 'submissions', id), { approved: true });
    setPosts(prev => prev.map(p => p.id === id ? { ...p, approved: true } : p));
  };

  const reject = async (id) => {
    if (!window.confirm('Delete this submission permanently?')) return;
    await deleteDoc(doc(db, 'submissions', id));
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  const filtered = posts.filter(p => tab === 'pending' ? !p.approved : p.approved);

  if (!authed) {
    return (
      <div style={{ maxWidth: 360, margin: '80px auto', padding: '0 24px' }}>
        <form onSubmit={handleLogin} style={{
          background: '#fff', borderRadius: 16, padding: '32px',
          boxShadow: '0 4px 32px #0002', border: '1.5px solid #e8edf4',
        }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 18, color: '#2F344A' }}>Admin access</h2>
          <input
            type="password"
            value={pwd}
            onChange={e => setPwd(e.target.value)}
            placeholder="Password"
            autoFocus
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '10px 14px', borderRadius: 9,
              border: pwdError ? '1.5px solid #e05050' : '1.5px solid #d8e0ef',
              fontSize: 15, marginBottom: 14, fontFamily: 'Nunito, Arial, sans-serif',
            }}
          />
          {pwdError && <div style={{ color: '#e05050', fontSize: 13, marginBottom: 10 }}>Incorrect password</div>}
          <button type="submit" style={{
            width: '100%', padding: '11px', background: '#2F344A', color: '#55D1E3',
            border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'Nunito, Arial, sans-serif',
          }}>
            Sign in
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#2F344A' }}>
          Moderation — Community
        </h1>
        <button onClick={loadPosts} style={{
          background: '#F4F6F8', border: '1px solid #d8e0ef', color: '#2F344A',
          borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'Nunito, Arial, sans-serif',
        }}>
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #E7ECF2', paddingBottom: -1 }}>
        {['pending', 'approved'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: 'none', border: 'none',
            borderBottom: tab === t ? '2.5px solid #55D1E3' : '2.5px solid transparent',
            color: tab === t ? '#1a8fa8' : '#8A93B2',
            fontWeight: tab === t ? 700 : 500,
            fontSize: 14, padding: '6px 16px', cursor: 'pointer',
            fontFamily: 'Nunito, Arial, sans-serif', marginBottom: -2,
          }}>
            {t === 'pending' ? `Pending (${posts.filter(p => !p.approved).length})` : `Approved (${posts.filter(p => p.approved).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: '#B0B8D4', textAlign: 'center', padding: '40px 0' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: '#B0B8D4', textAlign: 'center', padding: '40px 0', fontSize: 14 }}>
          {tab === 'pending' ? 'No pending submissions.' : 'No approved posts yet.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(post => (
            <div key={post.id} style={{
              background: '#fff', borderRadius: 14, padding: '20px 24px',
              border: '1.5px solid #e8edf4', boxShadow: '0 2px 12px #0001',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#2F344A', marginBottom: 4 }}>{post.title}</div>
                  <div style={{ fontSize: 13, color: '#8A93B2', marginBottom: 10 }}>
                    {post.author}{post.institution ? ` · ${post.institution}` : ''}
                    {post.email ? ` · ${post.email}` : ''}
                  </div>
                  {['theory', 'design', 'hypotheses', 'results'].map(field => post[field] ? (
                    <div key={field} style={{ marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#55D1E3', marginRight: 8 }}>{field}</span>
                      <span style={{ fontSize: 13, color: '#3a3f5c' }}>{post[field].slice(0, 180)}{post[field].length > 180 ? '…' : ''}</span>
                    </div>
                  ) : null)}
                  {post.photoUrl && (
                    <img src={post.photoUrl} alt="Figure"
                      style={{ marginTop: 10, maxHeight: 120, borderRadius: 8, border: '1px solid #e8edf4' }} />
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                  {!post.approved && (
                    <button onClick={() => approve(post.id)} style={actionBtn('#e6f9fc', '#1a8fa8', '#b3e8f0')}>
                      Approve
                    </button>
                  )}
                  <button onClick={() => reject(post.id)} style={actionBtn('#fef0f0', '#c0392b', '#fad4d4')}>
                    {post.approved ? 'Remove' : 'Reject'}
                  </button>
                </div>
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: '#C8D0E7' }}>
                ID: {post.id} · {post.createdAt?.toDate?.().toLocaleDateString() || 'unknown date'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const actionBtn = (bg, color, border) => ({
  background: bg, color, border: `1.5px solid ${border}`,
  borderRadius: 8, padding: '7px 18px',
  fontSize: 13, fontWeight: 700, cursor: 'pointer',
  fontFamily: 'Nunito, Arial, sans-serif',
  whiteSpace: 'nowrap',
});
