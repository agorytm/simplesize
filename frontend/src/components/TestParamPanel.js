import React from 'react';
import styles from './TestParamPanel.module.css';

const TEST_LABELS = {
  ttest:           'Independent t-test',
  ttest_paired:    'Paired t-test',
  anova:           'Between-subjects ANOVA',
  anova_factorial: 'Factorial ANOVA',
  anova_rm:        'Repeated-measures ANOVA',
  anova_mixed:     'Mixed ANOVA',
  lmm:             'Linear Mixed Model (LMM)',
  correlation:     'Pearson correlation',
  chi2:            'Chi² test',
  regression:      'Linear regression',
};

// Tests requiring a Cohen's f or d effect size (not r, f², w)
const F_TESTS  = ['anova', 'anova_factorial', 'anova_rm', 'anova_mixed', 'lmm'];
const D_TESTS  = ['ttest', 'ttest_paired'];
const R_TESTS  = ['correlation'];
const W_TESTS  = ['chi2'];
const F2_TESTS = ['regression'];

function EffectSizeBlock({ test, f, setF, rVal, setRVal, chi2Df, setChi2Df, nPredictors, setNPredictors, f2Val, setF2Val }) {
  if (F_TESTS.includes(test)) {
    return (
      <div className={styles.field}>
        <label>Taille d'effet (Cohen's f)</label>
        <div className={styles.esRow}>
          <input type="range" min="0.05" max="1.0" step="0.01" value={f}
            onChange={e => setF(parseFloat(e.target.value))} className={styles.slider} />
          <input type="number" min="0.05" max="2" step="0.01" value={f}
            onChange={e => setF(parseFloat(e.target.value) || 0.1)} className={styles.esNum} />
        </div>
        <div className={styles.esHints}>
          <button onClick={() => setF(0.10)} className={f < 0.18 ? styles.esHintActive : styles.esHint}>petit (0.10)</button>
          <button onClick={() => setF(0.25)} className={f >= 0.18 && f < 0.35 ? styles.esHintActive : styles.esHint}>moyen (0.25)</button>
          <button onClick={() => setF(0.40)} className={f >= 0.35 ? styles.esHintActive : styles.esHint}>grand (0.40)</button>
        </div>
      </div>
    );
  }
  if (D_TESTS.includes(test)) {
    return (
      <div className={styles.field}>
        <label>Taille d'effet (Cohen's d)</label>
        <div className={styles.esRow}>
          <input type="range" min="0.1" max="2.0" step="0.01" value={f}
            onChange={e => setF(parseFloat(e.target.value))} className={styles.slider} />
          <input type="number" min="0.1" max="3" step="0.01" value={f}
            onChange={e => setF(parseFloat(e.target.value) || 0.2)} className={styles.esNum} />
        </div>
        <div className={styles.esHints}>
          <button onClick={() => setF(0.2)} className={f < 0.35 ? styles.esHintActive : styles.esHint}>petit (0.20)</button>
          <button onClick={() => setF(0.5)} className={f >= 0.35 && f < 0.65 ? styles.esHintActive : styles.esHint}>moyen (0.50)</button>
          <button onClick={() => setF(0.8)} className={f >= 0.65 ? styles.esHintActive : styles.esHint}>grand (0.80)</button>
        </div>
      </div>
    );
  }
  if (R_TESTS.includes(test)) {
    return (
      <div className={styles.field}>
        <label>Corrélation (r de Pearson)</label>
        <div className={styles.esRow}>
          <input type="range" min="0.05" max="0.95" step="0.01" value={rVal}
            onChange={e => setRVal(parseFloat(e.target.value))} className={styles.slider} />
          <input type="number" min="0.05" max="0.99" step="0.01" value={rVal}
            onChange={e => setRVal(parseFloat(e.target.value) || 0.3)} className={styles.esNum} />
        </div>
        <div className={styles.esHints}>
          <button onClick={() => setRVal(0.10)} className={rVal < 0.2 ? styles.esHintActive : styles.esHint}>faible (0.10)</button>
          <button onClick={() => setRVal(0.30)} className={rVal >= 0.2 && rVal < 0.4 ? styles.esHintActive : styles.esHint}>modérée (0.30)</button>
          <button onClick={() => setRVal(0.50)} className={rVal >= 0.4 ? styles.esHintActive : styles.esHint}>forte (0.50)</button>
        </div>
      </div>
    );
  }
  if (W_TESTS.includes(test)) {
    return (
      <div className={styles.field}>
        <label>Taille d'effet (w de Cohen)</label>
        <div className={styles.esRow}>
          <input type="range" min="0.05" max="1.0" step="0.01" value={f}
            onChange={e => setF(parseFloat(e.target.value))} className={styles.slider} />
          <input type="number" min="0.05" max="2" step="0.01" value={f}
            onChange={e => setF(parseFloat(e.target.value) || 0.1)} className={styles.esNum} />
        </div>
        <div className={styles.field}>
          <label>Degrés de liberté (df)</label>
          <input type="number" min="1" max="20" value={chi2Df}
            onChange={e => setChi2Df(parseInt(e.target.value) || 1)} className={styles.shortInput} />
        </div>
      </div>
    );
  }
  if (F2_TESTS.includes(test)) {
    return (
      <>
        <div className={styles.field}>
          <label>Taille d'effet (f² de Cohen)</label>
          <div className={styles.esRow}>
            <input type="range" min="0.01" max="1.0" step="0.01" value={f2Val}
              onChange={e => setF2Val(parseFloat(e.target.value))} className={styles.slider} />
            <input type="number" min="0.01" max="2" step="0.01" value={f2Val}
              onChange={e => setF2Val(parseFloat(e.target.value) || 0.02)} className={styles.esNum} />
          </div>
          <div className={styles.esHints}>
            <button onClick={() => setF2Val(0.02)} className={f2Val < 0.08 ? styles.esHintActive : styles.esHint}>petit (0.02)</button>
            <button onClick={() => setF2Val(0.15)} className={f2Val >= 0.08 && f2Val < 0.25 ? styles.esHintActive : styles.esHint}>moyen (0.15)</button>
            <button onClick={() => setF2Val(0.35)} className={f2Val >= 0.25 ? styles.esHintActive : styles.esHint}>grand (0.35)</button>
          </div>
        </div>
        <div className={styles.field}>
          <label>Nombre de prédicteurs</label>
          <input type="number" min="1" max="20" value={nPredictors}
            onChange={e => setNPredictors(parseInt(e.target.value) || 1)} className={styles.shortInput} />
        </div>
      </>
    );
  }
  return null;
}

function ResultDisplay({ result, loading, error, selectedTest }) {
  if (loading) return <div className={styles.loading}>Calcul en cours…</div>;
  if (error)   return <div className={styles.errorBox}>⚠ {error}</div>;
  if (!result) return <div className={styles.noResult}>Appuyez sur Calculer pour obtenir le résultat.</div>;

  const interp = result.interpretation;
  const interpClass = {
    trivial: styles.trivial,
    small:   styles.small,
    medium:  styles.medium,
    large:   styles.large,
  }[interp?.level] || '';

  return (
    <div className={styles.result}>
      {result.n_per_group && (
        <div className={styles.resultMain}>
          <span className={styles.resultN}>{result.n_per_group}</span>
          <span className={styles.resultLabel}>
            {selectedTest === 'ttest_paired' || selectedTest === 'correlation' || selectedTest === 'chi2' || selectedTest === 'regression'
              ? 'N total'
              : 'N per group'}
          </span>
        </div>
      )}
      {result.n_total && result.test === 'anova_factorial' && (
        <div className={styles.resultSub}>
          N total : <strong>{result.n_total}</strong> ({result.n_cells} cellules × {result.n_per_group})
        </div>
      )}
      {result.n_per_group && selectedTest !== 'anova_factorial' && !['ttest_paired','correlation','chi2','regression'].includes(selectedTest) && (
        <div className={styles.resultSub}>
          N subjects (total) : <strong>—</strong>
        </div>
      )}
      {result.mde && (
        <div className={styles.resultMain}>
          <span className={styles.resultN}>{result.mde}</span>
          <span className={styles.resultLabel}>MDE ({result.label})</span>
        </div>
      )}
      {result.estimated_power && (
        <div className={styles.resultSub}>
          Puissance estimée : <strong>{Math.round(result.estimated_power * 100)}%</strong>
        </div>
      )}
      {result.message && (
        <div className={styles.resultMsg}>{result.message}</div>
      )}
      {interp && (
        <div className={`${styles.interpBadge} ${interpClass}`}>
          {interp.label}
        </div>
      )}
    </div>
  );
}

export default function TestParamPanel({
  possibleTests, selectedTest, onSelectTest,
  alpha, setAlpha, power, setPower,
  f, setF, mdeMode, setMdeMode, nGiven, setNGiven,
  lmmTarget, setLmmTarget,
  rVal, setRVal, chi2Df, setChi2Df, nPredictors, setNPredictors, f2Val, setF2Val,
  result, loading, error, onCalculate,
}) {
  return (
    <div className={styles.panel}>
      {/* ── Possible tests ──────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>Possible tests</div>
        {possibleTests.length === 0 ? (
          <p className={styles.empty}>Définissez un design pour voir les tests disponibles.</p>
        ) : (
          <div className={styles.testList}>
            {possibleTests.map(t => (
              <label key={t} className={`${styles.testOption} ${selectedTest === t ? styles.testSelected : ''}`}>
                <input
                  type="radio"
                  name="test"
                  value={t}
                  checked={selectedTest === t}
                  onChange={() => onSelectTest(t)}
                />
                {TEST_LABELS[t] || t}
              </label>
            ))}
          </div>
        )}
      </section>

      {/* ── Parameters ──────────────────────────────── */}
      {selectedTest && (
        <section className={styles.section}>
          <div className={styles.sectionTitle}>Parameters</div>

          <div className={styles.modeToggle}>
            <button
              className={!mdeMode ? styles.modeActive : styles.modeBtn}
              onClick={() => setMdeMode(false)}
            >
              Calculer N
            </button>
            <button
              className={mdeMode ? styles.modeActive : styles.modeBtn}
              onClick={() => setMdeMode(true)}
            >
              Calculer MDE
            </button>
          </div>

          {/* Alpha */}
          <div className={styles.field}>
            <label>Alpha (α)</label>
            <select value={alpha} onChange={e => setAlpha(parseFloat(e.target.value))}>
              <option value="0.001">0.001</option>
              <option value="0.01">0.01</option>
              <option value="0.05">0.05</option>
              <option value="0.10">0.10</option>
            </select>
          </div>

          {/* Power */}
          <div className={styles.field}>
            <label>Power (1 – β)</label>
            <select value={power} onChange={e => setPower(parseFloat(e.target.value))}>
              <option value="0.70">0.70</option>
              <option value="0.80">0.80</option>
              <option value="0.90">0.90</option>
              <option value="0.95">0.95</option>
              <option value="0.99">0.99</option>
            </select>
          </div>

          {/* N given (MDE mode) */}
          {mdeMode && (
            <div className={styles.field}>
              <label>N disponible</label>
              <input
                type="number"
                min="4"
                value={nGiven}
                onChange={e => setNGiven(e.target.value)}
                placeholder="ex : 50"
                className={styles.shortInput}
              />
            </div>
          )}

          {/* Effect size controls (N mode only) */}
          {!mdeMode && (
            <EffectSizeBlock
              test={selectedTest}
              f={f}           setF={setF}
              rVal={rVal}     setRVal={setRVal}
              chi2Df={chi2Df} setChi2Df={setChi2Df}
              nPredictors={nPredictors} setNPredictors={setNPredictors}
              f2Val={f2Val}   setF2Val={setF2Val}
            />
          )}

          {/* LMM target */}
          {selectedTest === 'lmm' && (
            <div className={styles.field}>
              <label>Effet à détecter</label>
              <select value={lmmTarget} onChange={e => setLmmTarget(e.target.value)}>
                <option value="interaction">Interaction</option>
                <option value="group">Effet groupe</option>
                <option value="level">Effet temps/niveau</option>
              </select>
            </div>
          )}

          {/* Run LMM notice */}
          {selectedTest === 'lmm' && (
            <p className={styles.lmmNotice}>
              ⏱ Le calcul LMM utilise des simulations Monte-Carlo (quelques secondes).
            </p>
          )}

          <button
            className={styles.calcBtn}
            onClick={onCalculate}
            disabled={loading || (mdeMode && !nGiven)}
          >
            {loading
              ? selectedTest === 'lmm' ? 'Simulation en cours…' : 'Calcul…'
              : selectedTest === 'lmm' ? 'Run LMM calculation' : 'Calculer'}
          </button>
        </section>
      )}

      {/* ── Result ──────────────────────────────────── */}
      {selectedTest && (
        <section className={styles.section}>
          <div className={styles.sectionTitle}>Résultat</div>
          <ResultDisplay
            result={result}
            loading={loading}
            error={error}
            selectedTest={selectedTest}
          />
        </section>
      )}
    </div>
  );
}
