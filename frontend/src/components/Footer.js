import React from 'react';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span>© {new Date().getFullYear()} <strong>SimpleSize</strong></span>
        <span className={styles.sep}>·</span>
        <a href="https://github.com/agorytm/simplesize" className={styles.link} target="_blank" rel="noreferrer">Documentation</a>
        <span className={styles.sep}>·</span>
        <a href="https://github.com/agorytm/simplesize/issues" className={styles.link} target="_blank" rel="noreferrer">Signaler un bug</a>
        <span className={styles.sep}>·</span>
        <span className={styles.badge}>Open Source</span>

        <span className={styles.by}