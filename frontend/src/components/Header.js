import React from 'react';
import styles from './Header.module.css';

export default function Header({ onSentence, onExport, hasResult }) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.title}>SimpleSize</span>
          <span className={styles.tagline}>Alternative moderne à G*Power</span>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.btnSentence}
            onClick={onSentence}
            title="Générer un modèle de phrase pour votre article"
          >
            ✍️ Sentence template
          </button>
          <button
            className={styles.btnExport}
            onClick={onExport}
            disabled={!hasResult}
            title="Exporter le résultat"
          >
            ⬇️ Export
          </button>
        </div>
      </div>
    </header>
  );
}
