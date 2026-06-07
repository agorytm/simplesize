import React from 'react';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span>© {new Date().getFullYear()} <strong>SimpleSize</strong> — Alternative moderne à G*Power</span>
        <span className={styles.sep}>·</span>
        <a href="#" className={styles.link}>Documentation</a>
        <span className={styles.sep}>·</span>
        <a href="#" className={styles.link}>Citer SimpleSize</a>
        <span className={styles.sep}>·</span>
        <a href="#" className={styles.link}>Signaler un bug</a>
        <span className={styles.sep}>·</span>
        <span className={styles.badge}>Open Source</span>
      </div>
    </footer>
  );
}
