import React, { useState, useRef } from 'react';
import AnovaForm from './AnovaForm';
import DesignVisualizer from './DesignVisualizer';
import { toJpeg } from 'html-to-image';
import './SimpleSize.css';
import PlanSentenceFiller from './PlanSentenceFiller';

function App() {
  // États pour facteurs dynamiques (max 2 inter et 2 intra)
  const [interFactors, setInterFactors] = useState([{ name: '', levels: [] }]);
  const [intraFactors, setIntraFactors] = useState([{ name: '', levels: [] }]);
  const [formData, setFormData] = useState({
    alpha: "0.05",
    power: "0.8",
    f: "0.25"
  });

  const [result, setResult] = useState(null);
  const [possibleTests, setPossibleTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [isLoadingLmm, setIsLoadingLmm] = useState(false);
  const [designTouched, setDesignTouched] = useState(false);
  const [designMode, setDesignMode] = useState("experimental"); // "experimental" | "variables"
  const [variablesTest, setVariablesTest] = useState(null); // "correlation" | "regression" | "chi2" | null

  // Pour le pop-up conversion f -> d
  const [conversionInfo, setConversionInfo] = useState("");
  const [showConversionInfo, setShowConversionInfo] = useState(false);

  // Pour la modale info test
  const [infoModal, setInfoModal] = useState({ open: false, testKey: null });

  // Pour la modale "phrase à trous"
  const [sentenceModalOpen, setSentenceModalOpen] = useState(false);

  const centerPanelRef = useRef(null);

  // ----------- LABELS TESTS ---------
  const testLabels = {
    ttest: "Independent t-test",
    anova: "Between-subjects ANOVA",
    anova_rm: "Repeated-measures ANOVA",
    anova_mixed: "Mixed ANOVA",
    lmm: "Linear Mixed Model (LMM)",
    anova_factorial: "Factorial ANOVA",
    ttest_paired: "Paired t-test",
    correlation: "Correlation (Pearson r)",
    chi2: "Chi-square",
    regression: "Regression"
  };


  // --------- TEST INFORMATION ---------
  const testInfos = {
    ttest: {
      title: "Independent t-test",
      content: (
        <>
          <b>Group independence</b><br />
          ➝ Check: study design (each participant is only in one group)<br />
          ➝ Robustness: essential, violation invalidates the test
          <br /><br />
          <b>Normality within each group</b><br />
          ➝ Check: Shapiro–Wilk test per group<br />
          ➝ Robustness: not very sensitive if N &gt; 30 per group or group sizes are similar
          <br /><br />
          <b>Homogeneity of variances</b><br />
          ➝ Check: Levene’s test<br />
          ➝ Robustness: if violated, use Welch’s t-test (robust to unequal variances)
        </>
      )
    },
    anova: {
      title: "Between-subjects ANOVA",
      content: (
        <>
          <b>Group independence</b><br />
          ➝ Check: study design<br />
          ➝ Robustness: essential
          <br /><br />
          <b>Normality within each group</b><br />
          ➝ Check: Shapiro–Wilk per group<br />
          ➝ Robustness: not sensitive if N &gt; 30 per group or group sizes are similar
          <br /><br />
          <b>Homogeneity of variances</b><br />
          ➝ Check: Levene’s test<br />
          ➝ Robustness: fairly robust if group sizes are similar; otherwise results may be biased
        </>
      )
    },
    anova_rm: {
      title: "Repeated-measures ANOVA (within-subjects)",
      content: (
        <>
          <b>Normality within each condition</b><br />
          ➝ Check: Shapiro–Wilk per condition<br />
          ➝ Robustness: not very sensitive if N &gt; 30
          <br /><br />
          <b>Sphericity</b><br />
          ➝ Check: Mauchly’s test<br />
          ➝ Robustness: apply correction (Greenhouse–Geisser or Huynh–Feldt) if violated
        </>
      )
    },
    anova_mixed: {
      title: "Mixed ANOVA (within- and between-subjects)",
      content: (
        <>
          <b>Normality for each group × condition combination</b><br />
          ➝ Check: Shapiro–Wilk for each combination<br />
          ➝ Robustness: not very sensitive if each subgroup includes at least 30 subjects
          <br /><br />
          <b>Homogeneity of variances for between-subjects</b><br />
          ➝ Check: Levene’s test<br />
          ➝ Robustness: fairly robust if group sizes are similar; otherwise interpret with caution
          <br /><br />
          <b>Sphericity for within-subjects factors and interactions</b><br />
          ➝ Check: Mauchly’s test<br />
          ➝ Robustness: apply correction (Greenhouse–Geisser or Huynh–Feldt) if violated
          <br /><br />
          <b>Between-subjects group independence</b><br />
          ➝ Check: study design<br />
          ➝ Robustness: essential
        </>
      )
    },
    lmm: {
      title: "Linear Mixed Model (LMM)",
      content: (
        <>
          <b>LMM (Linear Mixed Model)</b><br />
          ➝ Power analysis based on a model with fixed and random effects.<br />
          ➝ Requires specifying a random factor (usually “participants”).<br />
          ➝ Allows accounting for multiple sources of variability.<br /><br />
          <b>Method</b>: N found analytically, then validated by Monte Carlo simulations on the server.
        </>
      )
    }
    ,
    ttest_paired: {
      title: "Paired t-test",
      content: (
        <>
          <b>Normality of differences</b><br />
          ➝ Check: Shapiro–Wilk on the difference scores (post − pre)<br />
          ➝ Robustness: not very sensitive if N &gt; 30
          <br /><br />
          <b>Dependence between measures</b><br />
          ➝ Each participant is measured twice — they are their own control
          <br /><br />
          <b>Effect size d</b>: 0.2 = small · 0.5 = medium · 0.8 = large
        </>
      )
    },
    correlation: {
      title: "Correlation (Pearson r)",
      content: (
        <>
          <b>Linearity</b><br />
          ➝ Check: scatterplot between the two variables<br />
          ➝ If non-linear, use Spearman's ρ instead
          <br /><br />
          <b>Bivariate normality</b><br />
          ➝ Check: Shapiro–Wilk per variable · Robustness: not critical if N &gt; 30
          <br /><br />
          <b>No influential outliers</b><br />
          ➝ Check: scatterplot — one outlier can strongly distort r
          <br /><br />
          <b>Effect size r</b>: 0.10 = small · 0.30 = medium · 0.50 = large
        </>
      )
    },
    chi2: {
      title: "Chi-square test",
      content: (
        <>
          <b>Independence of observations</b><br />
          ➝ Each participant counted only once (essential)
          <br /><br />
          <b>Minimum expected cell count</b><br />
          ➝ All expected frequencies ≥ 5<br />
          ➝ If violated: use Fisher's exact test or merge categories
          <br /><br />
          <b>Degrees of freedom</b>: df = (rows − 1) × (cols − 1)
          <br /><br />
          <b>Effect size w</b>: 0.10 = small · 0.30 = medium · 0.50 = large
        </>
      )
    },
    regression: {
      title: "Multiple Linear Regression",
      content: (
        <>
          <b>Linearity</b> — Check: residuals vs. fitted plot
          <br /><br />
          <b>Independence of residuals</b> — Check: Durbin–Watson test
          <br /><br />
          <b>Homoscedasticity</b> — Check: Breusch–Pagan test
          <br /><br />
          <b>Normality of residuals</b> — Check: Q-Q plot (not critical N &gt; 50)
          <br /><br />
          <b>Effect size f²</b> = R²/(1−R²): 0.02 = small · 0.15 = medium · 0.35 = large
        </>
      )
    }
  };


    // ----------- FONCTION SYNCHRO FORM <-> FACTEURS -----------
    const handleFormUpdate = (data) => {
      if (data.interFactors) setInterFactors(data.interFactors);
      if (data.intraFactors) setIntraFactors(data.intraFactors);
      setFormData(data);

      // Detect user interaction: any named factor, any level, or from sentence template
      const hasActivity =
        data._fromTemplate ||
        (data.interFactors || []).some(f => f.name?.trim() || f.levels?.length > 0) ||
        (data.intraFactors  || []).some(f => f.name?.trim() || f.levels?.length > 0);
      if (hasActivity) setDesignTouched(true);
      detectPossibleTests({
        ...data,
        interFactors: data.interFactors,
        intraFactors: data.intraFactors,
      }, hasActivity || designTouched);
    };

    // ----------- DÉTECTION TESTS POSSIBLES (design-based only) -----------
    const detectPossibleTests = (data, touched) => {
      // Design-based tests only appear when user has started defining a design
      if (!touched) {
        setPossibleTests([]);
        return;
      }

      const validInter = (data.interFactors || []).filter(f => f.name && f.levels && f.levels.length >= 2);
      const validIntra = (data.intraFactors || []).filter(f => f.name && f.levels && f.levels.length >= 2);
      const nInter = validInter.length;
      const nIntra = validIntra.length;
      const nCells = validInter.reduce((acc, f) => acc * f.levels.length, 1);

      let tests = [];

      if (nInter >= 1 && nIntra === 0) {
        if (nCells === 2) tests.push("ttest");
        if (nInter === 1) tests.push("anova");
        else tests.push("anova_factorial");
      }
      if (nIntra >= 1 && nInter === 0) {
        tests.push("anova_rm");
        tests.push("lmm");
      }
      if (nInter >= 1 && nIntra >= 1) {
        tests.push("anova_mixed");
        tests.push("lmm");
      }
      if (nIntra === 1 && validIntra[0]?.levels.length === 2 && nInter === 0) {
        tests.push("ttest_paired");
      }

      tests = [...new Set(tests)];
      setPossibleTests(tests);
      if (selectedTest && !['correlation','chi2','regression'].includes(selectedTest) && !tests.includes(selectedTest)) {
        setSelectedTest(null);
      }
    };


  // ----------- CALCUL DU TEST SÉLECTIONNÉ -----------
  const handleTestSelect = async (test) => {
    setSelectedTest(test);
    setResult(null);
    // Auto-switch design mode when test is selected from left panel
    if (['correlation','chi2','regression'].includes(test)) {
      setDesignMode("variables");
      setVariablesTest(test);
    } else {
      setDesignMode("experimental");
    }

    // Prépare les facteurs pour le backend
    const factors = {};
    interFactors.forEach((factor) => {
      if (factor.name) factors[factor.name] = "between";
    });
    intraFactors.forEach((factor) => {
      if (factor.name) factors[factor.name] = "within";
    });
    // Même logique pour les levels
    const group_levels = interFactors.length > 0 && interFactors[0].levels.length > 0
      ? interFactors[0].levels : [];
    const level_levels = intraFactors.length > 0 && intraFactors[0].levels.length > 0
      ? intraFactors[0].levels : [];

    let fValue = parseFloat((formData.f || "0.25").replace(",", "."));
    let effectToSend = fValue;
    // Conversion automatique pour t-test
    if (test === "ttest" && !isNaN(fValue)) {
      effectToSend = fValue * 2;
      const msg = `Conversion G*Power : f × 2 = d = ${effectToSend.toFixed(3)}`;
      setConversionInfo(msg);
      setShowConversionInfo(true);
      setTimeout(() => setShowConversionInfo(false), 3500);
    }
    // Pour LMM, pas d'appel ici (voir bouton dédié)
    if (test === "lmm") return;

    const payload = {
      alpha: parseFloat((formData.alpha || "0.05").replace(",", ".")),
      power: parseFloat((formData.power || "0.8").replace(",", ".")),
      f: effectToSend,
      r: parseFloat((formData.r || "0.3").replace(",", ".")),
      f2: parseFloat((formData.f2 || "0.15").replace(",", ".")),
      chi2_df: parseInt(formData.chi2_df || 1),
      n_predictors: parseInt(formData.n_predictors || 1),
      two_tailed: true,
      factors,
      group_levels,
      level_levels,
      interFactors: interFactors,
      intraFactors: intraFactors,
      selected_test: test
    };

    try {
      const res = await fetch((process.env.REACT_APP_API_URL || 'https://simplesize-production.up.railway.app') + '/api/simplesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult(null);
    }
  };

  // ----------- LMM (BOUTON LANCEMENT) -----------
  const handleLmmLaunch = async () => {
    setIsLoadingLmm(true);
    setResult(null);
    const factors = {};
    interFactors.forEach((factor) => {
      if (factor.name) factors[factor.name] = "between";
    });
    intraFactors.forEach((factor) => {
      if (factor.name) factors[factor.name] = "within";
    });
    const group_levels = interFactors.length > 0 && interFactors[0].levels.length > 0
      ? interFactors[0].levels : [];
    const level_levels = intraFactors.length > 0 && intraFactors[0].levels.length > 0
      ? intraFactors[0].levels : [];

    const payload = {
      alpha: parseFloat((formData.alpha || "0.05").replace(",", ".")),
      power: parseFloat((formData.power || "0.8").replace(",", ".")),
      f: parseFloat((formData.f || "0.25").replace(",", ".")),
      factors,
      group_levels,
      level_levels,
      interFactors,
      intraFactors,
      selected_test: "lmm",
      random_factor: formData.randomFactor,
      n_sim: formData.nSimulations || 50
    };
    try {
      const res = await fetch((process.env.REACT_APP_API_URL || 'https://simplesize-production.up.railway.app') + '/api/simplesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult(null);
    }
    setIsLoadingLmm(false);
  };


  // ----------- EXPORT JPEG VISUEL -----------
  const handleExportJpeg = () => {
    if (centerPanelRef.current) {
      toJpeg(centerPanelRef.current, { quality: 0.98, backgroundColor: '#fff' })
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = 'simplesize-export.jpeg';
          link.href = dataUrl;
          link.click();
        })
        .catch(() => {
          alert('Error while generating the JPEG');
        });
    }
  };

  // ----------- UI / PANELS -----------

  const containerStyle = {
    display: 'grid',
    gridTemplateColumns: '220px 1fr 300px',
    gap: '24px',
    maxWidth: 1100,
    margin: '38px auto',
    background: '#fff',
    borderRadius: 24,
    boxShadow: '0 4px 32px #55D1E312',
    padding: 26,
    minHeight: 580
  };

  const colStyle = { display: 'flex', flexDirection: 'column', minWidth: 0 };

  const leftPanelStyle = {
    ...colStyle,
    borderRight: '1.5px solid #F4F6F8',
    paddingRight: 16,
    alignItems: 'flex-start',
  };

  const centerPanelStyle = {
    ...colStyle,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 12px',
  };

  const rightPanelStyle = {
    ...colStyle,
    borderLeft: '1.5px solid #F4F6F8',
    paddingLeft: 16,
  };

  const testButtonStyle = (active, disabled) => ({
    background: active
      ? 'linear-gradient(90deg, #80e8fc 0%, #f4f6f8 100%)'
      : disabled
        ? '#F4F6F8'
        : 'linear-gradient(90deg,#f4f6f8 0%, #e6faff 100%)',
    color: active ? '#2F344A' : disabled ? '#B0B8D4' : '#2F344A',
    border: active ? '2px solid #55D1E3' : '1.5px solid #55D1E3',
    borderRadius: 16,
    fontWeight: 600,
    fontSize: 16,
    margin: '0 0 10px 0',
    padding: '10px 0',
    width: '100%',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    boxShadow: active ? '0 2px 12px #55D1E326' : '0 1px 4px #55D1E312',
    transition: 'all .15s'
  });

  const exportButtonStyle = {
    background: '#fff',
    color: '#2F344A',
    border: '1.5px solid #E0E7EF',
    fontWeight: 600,
    fontSize: 17,
    borderRadius: 17,
    margin: '28px auto 0',
    display: 'block',
    minWidth: 120,
    padding: '9px 26px',
    cursor: 'pointer',
    boxShadow: '0 1px 6px #B0B8D422',
    transition: 'all .13s'
  };

  // Titre
  let testTitle = '';
  if (selectedTest && testLabels[selectedTest]) {
    testTitle = testLabels[selectedTest];
  }

  return (
  <>
    <div className="app-title" style={{ marginBottom: 30 }}>
      <img
        src="/logo_simplesize.png"
        alt="SimpleSize logo"
        style={{
          width: 54,
          height: 54,
          borderRadius: 14,
          boxShadow: "0 2px 18px #2f344a18",
        }}
      />
      SimpleSize
      <span style={{ fontSize: 11, color: "#B0B8D4", fontWeight: 400, marginLeft: 10, letterSpacing: 0 }}>
        by Agorytm
      </span>
    </div>
    <button
      style={{
        position: "absolute",
        top: 36,
        right: 55,
        zIndex: 3000,
        background: "#fff6da",
        border: "1.5px solid #FBC02D",
        color: "#B4880A",
        borderRadius: 12,
        fontWeight: 700,
        fontSize: 16,
        padding: "9px 18px",
        cursor: "pointer",
        boxShadow: "0 2px 12px #FBC02D22",
        marginBottom: 8,
      }}
      onClick={() => setSentenceModalOpen(true)}
      title="Fill parameters via a sentence template"
    >
      📝 Sentence template
    </button>
    <div style={containerStyle}>
      {/* LEFT */}
      <div style={leftPanelStyle}>
        <div style={{ fontWeight: 600, fontSize: 14, color: "#8A93B2", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 12 }}>
          Proposed tests
        </div>

        {/* Experimental mode: tests based on defined factors */}
        {designMode === "experimental" && (
          possibleTests.length === 0 ? (
            <div style={{ fontSize: 13, color: "#B0B8D4", fontStyle: "italic", lineHeight: 1.6 }}>
              Define your factors on the right<br />— the matching tests will appear here.
            </div>
          ) : (
            possibleTests.map((test) => (
              <div key={test} style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
                <button style={testButtonStyle(selectedTest === test, false)} onClick={() => handleTestSelect(test)}>
                  {testLabels[test] || test.toUpperCase()}
                </button>
                {testInfos[test] && (
                  <span
                    style={{ marginLeft: 7, cursor: "pointer", color: "#55D1E3", fontSize: 17, fontWeight: 800, borderRadius: "50%", border: "1.2px solid #55D1E3", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}
                    onClick={() => setInfoModal({ open: true, testKey: test })}
                  >i</span>
                )}
              </div>
            ))
          )
        )}

        {/* Variables mode: test proposed based on radio selection */}
        {designMode === "variables" && (
          !variablesTest ? (
            <div style={{ fontSize: 13, color: "#B0B8D4", fontStyle: "italic", lineHeight: 1.6 }}>
              Select what you want to study on the right<br />— the matching test will appear here.
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
              <button style={testButtonStyle(selectedTest === variablesTest, false)} onClick={() => handleTestSelect(variablesTest)}>
                {testLabels[variablesTest] || variablesTest.toUpperCase()}
              </button>
              {testInfos[variablesTest] && (
                <span
                  style={{ marginLeft: 7, cursor: "pointer", color: "#55D1E3", fontSize: 17, fontWeight: 800, borderRadius: "50%", border: "1.2px solid #55D1E3", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}
                  onClick={() => setInfoModal({ open: true, testKey: variablesTest })}
                >i</span>
              )}
            </div>
          )
        )}
      </div>

      {/* CENTER */}
      <div style={centerPanelStyle} ref={centerPanelRef}>
        {(result?.n_per_group != null) && (
          <>
            <DesignVisualizer
              groupFactors={interFactors}
              levelFactors={intraFactors}
              selectedTest={selectedTest}
              testTitle={testTitle}
              nPerGroup={result?.n_per_group}
              formData={formData}
              result={result}
            />

            {selectedTest === "lmm" && result?.estimated_power != null && (
              <div style={{ margin: "10px 0 6px 0", background: "#f0f8ff", border: "1px solid #b3d8f0", borderRadius: 8, padding: "10px 16px", fontSize: 13, color: "#334" }}>
                <div style={{ fontWeight: 700, marginBottom: 4, color: "#1a6a9a" }}>
                  Résultat simulation LMM
                </div>
                <div>
                  <b>N par groupe :</b> {result.n_per_group}
                  &nbsp;·&nbsp;
                  <b>Puissance simulée :</b> {Math.round(result.estimated_power * 100)}%
                  &nbsp;·&nbsp;
                  <b>Simulations :</b> {result.n_sim} ({result.converged} convergées)
                </div>
                {result.message && (
                  <div style={{ marginTop: 5, color: "#555", fontStyle: "italic" }}>{result.message}</div>
                )}
              </div>
            )}

            <button style={exportButtonStyle} onClick={handleExportJpeg}>
              Export
            </button>
          </>
        )}

      </div>

      {/* RIGHT */}
      <div style={rightPanelStyle}>
        <AnovaForm
          formData={formData}
          onUpdate={handleFormUpdate}
          conversionInfo={conversionInfo}
          showConversionInfo={showConversionInfo}
          selectedTest={selectedTest}
          onLmmLaunch={handleLmmLaunch}
          isLoadingLmm={isLoadingLmm}
          interFactors={interFactors}
          intraFactors={intraFactors}
          onRun={() => {
            const test = designMode === "variables" ? variablesTest : selectedTest;
            if (test && test !== "lmm") handleTestSelect(test);
          }}
          onDesignModeChange={(mode) => setDesignMode(mode)}
          onVariablesTestChange={(test) => {
            setVariablesTest(test);
            if (test) setSelectedTest(test);
          }}
        />
      </div>
    </div>

    {/* TEST INFO MODAL */}
    {infoModal.open && testInfos[infoModal.testKey] && (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(47,52,74,0.17)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 17,
            padding: "28px 32px 20px 32px",
            minWidth: 370,
            maxWidth: 440,
            boxShadow: "0 2px 24px #2f344a33",
            position: "relative",
          }}
        >
          <div
            style={{
              fontSize: 21,
              fontWeight: 700,
              marginBottom: 15,
              color: "#2F344A",
            }}
          >
            {testInfos[infoModal.testKey].title}
          </div>
          <div style={{ fontSize: 16, color: "#344", lineHeight: 1.5 }}>
            {testInfos[infoModal.testKey].content}
          </div>
          <button
            onClick={() => setInfoModal({ open: false, testKey: null })}
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              background: "none",
              border: "none",
              fontWeight: 800,
              fontSize: 18,
              color: "#B0B8D4",
              cursor: "pointer",
            }}
            title="Close"
          >
            ×
          </button>
        </div>
      </div>
    )}

    {/* SENTENCE TEMPLATE MODAL */}
    {sentenceModalOpen && (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(47,52,74,0.17)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 900,
        }}
      >
        <PlanSentenceFiller
          formData={formData}
          onApply={(data) => {
            setSentenceModalOpen(false);
            handleFormUpdate(data);
            // If template specifies a direct test, switch to variables mode and auto-select
            if (data._testType) {
              setDesignMode("variables");
              setVariablesTest(data._testType);
              setSelectedTest(data._testType);
            }
          }}
          onCancel={() => setSentenceModalOpen(false)}
        />
      </div>
    )}
      </>
  );
}

export default App;
