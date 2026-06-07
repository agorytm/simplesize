import React from 'react';
import styles from './Slider.module.css';

export default function Slider({ label, value, onChange, min, max, step, marks = [], format }) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <span className={styles.val}>{format ? format(value) : value}</span>
      </div>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
        <input
          type="range"
          className={styles.input}
          min={min} max={max} step={step}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
        />
      </div>
      {marks.length > 0 && (
        <div className={styles.marks}>
          {marks.map(m => (
            <button
              key={m.v}
              type="button"
              className={styles.mark}
              style={{ left: `${((m.v - min) / (max - min)) * 100}%` }}
              onClick={() => onChange(m.v)}
              title={m.v}
            >
              <span className={styles.markLabel}>{m.l}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
