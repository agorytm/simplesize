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
  const [possibleTests, setPossibleTests]   = useState([]);
  const [selectedTest,  setSelectedTest]    = useState(null);

  // Params
  const [alpha,     setAlpha]     = useState(0.05);
  const [power,     setPower]     = useState(0.80);
  const [f,         setF]         = useState(0.25);
  const [mdeMode,   setMdeMode]   = useState(false);
  const [nGiven,    setNGiven]    = useState('');
  const [lmmTarget, setLmmTarget] = useState('interaction');

  // Extra params (correlation, chi2, regression)
  const [rVal,        setRVal]        = useState(0.3);
  const [chi2Df,      setChi2Df]      = useState(1);
  const [nPredictors, setNPredictors] = useState(1);
  const [f2Val,       setF2Val]       = useState(0.15);

  // Results
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // UI
  const [showSentence, setShowSentence] = useState(false);

  // Fetch possible tests whenever design changes
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
      // Auto-select first test if current selection is no longer valid
      setSelectedTest(prev => (tests.includes(prev) ? prev : (tests[0] || null)));
      setResult(null);
      setError(null);
    } catch (e) {
      // Backend unreachable — keep current state
    }
  }, [interFactors, intraFactors]);

  useEffect(() => { fetchTests(); }, [fetchTests]);

  async function handleCalculate() {
    if (!selectedTest) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const payload = {
      selected_test: selectedTest,
      interFactors,
      intraFactors,
      alph