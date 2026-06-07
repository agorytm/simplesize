import React, { useState } from 'react';
import Header from './components/Header';
import TestSelector from './components/TestSelector';
import ParamPanel from './components/ParamPanel';
import ResultPanel from './components/ResultPanel';
import Footer from './components/Footer';
import styles from './App.module.css';

const API = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

export default function App() {
  const [test, setTest]       = useState(null);
  const [params, setParams]   = useState({});
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  async function handleCalculate(payload) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${API}/api/simplesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); }
      else { setResult(data); }
    } catch (e) {
      setError('Impossible de joindre le serveur. Vérifiez que le backend est lancé.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1 className={styles.title}>Calcul de puissance & taille d'échantillon</h1>
          <p className={styles.subtitle}>
            Sélectionnez votre design expérimental, renseignez vos paramètres et obtenez
            en un clic le nombre de participants nécessaires — avec explications pédagogiques.
          </p>
        </div>

        <div className={styles.grid}>
          <div className={styles.left}>
            <TestSelector selected={test} onSelect={t => { setTest(t); setResult(null); setError(null); }} />
          </div>
          <div className={styles.center}>
            {test
              ? <ParamPanel
                  test={test}
                  params={params}
                  onChange={setParams}
                  onCalculate={handleCalculate}
                  loading={loading}
                />
              : <div className={styles.placeholder}>
                  <span className={styles.placeholderIcon}>📐</span>
                  <p>Choisissez un test statistique à gauche pour commencer.</p>
                </div>
            }
          </div>
          <div className={styles.right}>
            <ResultPanel result={result} error={error} loading={loading} test={test} params={params} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
