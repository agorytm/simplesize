import React from 'react';
import { useTranslation } from 'react-i18next';

const CHANGES = [
  {
    version: "2.1", date: "June 2026",
    items: [
      "Navigation menu with Tutorial, Community, Glossary, Examples, About, Donate pages",
      "Community page: share your IMRAD study card with other students",
      "EN / FR language toggle across the entire app",
      "Sentence template button moved into the design panel",
      "Gallery of pre-filled example designs",
      "Statistical glossary (key terms explained simply)",
    ]
  },
  {
    version: "2.0", date: "May 2026",
    items: [
      "Two design modes: Experimental design & Variables/relations",
      "'Variables & relations' tab: Correlation, Regression, Chi-square",
      "Design visualization displayed as soon as test is selected",
      "LMM simulation results displayed correctly",
      "'Run Analysis' button to recalculate without re-selecting the test",
      "Sentence template autofill for all test types",
    ]
  },
  {
    version: "1.5", date: "April 2026",
    items: [
      "Linear Mixed Model (LMM) power via Monte Carlo simulation",
      "Mixed ANOVA and Factorial ANOVA support",
      "Design Visualizer: graphical representation of experimental design",
      "Export design as JPEG",
    ]
  },
  {
    version: "1.0", date: "March 2026",
    items: [
      "Initial release: t-test, ANOVA, Repeated Measures ANOVA",
      "Cohen's d, f, r, w, f² effect sizes",
      "Sentence template (\"phrase à trous\") for beginner-friendly input",
      "Railway (Flask) backend + Vercel (React) frontend",
    ]
  },
];

export default function ChangelogPage() {
  const { i18n } = useTranslation();
  return (
    <div style={pageStyle}>
      <h1 style={h1}>{i18n.language === 'fr' ? 'Nouveautés' : 'Changelog'}</h1>
      <p style={subtitle}>{i18n.language === 'fr'
        ? "L'historique des évolutions de SimpleSize."
        : "The history of SimpleSize improvements."}</p>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {CHANGES.map(({ version, date, items }) => (
          <div key={version} style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
              <span style={{ background: '#2F344A', color: '#55D1E3', borderRadius: 8, padding: '4px 14px', fontWeight: 800, fontSize: 15 }}>
                v{version}
              </span>
              <span style={{ color: '#8A93B2', fontSize: 13 }}>{date}</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 7 }}>
              {items.map((item, i) => (
                <li key={i} style={{ fontSize: 14, color: '#3a3f5c', lineHeight: 1.55 }}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

const pageStyle = { maxWidth: 780, margin: '0 auto', padding: '40px 24px 80px' };
const h1 = { fontSize: 32, fontWeight: 800, color: '#2F344A', marginBottom: 8, marginTop: 0 };
const subtitle = { color: '#8A93B2', fontSize: 15, marginBottom: 40, marginTop: 0 };
