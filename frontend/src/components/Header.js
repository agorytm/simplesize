import React from 'react';
import styles from './Header.module.css';

export default function Header({ onSentence, onExport, hasResult }) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>
        Simple<span>Size</span>
      </h1>
      <span className={styles.tagline}>Alternative moderne à G*Power</span>
      <div className={styles.actions}>
        <button className={styles.btnSentence} onClick={onSentence}>
          ✍️ Sentence template
        </button>
        <button
          className={styles.btnExport}
          onClick={onExport}
          disabled={!hasResult}
        >
          Exporter
        </button>
      </div>
    </header>
  );
}
