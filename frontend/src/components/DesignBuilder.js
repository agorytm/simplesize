import React from 'react';
import styles from './DesignBuilder.module.css';

// ── Factor level tags ──────────────────────────────────────────────────────
function LevelTags({ levels, onChange }) {
  function updateLevel(idx, val) {
    const next = [...levels];
    next[idx] = val;
    onChange(next);
  }
  function removeLevel(idx) {
    onChange(levels.filter((_, i) => i !== idx));
  }
  function addLevel() {
    onChange([...levels, `L${levels.length + 1}`]);
  }

  return (
    <div className={styles.tags}>
      {levels.map((lv, i) => (
        <span key={i} className={styles.tag}>
          <input
            className={styles.tagInput}
            value={lv}
            onChange={e => updateLevel(i, e.target.value)}
            maxLength={20}
          />
          {levels.length > 2 && (
            <button className={styles.tagRemove} onClick={() => removeLevel(i)} title="Supprimer">×</button>
          )}
        </span>
      ))}
      <button className={styles.tagAdd} onClick={addLevel} title="Ajouter une modalité">+</button>
    </div>
  );
}

// ── Single factor row ──────────────────────────────────────────────────────
function FactorRow({ factor, kind, onUpdate, onRemove, canRemove, levelLabel }) {
  return (
    <div className={styles.factorRow}>
      <div className={styles.factorHeader}>
        <input
          className={styles.factorName}
          value={factor.name}
          placeholder={kind === 'inter' ? 'Nom du facteur' : 'Nom du facteur'}
          onChange={e => onUpdate({ ...factor, name: e.target.value })}
          maxLength={30}
        />
        {canRemove && (
          <button className={styles.removeBtn} onClick={onRemove} title="Supprimer ce facteur">✕</button>
        )}
      </div>
      <div className={styles.levelRow}>
        <span className={styles.levelLabel}>{levelLabel}</span>
        <LevelTags
          levels={factor.levels}
          onChange={levels => onUpdate({ ...factor, levels })}
        />
      </div>
    </div>
  );
}

// ── Main DesignBuilder ─────────────────────────────────────────────────────
export default function DesignBuilder({
  interFactors, setInterFactors,
  intraFactors,  setIntraFactors,
}) {
  function updateInter(idx, val) {
    const next = [...interFactors];
    next[idx] = val;
    setInterFactors(next);
  }
  function removeInter(idx) {
    setInterFactors(interFactors.filter((_, i) => i !== idx));
  }
  function addInter() {
    const n = interFactors.length + 1;
    setInterFactors([...interFactors, { name: `Factor ${n}`, levels: ['A', 'B'] }]);
  }

  function updateIntra(idx, val) {
    const next = [...intraFactors];
    next[idx] = val;
    setIntraFactors(next);
  }
  function removeIntra(idx) {
    setIntraFactors(intraFactors.filter((_, i) => i !== idx));
  }
  function addIntra() {
    const n = intraFactors.length + 1;
    setIntraFactors([...intraFactors, { name: `Time${n}`, levels: ['T1', 'T2'] }]);
  }

  return (
    <div className={styles.panel}>
      {/* ── Between-subjects ────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Between-subjects</span>
          <span className={styles.sectionHint}>facteurs inter-sujets</span>
        </div>

        {interFactors.length === 0 && (
          <p className={styles.empty}>Aucun facteur inter-sujet.</p>
        )}

        {interFactors.map((fac, i) => (
          <FactorRow
            key={i}
            factor={fac}
            kind="inter"
            onUpdate={val => updateInter(i, val)}
            onRemove={() => removeInter(i)}
            canRemove={interFactors.length > 0}
            levelLabel="Groups :"
          />
        ))}

        <button className={styles.addBtn} onClick={addInter}>
          + Add a between-subject factor
        </button>
      </section>

      {/* ── Within-subjects ─────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Within-subjects</span>
          <span className={styles.sectionHint}>facteurs intra-sujets</span>
        </div>

        {intraFactors.length === 0 && (
          <p className={styles.empty}>Aucun facteur intra-sujet.</p>
        )}

        {intraFactors.map((fac, i) => (
          <FactorRow
            key={i}
            factor={fac}
            kind="intra"
            onUpdate={val => updateIntra(i, val)}
            onRemove={() => removeIntra(i)}
            canRemove={true}
            levelLabel="Levels :"
          />
        ))}

        <button className={styles.addBtn} onClick={addIntra}>
          + Add a within-subject factor
        </button>
      </section>

      {/* ── LMM random factor hint ───────────────────── */}
      {(interFactors.length >= 1 || intraFactors.length >= 1) && (
        <p className={styles.hint}>
          💡 Facteur aléatoire implicite : <strong>Subjects</strong> (S)
        </p>
      )}
    </div>
  );
}
