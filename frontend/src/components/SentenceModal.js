import React, { useState } from 'react';
import styles from './SentenceModal.module.css';

const TEST_LABELS_FR = {
  ttest:           't-test indépendant',
  ttest_paired:    't-test apparié',
  anova:           'ANOVA inter-sujets',
  anova_factorial: 'ANOVA factorielle',
  anova_rm:        'ANOVA mesures répétées',
  anova_mixed:     'ANOVA mixte',
  lmm:             'modèle linéaire mixte (LMM)',
  correlation:     'test de corrélation de Pearson',
  chi2:            'test du chi²',
  regression:      'régression linéaire multiple',
};

function buildSentence({ result, selectedTest, alpha, power, f, mdeMode, design }) {
  const testLabel = TEST_LABELS_FR[selectedTest] || selectedTest;
  const interNames = (design.interFactors || []).filter(f => f.levels?.length >= 2).map(f => f.name);
  const intraNames = (design.intraFactors || []).filter(f => f.levels?.length >= 2).map(f => f.name);

  const designDesc = [
    interNames.length > 0 ? `facteur(s) entre-sujets (${interNames.join(', ')})` : '',
    intraNames.length > 0 ? `facteur(s) intra-sujets (${intraNames.join(', ')})` : '',
  ].filter(Boolean).join(' et ');

  const alphaStr = alpha;
  const powerStr = Math.round(power * 100);

  if (!result) {
    return `[Effectuez d'abord un calcul pour générer la phrase]`;
  }

  if (mdeMode && result.mde) {
    return `Avec un effectif de N = ${result.n_given || '?'} participants, ` +
      `une analyse de puissance (${testLabel}, α = ${alphaStr}, 1-β = ${powerStr}%) indique ` +
      `que la taille d'effet minimale détectable est ${result.label} = ${result.mde} ` +
      `(${result.interpretation?.label || ''}).`;
  }

  if (result.n_per_group) {
    const nMain = result.n_per_group;
    const nDesc = ['ttest_paired','correlation','chi2','regression'].includes(selectedTest)
      ? `N = ${nMain} participants au total`
      : `N = ${nMain} participants par groupe`;

    const esDesc = f ? `taille d'effet f = ${f}` : '';

    return `Une analyse de puissance a priori (${testLabel}${designDesc ? `, design : ${designDesc}` : ''}) ` +
      `indique qu'un effectif de ${nDesc} est nécessaire pour détecter un ${esDesc} ` +
      `avec une puissance de ${powerStr}% (α = ${alphaStr}). ` +
      `${result.interpretation ? `Cet effet correspond à : ${result.interpretation.label}.` : ''}`;
  }

  return `[Résultat non disponible]`;
}

export default function SentenceModal({ result, selectedTest, alpha, power, f, mdeMode, design, onClose }) {
  const sentence = buildSentence({ result, selectedTest, alpha, power, f, mdeMode, design });
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(sentence).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.title}>✍️ Sentence template</span>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <p className={styles.subtitle}>
          Copiez cette phrase dans la section <em>Participants</em> de votre article.
        </p>

        <div className={styles.sentenceBox}>
          {sentence}
        </div>

        <div className={styles.actions}>
          <button className={styles.copyBtn} onClick={copy}>
            {copied ? '✓ Copié !' : '📋 Copier'}
          </button>
          <button className={styles.closeBtn2} onClick={onClose}>Fermer</button>
        </div>

        <p className={styles.tip}>
          💡 Adaptez les noms de variables et la formulation à votre étude.
        </p>
      </div>
    </div>
  );
}
