import React, { useState, useEffect } from 'react';
import styles from './ParamPanel.module.css';
import Slider from './Slider';

const TEST_META = {
  ttest:        { label: 'T-test indépendant',  effectParam: 'f', effectLabel: "Cohen's d", effectDefault: 0.5, effectMin: 0.1, effectMax: 1.5 },
  ttest_paired: { label: 'T-test apparié',       effectParam: 'f', effectLabel: "Cohen's d", effectDefault: 0.5, effectMin: 0.1, effectMax: 1.5 },
  anova:        { label: 'ANOVA',                effectParam: 'f', effectLabel: "Cohen's f", effectDefault: 0.25, effectMin: 0.05, effectMax: 1.0 },
  anova_rm:     { label: 'ANOVA mesures répétées', effectParam: 'f', effectLabel: "Cohen's f", effectDefault: 0.25, effectMin: 0.05, effectMax: 1.0 },
  anova_mixed:  { label: 'ANOVA mixte',          effectParam: 'f', effectLabel: "Cohen's f", effectDefault: 0.25, effectMin: 0.05, effectMax: 1.0 },
  lmm:          { label: 'Modèle mixte (LMM)',   effectParam: 'f', effectLabel: "Cohen's f", effectDefault: 0.25, effectMin: 0.05, effectMax: 1.0 },
  correlation:  { label: 'Corrélation',          effectParam: 'r', effectLabel: "r de Pearson", effectDefault: 0.3, effectMin: 0.05, effectMax: 0.95 },
  chi2:         { label: 'Chi²',                 effectParam: 'f', effectLabel: "w de Cohen",  effectDefault: 0.3, effectMin: 0.05, effectMax: 1.0 },
  regression:   { label: 'Régression multiple',  effectParam: 'f2', effectLabel: "f² de Cohen", effectDefault: 0.15, effectMin: 0.01, effectMax: 1.5 },
};

const EFFECT_BENCHMARKS = {
  ttest:        [{ v: 0.2, l: 'Petit' }, { v: 0.5, l: 'Moyen' }, { v: 0.8, l: 'Grand' }],
  ttest_paired: [{ v: 0.2, l: 'Petit' }, { v: 0.5, l: 'Moyen' }, { v: 0.8, l: 'Grand' }],
  anova:        [{ v: 0.1, l: 'Petit' }, { v: 0.25, l: 'Moyen' }, { v: 0.4, l: 'Grand' }],
  anova_rm:     [{ v: 0.1, l: 'Petit' }, { v: 0.25, l: 'Moyen' }, { v: 0.4, l: 'Grand' }],
  anova_mixed:  [{ v: 0.1, l: 'Petit' }, { v: 0.25, l: 'Moyen' }, { v: 0.4, l: 'Grand' }],
  lmm:          [{ v: 0.1, l: 'Petit' }, { v: 0.25, l: 'Moyen' }, { v: 0.4, l: 'Grand' }],
  correlation:  [{ v: 0.1, l: 'Faible' }, { v: 0.3, l: 'Modérée' }, { v: 0.5, l: 'Forte' }],
  chi2:         [{ v: 0.1, l: 'Petit' }, { v: 0.3, l: 'Moyen' }, { v: 0.5, l: 'Grand' }],
  regression:   [{ v: 0.02, l: 'Petit' }, { v: 0.15, l: 'Moyen' }, { v: 0.35, l: 'Grand' }],
};

export default function ParamPanel({ test, params, onChange, onCalculate, loading }) {
  const meta = TEST_META[test] || {};

  const [alpha,        setAlpha]        = useState(0.05);
  const [power,        setPower]        = useState(0.80);
  const [effect,       setEffect]       = useState(meta.effectDefault || 0.25);
  const [mdeMode,      setMdeMode]      = useState(false);
  const [nGiven,       setNGiven]       = useState(30);
  const [groups,       setGroups]       = useState(['Groupe A', 'Groupe B']);
  const [levels,       setLevels]       = useState(['T1', 'T2']);
  const [randomFactor, setRandomFactor] = useState('Participant');
  const [chi2Df,       setChi2Df]       = useState(1);
  const [nPredictors,  setNPredictors]  = useState(2);
  const [f2,           setF2]           = useState(0.15);
  const [lmmTarget,    setLmmTarget]    = useState('interaction');

  // Reset effect value when test changes
  useEffect(() => {
    setEffect(TEST_META[test]?.effectDefault || 0.25);
    setMdeMode(false);
  }, [test]);

  const needsGroups  = ['anova', 'anova_mixed', 'lmm'].includes(test);
  const needsLevels  = ['anova_rm', 'anova_mixed', 'lmm'].includes(test);
  const needsRandom  = ['lmm'].includes(test);
  const needsChi2Df  = test === 'chi2';
  const needsRegPred = test === 'regression';

  function addGroup()   { if (groups.length < 6)  setGroups([...groups, `Groupe ${String.fromCharCode(65 + groups.length)}`]); }
  function removeGroup(i) { if (groups.length > 2) setGroups(groups.filter((_, j) => j !== i)); }
  function addLevel()   { if (levels.length < 8)  setLevels([...levels, `T${levels.length + 1}`]); }
  function removeLevel(i) { if (levels.length > 2) setLevels(levels.filter((_, j) => j !== i)); }

  function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      selected_test: test,
      alpha: parseFloat(alpha),
      power: parseFloat(power),
      f: parseFloat(effect),
      r: parseFloat(effect),
      f2: parseFloat(test === 'regression' ? f2 : effect),
      group_levels: groups,
      level_levels: levels,
      random_factor: randomFactor,
      chi2_df: parseInt(chi2Df),
      n_predictors: parseInt(nPredictors),
      lmm_target: lmmTarget,
      mde_mode: mdeMode,
      n_given: mdeMode ? parseFloat(nGiven) : null,
      two_tailed: true,
    };
    onChange(payload);
    onCalculate(payload);
  }

  const benchmarks = EFFECT_BENCHMARKS[test] || [];

  return (
    <form className={styles.panel} onSubmit={handleSubmit}>
      <div className={styles.panelTitle}>{meta.label}</div>

      {/* Mode switch */}
      <div className={styles.modeSwitch}>
        <button
          type="button"
          className={`${styles.modeBtn} ${!mdeMode ? styles.modeBtnActive : ''}`}
          onClick={() => setMdeMode(false)}
        >
          Calculer N
        </button>
        <button
          type="button"
          className={`${styles.modeBtn} ${mdeMode ? styles.modeBtnActive : ''}`}
          onClick={() => setMdeMode(true)}
        >
          Calculer MDE
        </button>
      </div>

      <div className={styles.fields}>

        {/* Alpha */}
        <div className={styles.field}>
          <Slider
            label="Seuil α (risque erreur type I)"
            value={alpha}
            onChange={setAlpha}
            min={0.01} max={0.10} step={0.01}
            marks={[{ v: 0.01, l: '.01' }, { v: 0.05, l: '.05' }, { v: 0.10, l: '.10' }]}
            format={v => v.toFixed(2)}
          />
        </div>

        {/* Power */}
        <div className={styles.field}>
          <Slider
            label="Puissance (1 − β)"
            value={power}
            onChange={setPower}
            min={0.60} max={0.99} step={0.01}
            marks={[{ v: 0.80, l: '.80' }, { v: 0.90, l: '.90' }, { v: 0.95, l: '.95' }]}
            format={v => `${Math.round(v * 100)}%`}
          />
        </div>

        {/* Effect size ou N */}
        {mdeMode ? (
          <div className={styles.field}>
            <label className={styles.label}>Effectif disponible (N par groupe)</label>
            <input
              type="number" min={4} max={10000} step={1}
              value={nGiven}
              onChange={e => setNGiven(e.target.value)}
            />
          </div>
        ) : (
          <div className={styles.field}>
            <Slider
              label={`Taille d'effet attendue (${meta.effectLabel})`}
              value={effect}
              onChange={setEffect}
              min={meta.effectMin || 0.05}
              max={meta.effectMax || 1.0}
              step={0.01}
              marks={benchmarks.map(b => ({ v: b.v, l: b.l }))}
              format={v => v.toFixed(2)}
            />
            <div className={styles.benchmarkPills}>
              {benchmarks.map(b => (
                <button
                  key={b.v} type="button"
                  className={styles.pill}
                  onClick={() => setEffect(b.v)}
                >
                  {b.l} ({b.v})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Groupes between */}
        {needsGroups && (
          <div className={styles.field}>
            <label className={styles.label}>Groupes (between-subjects)</label>
            {groups.map((g, i) => (
              <div key={i} className={styles.levelRow}>
                <input
                  value={g}
                  onChange={e => { const a = [...groups]; a[i] = e.target.value; setGroups(a); }}
                />
                {groups.length > 2 && (
                  <button type="button" className={styles.removeBtn} onClick={() => removeGroup(i)}>✕</button>
                )}
              </div>
            ))}
            {groups.length < 6 && (
              <button type="button" className={styles.addBtn} onClick={addGroup}>+ Ajouter groupe</button>
            )}
          </div>
        )}

        {/* Niveaux within */}
        {needsLevels && (
          <div className={styles.field}>
            <label className={styles.label}>Mesures (within-subjects)</label>
            {levels.map((l, i) => (
              <div key={i} className={styles.levelRow}>
                <input
                  value={l}
                  onChange={e => { const a = [...levels]; a[i] = e.target.value; setLevels(a); }}
                />
                {levels.length > 2 && (
                  <button type="button" className={styles.removeBtn} onClick={() => removeLevel(i)}>✕</button>
                )}
              </div>
            ))}
            {levels.length < 8 && (
              <button type="button" className={styles.addBtn} onClick={addLevel}>+ Ajouter mesure</button>
            )}
          </div>
        )}

        {/* LMM : facteur aléatoire et cible */}
        {needsRandom && (
          <>
            <div className={styles.field}>
              <label className={styles.label}>Facteur aléatoire</label>
              <input value={randomFactor} onChange={e => setRandomFactor(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Effet ciblé</label>
              <select value={lmmTarget} onChange={e => setLmmTarget(e.target.value)}>
                <option value="interaction">Interaction (groupe × mesure)</option>
                <option value="group">Effet groupe</option>
                <option value="level">Effet mesure</option>
              </select>
            </div>
          </>
        )}

        {/* Chi² : degrés de liberté */}
        {needsChi2Df && (
          <div className={styles.field}>
            <label className={styles.label}>Degrés de liberté du tableau</label>
            <input
              type="number" min={1} max={20} step={1}
              value={chi2Df}
              onChange={e => setChi2Df(e.target.value)}
            />
            <span className={styles.hint}>df = (lignes − 1) × (colonnes − 1)</span>
          </div>
        )}

        {/* Régression : prédicteurs et f² */}
        {needsRegPred && (
          <>
            <div className={styles.field}>
              <label className={styles.label}>Nombre de prédicteurs</label>
              <input
                type="number" min={1} max={30} step={1}
                value={nPredictors}
                onChange={e => setNPredictors(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <Slider
                label="f² de Cohen"
                value={f2}
                onChange={setF2}
                min={0.01} max={1.5} step={0.01}
                marks={[{ v: 0.02, l: 'Petit' }, { v: 0.15, l: 'Moyen' }, { v: 0.35, l: 'Grand' }]}
                format={v => v.toFixed(2)}
              />
            </div>
          </>
        )}
      </div>

      <button
        type="submit"
        className={styles.calcBtn}
        disabled={loading}
      >
        {loading ? (
          <span className={styles.spinner}>⏳ Calcul en cours…</span>
        ) : (
          mdeMode ? '🔍 Calculer le MDE' : '🧮 Calculer la taille d\'échantillon'
        )}
      </button>

      {test === 'lmm' && !loading && (
        <p className={styles.lmmNote}>
          ⚠️ Le LMM utilise la simulation Monte-Carlo — peut prendre 5–15 secondes.
        </p>
      )}
    </form>
  );
}
