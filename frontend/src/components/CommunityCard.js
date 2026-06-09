import React, { useRef, useState } from 'react';
import { toJpeg } from 'html-to-image';
import { useTranslation } from 'react-i18next';

export default function CommunityCard({ post, fullView = false }) {
  const { t } = useTranslation();
  const cardRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const shareUrl = `${window.location.origin}/community/${post.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toJpeg(cardRef.current, { quality: 0.95, backgroundColor: '#fff' });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `simplesize-${post.id?.slice(0, 8) || 'study'}.jpg`;
      a.click();
    } catch (e) { console.error(e); }
    setDownloading(false);
  };

  const dateStr = post.createdAt?.toDate
    ? post.createdAt.toDate().toLocaleDateString('en-GB', { year: 'numeric', month: 'short' })
    : '';

  const Section = ({ label, content }) => content ? (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#55D1E3', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: '#3a3f5c', lineHeight: 1.6 }}>{content}</div>
    </div>
  ) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* The card itself — this is what gets exported */}
      <div ref={cardRef} style={{
        background: '#fff',
        borderRadius: 16,
        border: '1.5px solid #e8edf4',
        padding: fullView ? '32px 36px' : '22px 24px',
        maxWidth: fullView ? 680 : 420,
        width: '100%',
        boxShadow: '0 4px 24px #55D1E308',
        fontFamily: 'Nunito, Arial, sans-serif',
        position: 'relative',
      }}>
        {/* Header bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/logo_simplesize.png" alt="SimpleSize" style={{ width: 24, height: 24, borderRadius: 6 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#8A93B2', letterSpacing: '0.04em' }}>SIMPLESIZE.SCIENCE</span>
          </div>
          <span style={{
            background: '#f0fbfd', color: '#1a8fa8',
            borderRadius: 20, fontSize: 10, fontWeight: 700,
            padding: '3px 10px', letterSpacing: '0.06em', textTransform: 'uppercase'
          }}>
            {post.test_type || 'Study'}
          </span>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'linear-gradient(90deg,#55D1E3,#f9b448,#e8edf4)', marginBottom: 16, borderRadius: 2 }} />

        {/* Title + meta */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: fullView ? 22 : 17, fontWeight: 800, color: '#2F344A', lineHeight: 1.25, marginBottom: 6 }}>
            {post.title}
          </div>
          <div style={{ fontSize: 12, color: '#8A93B2', fontWeight: 500 }}>
            {post.author}{post.institution ? ` · ${post.institution}` : ''}{dateStr ? ` · ${dateStr}` : ''}
          </div>
        </div>

        {/* Content sections */}
        <Section label={t('community.card_theory')} content={post.theory} />
        <Section label={t('community.card_design')} content={post.design} />
        <Section label={t('community.card_hypotheses')} content={post.hypotheses} />
        <Section label={t('community.card_results')} content={post.results} />

        {/* Photo */}
        {post.photoUrl && (
          <div style={{ marginTop: 12, marginBottom: 8 }}>
            <img src={post.photoUrl} alt="Study figure"
              style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 10, border: '1px solid #edf1f7' }} />
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #f0f3f8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, color: '#C8D0E7', fontWeight: 600 }}>Designed with SimpleSize</span>
          <span style={{ fontSize: 10, color: '#C8D0E7' }}>simplesize.science</span>
        </div>
      </div>

      {/* Action buttons (outside card, not in export) */}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button onClick={handleCopy} style={btnStyle('#f0fbfd', '#1a8fa8', '#d0f0f8')}>
          {copied ? t('community.copied') : t('community.share')}
        </button>
        <button onClick={handleDownload} disabled={downloading} style={btnStyle('#f9f5ff', '#7c5cbf', '#ede5ff')}>
          {downloading ? '...' : t('community.download')}
        </button>
      </div>
    </div>
  );
}

function btnStyle(bg, color, border) {
  return {
    background: bg, color, border: `1.5px solid ${border}`,
    borderRadius: 8, padding: '6px 14px',
    fontSize: 12, fontWeight: 700, cursor: 'pointer',
    fontFamily: 'Nunito, Arial, sans-serif',
  };
}
