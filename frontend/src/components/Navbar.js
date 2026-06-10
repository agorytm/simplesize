import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const LINKS = [
  { to: '/',          key: 'calculator' },
  { to: '/tutorial',  key: 'tutorial'   },
  { to: '/community', key: 'community'  },
  { to: '/lexique',   key: 'glossary'   },
  { to: '/methods',   key: 'methods'    },
  { to: '/gallery',   key: 'examples'   },
  { to: '/about',     key: 'about'      },
  { to: '/donate',    key: 'donate'     },
];

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleLang = () => {
    const next = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(next);
    localStorage.setItem('ss_lang', next);
  };

  const isActive = (to) => to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9000,
      background: '#2F344A', height: 56,
      display: 'flex', alignItems: 'center',
      padding: '0 20px', gap: 0,
      boxShadow: '0 2px 16px #0002',
      fontFamily: 'Nunito, Arial, sans-serif'
    }}>
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', marginRight: 24, flexShrink: 0 }}>
        <img src="/logo_simplesize.png" alt="SimpleSize" style={{ width: 32, height: 32, borderRadius: 8 }} />
        <span style={{ color: '#fff', fontWeight: 800, fontSize: 17, letterSpacing: '-0.3px' }}>SimpleSize</span>
        <span style={{ color: '#8A93B2', fontWeight: 400, fontSize: 11, marginLeft: -4 }}>by Agorytm</span>
      </Link>

      {/* Desktop links */}
      <div style={{ display: 'flex', gap: 2, flex: 1, alignItems: 'center' }} className="nav-links-desktop">
        {LINKS.map(({ to, key }) => (
          <Link key={to} to={to} style={{
            color: isActive(to) ? '#55D1E3' : '#C8D0E7',
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: isActive(to) ? 700 : 500,
            padding: '6px 10px',
            borderRadius: 7,
            background: isActive(to) ? 'rgba(85,209,227,0.10)' : 'transparent',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}>
            {t(`nav.${key}`)}
          </Link>
        ))}
      </div>

      {/* Lang toggle */}
      <button onClick={toggleLang} style={{
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.15)',
        color: '#fff',
        borderRadius: 7,
        padding: '4px 11px',
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
        letterSpacing: '0.05em',
        flexShrink: 0,
        fontFamily: 'Nunito, Arial, sans-serif',
      }}>
        {i18n.language === 'fr' ? 'EN' : 'FR'}
      </button>

      {/* Hamburger for mobile */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          display: 'none',
          marginLeft: 12, background: 'none', border: 'none',
          color: '#fff', fontSize: 22, cursor: 'pointer',
          flexShrink: 0,
        }}
        className="nav-hamburger"
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={{
          position: 'absolute', top: 56, left: 0, right: 0,
          background: '#2F344A', borderTop: '1px solid #3d4360',
          padding: '8px 20px 16px',
          boxShadow: '0 8px 24px #0004',
        }}>
          {LINKS.map(({ to, key }) => (
            <Link key={to} to={to}
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'block', color: isActive(to) ? '#55D1E3' : '#C8D0E7',
                textDecoration: 'none', fontSize: 15, fontWeight: 600,
                padding: '9px 0', borderBottom: '1px solid #3d436022',
              }}>
              {t(`nav.${key}`)}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .nav-links-desktop { display: none !important; }
          .nav-hamburger { display: block !important; }
        }
      `}</style>
    </nav>
  );
}
