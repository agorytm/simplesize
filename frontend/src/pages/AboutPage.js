import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const TEAM = [
  {
    name: "Fondateur",
    role_en: "Founder & Developer",
    role_fr: "Fondateur & Développeur",
    bio_en: "Creator of SimpleSize & Agorytm SAS. Passionate about making statistical tools accessible to students.",
    bio_fr: "Créateur de SimpleSize & Agorytm SAS. Passionné par l'accessibilité des outils statistiques pour les étudiants.",
    avatar: null,
  },
  {
    name: "Your name here",
    role_en: "Contributor — coming soon",
    role_fr: "Contributeur — bientôt",
    bio_en: "Want to contribute to SimpleSize? Get in touch.",
    bio_fr: "Envie de contribuer à SimpleSize ? Contactez-nous.",
    avatar: null,
    placeholder: true,
  },
];

export default function AboutPage() {
  const { i18n } = useTranslation();
  const fr = i18n.language === 'fr';

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '40px 24px 80px' }}>
      {/* Hero */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 40 }}>
        <img src="/logo_simplesize.png" alt="SimpleSize"
          style={{ width: 72, height: 72, borderRadius: 18, boxShadow: '0 4px 20px #55D1E318' }} />
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#2F344A', margin: 0, marginBottom: 6 }}>
            {fr ? 'À propos de SimpleSize' : 'About SimpleSize'}
          </h1>
          <p style={{ margin: 0, color: '#8A93B2', fontSize: 15 }}>
            {fr
              ? 'Un G*Power pédagogique, fait pour les étudiants.'
              : 'A pedagogical G*Power, made for students.'}
          </p>
        </div>
      </div>

      {/* Mission */}
      <div style={card}>
        <h2 style={h2}>{fr ? 'Notre mission' : 'Our mission'}</h2>
        <p style={para}>
          {fr
            ? `SimpleSize est né d'un constat simple : les étudiants ont besoin de calculer la taille d'échantillon de leur étude, mais G*Power est opaque, technique, et intimidant. SimpleSize propose une alternative pédagogique : l'étudiant décrit son design, l'application propose les bons tests statistiques, et le calcul lui donne le N dont il a besoin.`
            : `SimpleSize was born from a simple observation: students need to calculate their study's sample size, but G*Power is opaque, technical, and intimidating. SimpleSize offers a pedagogical alternative: the student describes their design, the app proposes the right statistical tests, and the calculation gives them the N they need.`}
        </p>
      </div>

      {/* Agorytm */}
      <div style={card}>
        <h2 style={h2}>Agorytm</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, color: '#3a3f5c' }}>
          <div style={infoRow}>
            <span style={infoLabel}>{fr ? 'Forme juridique' : 'Legal form'}</span>
            <span>SAS (Société par Actions Simplifiée)</span>
          </div>
          <div style={infoRow}>
            <span style={infoLabel}>{fr ? 'Siège social' : 'Registered office'}</span>
            <span>14 Rue Victor Mercier, 93100 Montreuil, France</span>
          </div>
          <div style={infoRow}>
            <span style={infoLabel}>SIREN</span>
            <span>989 154 075</span>
          </div>
          <div style={infoRow}>
            <span style={infoLabel}>{fr ? 'Fondée' : 'Founded'}</span>
            <span>{fr ? '16 juillet 2025' : 'July 16, 2025'}</span>
          </div>
          <div style={infoRow}>
            <span style={infoLabel}>{fr ? 'Secteur' : 'Sector'}</span>
            <span>{fr ? 'Édition de logiciels applicatifs' : 'Application software publishing'}</span>
          </div>
        </div>
      </div>

      {/* Team */}
      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#2F344A', marginBottom: 20 }}>
        {fr ? "L'équipe" : 'The team'}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18, marginBottom: 40 }}>
        {TEAM.map((member) => (
          <div key={member.name} style={{
            ...card,
            opacity: member.placeholder ? 0.5 : 1,
            border: member.placeholder ? '1.5px dashed #C8D0E7' : '1.5px solid #e8edf4',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: member.placeholder ? '#f0f3f8' : 'linear-gradient(135deg,#55D1E3,#2F344A)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 20, fontWeight: 800, flexShrink: 0,
              }}>
                {member.placeholder ? '+' : member.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#2F344A' }}>{member.name}</div>
                <div style={{ fontSize: 12, color: '#8A93B2' }}>{fr ? member.role_fr : member.role_en}</div>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#5a6080', lineHeight: 1.6 }}>
              {fr ? member.bio_fr : member.bio_en}
            </p>
          </div>
        ))}
      </div>

      {/* Contact */}
      <div style={card}>
        <h2 style={h2}>{fr ? 'Contact' : 'Contact'}</h2>
        <p style={para}>
          {fr
            ? 'Pour toute question, suggestion ou collaboration : '
            : 'For any question, suggestion or collaboration: '}
          <a href="mailto:contact@agorytm.com" style={{ color: '#55D1E3', fontWeight: 700 }}>
            contact@agorytm.com
          </a>
        </p>
        <p style={{ ...para, marginTop: 8 }}>
          {fr
            ? 'Vous avez utilisé SimpleSize pour votre étude ? '
            : 'Did you use SimpleSize for your study? '}
          <Link to="/community" style={{ color: '#55D1E3', fontWeight: 700 }}>
            {fr ? 'Partagez-la dans la communauté.' : 'Share it in the community.'}
          </Link>
        </p>
      </div>
    </div>
  );
}

const card = {
  background: '#fff', borderRadius: 16, padding: '22px 24px',
  boxShadow: '0 2px 16px #55D1E308', border: '1.5px solid #e8edf4', marginBottom: 20,
};
const h2 = { fontSize: 18, fontWeight: 800, color: '#2F344A', marginTop: 0, marginBottom: 12 };
const para = { margin: 0, fontSize: 14, color: '#3a3f5c', lineHeight: 1.7 };
const infoRow = { display: 'flex', gap: 12, alignItems: 'flex-start' };
const infoLabel = { minWidth: 130, color: '#8A93B2', fontWeight: 600, fontSize: 13, flexShrink: 0 };
