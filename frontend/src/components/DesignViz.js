import React from 'react';
import styles from './DesignViz.module.css';

/** Build the ANOVA design notation string (e.g. "S(A) × B") */
function buildNotation(interFactors, intraFactors) {
  const validInter = interFactors.filter(f => f.levels.length >= 2);
  const validIntra = intraFactors.filter(f => f.levels.length >= 2);

  const interNames = validInter.map(f => f.name || '?');
  const intraNames = validIntra.map(f => f.name || '?');

  if (interNames.length === 0 && intraNames.length === 0) return 'S';
  if (interNames.length > 0  && intraNames.length === 0) {
    return `S(${interNames.join(' × ')})`;
  }
  if (interNames.length === 0 && intraNames.length > 0) {
    return `S × ${intraNames.join(' × ')}`;
  }
  return `S(${interNames.join(' × ')}) × ${intraNames.join(' × ')}`;
}

/** Returns array of between-group combinations (cartesian product) */
function cartesian(arrays) {
  if (arrays.length === 0) return [[]];
  const [first, ...rest] = arrays;
  const subCombos = cartesian(rest);
  return first.flatMap(item => subCombos.map(combo => [item, ...combo]));
}

export default function DesignViz({ interFactors, intraFactors }) {
  const validInter = interFactors.filter(f => f.name && f.levels.length >= 2);
  const validIntra = intraFactors.filter(f => f.name && f.levels.length >= 2);

  const notation = buildNotation(interFactors, intraFactors);

  // Build row labels (between)
  const rowGroups = validInter.length > 0
    ? cartesian(validInter.map(f => f.levels))
    : [['—']];

  // Build column labels (within)
  const colGroups = validIntra.length > 0
    ? cartesian(validIntra.map(f => f.levels))
    : null;

  const hasInter = validInter.length > 0;
  const hasIntra = validIntra.length > 0;

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.title}>Design</span>
        <span className={styles.notation}>{notation}</span>
      </div>

      {/* Description */}
      <p className={styles.desc}>
        {!hasInter && !hasIntra && 'Définissez un facteur between ou within pour visualiser le design.'}
        {hasInter && !hasIntra && `${rowGroups.length} groupe${rowGroups.length > 1 ? 's' : ''} between-subject`}
        {!hasInter && hasIntra && `${colGroups.length} niveau${colGroups.length > 1 ? 'x' : ''} within-subject`}
        {hasInter && hasIntra && `${rowGroups.length} × ${colGroups.length} = ${rowGroups.length * colGroups.length} cellules (design mixte)`}
      </p>

      {/* Grid visualization */}
      {(hasInter || hasIntra) && (
        <div className={styles.gridWrap}>
          <table className={styles.table}>
            <thead>
              {/* Column factor name header */}
              {hasIntra && (
                <tr>
                  {hasInter && <th className={styles.cornerCell}></th>}
                  {validIntra.map((fac, fi) => (
                    <th
                      key={fi}
                      colSpan={colGroups.length}
                      className={styles.factorHeaderCell}
                    >
                      {fac.name}
                    </th>
                  ))}
                </tr>
              )}
              {/* Column level labels */}
              <tr>
                {hasInter && (
                  <th className={styles.rowFactorCell}>
                    {validInter.map(f => f.name).join(' × ')}
                  </th>
                )}
                {hasIntra ? (
                  colGroups.map((combo, ci) => (
                    <th key={ci} className={styles.colCell}>
                      {combo.join('\n')}
                    </th>
                  ))
                ) : (
                  <th className={styles.colCell}>N</th>
                )}
              </tr>
            </thead>
            <tbody>
              {rowGroups.map((rowCombo, ri) => (
                <tr key={ri}>
                  <td className={styles.rowLabelCell}>
                    {hasInter ? rowCombo.join(' × ') : ''}
                  </td>
                  {(hasIntra ? colGroups : [null]).map((colCombo, ci) => (
                    <td key={ci} className={styles.cell}>
                      <span className={styles.cellN}>n</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cell count summary */}
      {(hasInter || hasIntra) && (
        <div className={styles.summary}>
          {hasInter && (
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Between</span>
              <span className={styles.summaryValue}>{validInter.map(f => `${f.name} (${f.levels.length})`).join(', ')}</span>
            </div>
          )}
          {hasIntra && (
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Within</span>
              <span className={styles.summaryValue}>{validIntra.map(f => `${f.name} (${f.levels.length})`).join(', ')}</span>
            </div>
          )}
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Cellules</span>
            <span className={styles.summaryValue}>
              {hasInter && hasIntra
                ? `${rowGroups.length} × ${colGroups.length} = ${rowGroups.length * colGroups.length}`
                : hasInter
                ? rowGroups.length
                : colGroups.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
