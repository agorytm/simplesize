import React from 'react';
import { useTranslation } from 'react-i18next';

export default function DonatePage() {
  const { t, i18n } = useTranslation();
  const fr = i18n.language === 'fr';

  return (
    <div style={pageStyle}>
      <div style={heroCard}>
        <img src="/logo_simplesize.png" alt="SimpleSize" style={{ width: 64, height: 64, borderRadius: 16, marginBottom: 18 }} />
        <h1 style={{ fontSize: 30, fontWeight: 800, color: '#2F344A', marginBottom: 10, marginTop: 0 }}>
          {t('donate.title')}
        </h1>
        <p style={{ color: '#5a6080', fontSize: 16, maxWidth: 480, lineHeight: 1.7, margin: '0 auto 28px' }}>
          {t('donate.subtitle').split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}
        </p>

        {/* BMC Button */}
        <a
          href="https://www.buymeacoffee.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: '#FFDD00', color: '#000',
            borderRadius: 12, padding: '13px 28px',
            fontSize: 16, fontWeight: 800, textDecoration: 'none',
            boxShadow: '0 4px 20px #FFDD0044',
            transition: 'transform 0.15s',
          }}
        >
          <span style={{ fontSize: 22 }}>☕</span>
          {t('donate.button')}
        </a>

        <div style={{ marginTop: 16, fontSize: 12, color: '#B0B8D4' }}>
          {fr ? 'Le lien Buy Me a Coffee sera configuré prochainement.' : 'Buy Me a Coffee link coming soon.'}
        </div>
      </div>

      {/* Why section */}
      <div style={{ maxWidth: 540, margin: '40px auto 0' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#2F344A', marginBottom: 16 }}>
          {t('donate.why')}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(t('donate.reasons', { returnObjects: true })).map((reason, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'linear-gradient(135deg,#55D1E3,#4fc6e1)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 13, flexShrink: 0,
              }}>{i + 1}</div>
              <p style={{ margin: 0, fontSize: 14, color: '#3a3f5c', lineHeight: 1.6 }}>{reason}</p>
            </div>
          ))}
        </div>
      </div>

      <p style={{ textAlign: 'center', marginTop: 48, color: '#B0B8D4', fontSize: 14 }}>
        {t('donate.thanks')}
      </p>
    </div>
  );
}

const pageStyle = { maxWidth: 680, margin: '0 auto', padding: '40px 24px 80px', textAlign: 'center' };
const heroCard = {
  background: '#fff', borderRadius: 20,
  padding: '40px 32px', boxShadow: '0 4px 32px #55D1E310',
  border: '1.5px solid #e8edf4', textAlign: 'center',
};
