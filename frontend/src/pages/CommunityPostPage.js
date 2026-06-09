import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CommunityCard from '../components/CommunityCard';

export default function CommunityPostPage() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, 'submissions', id)).then(snap => {
      if (snap.exists()) setPost({ id: snap.id, ...snap.data() });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={center}>Loading...</div>;
  if (!post) return (
    <div style={center}>
      <p>Study not found.</p>
      <Link to="/community" style={{ color: '#55D1E3' }}>Back to community</Link>
    </div>
  );

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>
      <Link to="/community" style={{ color: '#8A93B2', fontSize: 13, textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>
        ← Back to Community
      </Link>
      <CommunityCard post={post} fullView={true} />
    </div>
  );
}

const center = { textAlign: 'center', padding: '80px 24px', color: '#8A93B2', fontSize: 15 };
