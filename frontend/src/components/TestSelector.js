import React from 'react';
import styles from './TestSelector.module.css';

const TESTS = [
  {
    group: 'Comparaison de groupes',
    items: [
      { id: 'ttest',        icon: '⚖️',  label: 'T-test indépendant',   desc: '2 groupes, 1 mesure' },
      { id: 'ttest_paired', icon: '🔁',  label: 'T-test apparié',       desc: 'Avant/après, paires' },
      { id: 'anova',        icon: '📊',  label: 'ANOVA',                desc: '2+ groupes, between' },
    ],
  },
  {
    group: 'Mesures répétées',
    items: [
      { id: 'anova_rm',     icon: '🔄',  label: 'ANOVA RM',             desc: 'Within-subjects' },
      { id: 'anova_mixed',  icon: '🔀',  label: 'ANOVA mixte',          desc: 'Between + within' },
      { id: 'lmm',          icon: '🧬',  label: 'Modèle mixte (LMM)',   desc: 'Simulation' },
    ],
  },
  {
    group: 'Autres tests',
    items: [
      { id: 'correlation',  icon: '📈',  label: 'Corrélation',          desc: 'r de Pearson' },
      { id: 'chi2',         icon: '🔲',  label: 'Chi²',                 desc: 'Tableau de contingence' },
      { id: 'regression',   icon: '📉',  label: 'Régression multiple',  desc: 'F global, R²' },
    ],
  },
];

export default function TestSelector({ selected, onSelect }) {
  return (
    <aside className={styles.panel}>
      <div className={styles.panelTitle}>Tests disponibles</div>
      {TESTS.map(group => (
        <div key={group.group} className={styles.group}>
          <div className={styles.groupLabel}>{group.group}</div>
          {group.items.map(t => (
            <button
              key={t.id}
              className={`${styles.item} ${selected === t.id ? styles.active : ''}`}
              onClick={() => onSelect(t.id)}
            >
              <span className={styles.icon}>{t.icon}</span>
              <span className={styles.text}>
                <span className={styles.label}>{t.label}</span>
                <span className={styles.desc}>{t.desc}</span>
              </span>
            </button>
          ))}
        </div>
      ))}
    </aside>
  );
}
