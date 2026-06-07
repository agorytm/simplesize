import React from 'react';
import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>📏</span>
          <span className={styles.logoName}>Simple<strong>Size</strong></span>
          <span className={styles.badge}>v2</span>
        </div>
        <nav className={styles.nav}>
          <a href="#" className={styles.navLink}>Accueil</a>
          <a href="#about" className={styles.navLink}>À propos</a>
          <a href="https://github.com" target="_blank" rel="noreferrer" className={styles.navLink}>GitHub</a>
          <a href="#premium" className={styles.premiumBtn}>Premium ✨</a>
        </nav>
      </div>
    </header>
  );
}
