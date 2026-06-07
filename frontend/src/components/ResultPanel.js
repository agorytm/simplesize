import React, { useRef } from 'react';
import styles from './ResultPanel.module.css';
import PowerCurve from './PowerCurve';

const TEST_LABELS = {
  ttest:        'T-test indépendant',
  ttest_paired: 'T-test apparié',
  anova:        'ANOVA',
  anova_rm:     'ANOVA mesures répétées',
  anova_mixed:  'ANOVA mixte',
  lmm:          'Modèle mixte (LMM)',
  correlation:  'Corrélation de Pearson',
  chi2:         'Chi²',
  regression:   'Régression multiple',
};

const LEVEL_COLORS = {
  trivial: '#8A93A6',
  small:   '#3B6FE0',
  medium:  '#F5A623',
  large:   '#0FA88A',
};

export default function ResultPanel({ result, error, loading, test, params }) {
  const panelRef = useRef();

  async function handleExport() {
    if (!result) return;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(panelRef.current, { scale: 2, backgroundColor: '#fff' });
      const link = document.createElement('a');
      link.download = `simplesize_${test}_n${result.n_per_group || result.mde || ''}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      alert('Export non disponible en mode dev. Sera actif dans la version buildée.');
    }
  }

  function handleCopy() {
    if (!result) return;
    const lines = buildTextReport(result, test, params);
    navigator.clipboard.writeText(lines).then(() => alert('Copié dans le presse-papier !'));
  }

  if (loading) {
    return (
      <div className={styles.panel}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Calcul en cours…</p>
          {test === 'lmm' && <p className={styles.lmmHint}>Simulation Monte-Carlo sur serveur cloud…</p>}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.panel}>
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠️</span>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className={styles.panel}>
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📊</span>
          <p>Les résultats apparaîtront ici après le calcul.</p>
        </div>
      </div>
    );
  }

  const interp = result.interpretation;
  const isMde  = result.mde !== undefined;
  const mainVal = isMde ? result.mde : result.n_per_group;
  const mainLabel = isMde ? (result.label || 'MDE') : 'participants / groupe';

  return (
    <div className={styles.panel} ref={panelRef}>
      <div className={styles.header}>
        <span className={styles.testBadge}>{TEST_LABELS[test] || test}</span>
        <div className={styles.actions}>
          <button className={styles.actionBtn} onClick={handleCopy} title="Copier le rapport">📋</button>
          <button className={styles.actionBtn} onClick={handleExport} title="Exporter en PNG">💾</button>
        </div>
      </div>

      {/* Résultat principal */}
      <div className={styles.mainResult}>
        <div className={styles.bigNum}>{mainVal}</div>
        <div className={styles.bigLabel}>{mainLabel}</div>
        {isMde && <div className={styles.mdeNote}>avec N = {params?.n_given} disponible</div>}
      </div>

      {/* Interprétation */}
      {interp && (
        <div
          className={styles.interpBadge}
          style={{ background: (LEVEL_COLORS[interp.level] || '#8A93A6') + '18',
                   color: LEVEL_COLORS[interp.level] || '#8A93A6',
                   borderColor: LEVEL_COLORS[interp.level] || '#8A93A6' }}
        >
          {interp.label}
        </div>
      )}

      {/* Message LMM */}
      {result.message && (
        <div className={styles.message}>{result.message}</div>
      )}

      {/* Courbe de puissance */}
      {!isMde && (
        <div className={styles.curveWrap}>
          <PowerCurve
            test={test}
            params={params}
            targetN={result.n_per_group}
          />
        </div>
      )}

      {/* Détails paramètres */}
      <div className={styles.paramGrid}>
        <ParamRow label="Test" value={TEST_LABELS[test] || test} />
        {params?.alpha   && <ParamRow label="α" value={params.alpha} />}
        {params?.power   && <ParamRow label="Puissance cible" value={`${Math.round(params.power * 100)}%`} />}
        {!isMde && params?.f && test !== 'regression' && (
          <ParamRow label="Taille d'effet" value={params.f} />
        )}
        {result.estimated_power && (
          <ParamRow label="Puissance estimée" value={`${Math.round(result.estimated_power * 100)}%`} />
        )}
        {result.random_factor && (
          <ParamRow label="Facteur aléatoire" value={result.random_factor} />
        )}
      </div>

      {/* Texte pré-rédigé pour publication */}
      <div className={styles.reportSection}>
        <div className={styles.reportTitle}>📝 Texte pour publication</div>
        <div className={styles.reportText}>
          {buildPublicationText(result, test, params)}
        </div>
      </div>
    </div>
  );
}

function ParamRow({ label, value }) {
  return (
    <div className={styles.paramRow}>
      <span className={styles.paramLabel}>{label}</span>
      <span className={styles.paramValue}>{value}</span>
    </div>
  );
}

function buildPublicationText(result, test, params) {
  const alpha  = params?.alpha || 0.05;
  const power  = params?.power || 0.80;
  const f      = params?.f || '';
  const n      = result.n_per_group;
  const mde    = result.mde;

  const testNames = {
    ttest:        't de Student indépendant',
    ttest_paired: 't de Student apparié',
    anova:        'analyse de variance (ANOVA)',
    anova_rm:     'ANOVA à mesures répétées',
    anova_mixed:  'ANOVA mixte',
    lmm:          'modèle linéaire mixte (LMM)',
    correlation:  'test de corrélation de Pearson',
    chi2:         'test du chi²',
    regression:   'régression linéaire multiple',
  };
  const tName = testNames[test] || test;

  if (mde !== undefined) {
    return `Avec ${params?.n_given} participants par groupe, un ${tName} avec α = ${alpha} atteint une puissance de ${Math.round(power * 100)} % pour détecter un effet minimal de ${mde} (${result.label || 'taille d\'effet'}).`;
  }

  return `Une analyse de puissance a priori (G*Power, SimpleSize) pour un ${tName} avec α = ${alpha}, une puissance de ${Math.round(power * 100)} % et une taille d'effet f = ${f} indique qu'un échantillon de ${n} participants par groupe est nécessaire (N total = ${n * (params?.group_levels?.length || 1)}).`;
}

function buildTextReport(result, test, params) {
  const lines = [
    '=== SIMPLESIZE — RAPPORT DE CALCUL ===',
    `Test : ${test}`,
    `α : ${params?.alpha}`,
    `Puissance : ${params?.power}`,
    result.n_per_group ? `N par groupe : ${result.n_per_group}` : `MDE : ${result.mde}`,
    '',
    buildPublicationText(result, test, params),
  ];
  return lines.join('\n');
}
