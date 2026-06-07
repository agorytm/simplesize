import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import DesignBuilder from './components/DesignBuilder';
import DesignViz from './components/DesignViz';
import TestParamPanel from './components/TestParamPanel';
import SentenceModal from './components/SentenceModal';
import styles from './App.module.css';

const API = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';
const DEFAULT_INTER = [{ name: 'Group', levels: ['A', 'B'] }];
const DEFAULT_INTRA = [];

export default function App() {
  const [interFactors, setInterFactors] = useState(DEFAULT_INTER);
  const [intraFactors, setIntraFactors] = useState(DEFAULT_INTRA);
  const [possibleTests, setPossibleTests] = useState([]);
  const [selectedTest,  setSelectedTest]  = useState(null);
  const [alpha,     setAlpha]     = useState(0.05);
  const [power,     setPower]     = useState(0.80);
  const [f,         setF]         = useState(0.25);
  const [mdeMode,   setMdeMode]   = useState(false);
  const [nGiven,    setNGiven]    = useState('');
  const [lmmTarget, setLmmTarget] = useState('interaction');
  const [rVal,        setRVal]        = useState(0.3);
  const [chi2Df,      setChi2Df]      = useState(1);
  const [nPredictors, setNPredictors] = useState(1);
  const [f2Val,       setF2Val]       = useState(0.15);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [showSentence, setShowSentence] = useState(false);

  const fetchTests = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/list_tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interFactors, intraFactors }),
      });
      const data = await res.json();
      const tests = data.possible_tests || [];
      setPossibleTests(tests);
      setSelectedTest(prev => (tests.includes(prev) ? prev : (tests[0] || null)));
      setResult(null);
      setError(null);
    } catch (e) {}
  }, [interFactors, intraFactors]);

  useEffect(() => { fetchTests(); }, [fetchTests]);

  async function handleCalculate() {
    if (!selectedTest) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const payload = {
      selected_test: selectedTest,
      interFactors, intraFactors, alpha, power,
      effect_size: selectedTest === 'correlation' ? rVal
                 : selectedTest === 'regression'  ? f2Val : f,
      mde_mode: mdeMode,
      n_given: mdeMode ? Number(nGiven) : undefined,
      lmm_target: lmmTarget,
      chi2_df: chi2Df,
      n_predictors: nPredictors,
    };
    try {
      const res = await fetch(`${API}/api/simplesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResult(data);
    } catch (e) {
      setError('Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  }

  function handleExport() {
    if (!result) return;
    const lines = [
      'SimpleSize — Résultat',
      `Test : ${selectedTest}`,
      `Alpha : ${alpha}  |  Puissance : ${power}`,
      result.n_per_group != null ? `N par groupe : ${result.n_per_group}` : '',
      result.n_total     != null ? `N total : ${result.n_total}` : '',
      result.mde         != null ? `MDE : ${result.mde}` : '',
      result.interpretation ? `Interprétation : ${result.interpretation}` : '',
    ].filter(Boolean).join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'simplesize_result.txt'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.app}>
      <Header hasResult={!!result} onExport={handleExport} onSentence={() => setShowSentence(true)} />
      <main className={styles.main}>
        <div className={styles.grid}>
          <DesignBuilder
            interFactors={interFactors} intraFactors={intraFactors}
            onChangeInter={setInterFactors} onChangeIntra={setIntraFactors}
          />
          <DesignViz interFactors={interFactors} intraFactors={intraFactors} />
          <TestParamPanel
            possibleTests={possibleTests} selectedTest={selectedTest} onSelectTest={setSelectedTest}
            alpha={alpha} onAlpha={setAlpha} power={power} onPower={setPower}
            f={f} onF={setF} mdeMode={mdeMode} onMdeMode={setMdeMode}
            nGiven={nGiven} onNGiven={setNGiven} lmmTarget={lmmTarget} onLmmTarget={setLmmTarget}
            rVal={rVal} onRVal={setRVal} chi2Df={chi2Df} onChi2Df={setChi2Df}
            nPredictors={nPredictors} onNPredictors={setNPredictors} f2Val={f2Val} onF2Val={setF2Val}
            result={result} loading={loading} error={error} onCalculate={handleCalculate}
          />
        </div>
      </main>
      <Footer />
      {showSentence && (
        <SentenceModal
          selectedTest={selectedTest} result={result} alpha={alpha} power={power}
          interFactors={interFactors} intraFactors={intraFactors}
          onClose={() => setShowSentence(false)}
        />
      )}
    </div>
  );
}
