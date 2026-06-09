import React, { useState, useRef } from 'react';
import AnovaForm from '../AnovaForm';
import DesignVisualizer from '../DesignVisualizer';
import { toJpeg } from 'html-to-image';
import '../SimpleSize.css';
import PlanSentenceFiller from '../PlanSentenceFiller';
import { useTranslation } from 'react-i18next';

function HomePage() {
  const { i18n } = useTranslation();
  const fr = i18n.language === 'fr';

  const [interFactors, setInterFactors] = useState([{ name: '', levels: [] }]);
  const [intraFactors, setIntraFactors] = useState([{ name: '', levels: [] }]);
  const [formData, setFormData] = useState({ alpha: "0.05", power: "0.8", f: "0.25" });
  const [result, setResult] = useState(null);
  const [possibleTests, setPossibleTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [isLoadingLmm, setIsLoadingLmm] = useState(false);
  const [designTouched, setDesignTouched] = useState(false);
  const [designMode, setDesignMode] = useState("experimental");
  const [variablesTest, setVariablesTest] = useState(null);
  const [conversionInfo, setConversionInfo] = useState("");
  const [showConversionInfo, setShowConversionInfo] = useState(false);
  const [infoModal, setInfoModal] = useState({ open: false, testKey: null });
  const [sentenceModalOpen, setSentenceModalOpen] = useState(false);

  React.useEffect(() => {
    const raw = sessionStorage.getItem('ss_gallery_load');
    if (!raw) return;
    sessionStorage.removeItem('ss_gallery_load');
    try {
      const { formData: gf, defaultTest: gt } = JSON.parse(raw);
      if (gf) {
        setFormData(gf);
        if (gf.interFactors) setInterFactors(gf.interFactors);
        if (gf.intraFactors) setIntraFactors(gf.intraFactors);
      }
      if (gt) { setSelectedTest(gt); }
    } catch(e) { console.error(e); }
  }, []);

  const centerPanelRef = useRef(null);
  const exportAreaRef  = useRef(null);   // viz + results, cropped tight
  const designShareRef = useRef(null);   // design only

  // ----------- LABELS TESTS ---------
  const testLabels = fr ? {
    ttest:          "t-test indépendant",
    anova:          "ANOVA inter-sujets",
    anova_rm:       "ANOVA mesures répétées",
    anova_mixed:    "ANOVA mixte",
    lmm:            "Modèle mixte linéaire (LMM)",
    anova_factorial:"ANOVA factorielle",
    ttest_paired:   "t-test apparié",
    correlation:    "Corrélation (Pearson r)",
    chi2:           "Khi-deux (χ²)",
    regression:     "Régression"
  } : {
    ttest:          "Independent t-test",
    anova:          "Between-subjects ANOVA",
    anova_rm:       "Repeated-measures ANOVA",
    anova_mixed:    "Mixed ANOVA",
    lmm:            "Linear Mixed Model (LMM)",
    anova_factorial:"Factorial ANOVA",
    ttest_paired:   "Paired t-test",
    correlation:    "Correlation (Pearson r)",
    chi2:           "Chi-square",
    regression:     "Regression"
  };

  // --------- TEST INFORMATION ---------
  const testInfos = {
    ttest: {
      title: fr ? "t-test indépendant" : "Independent t-test",
      content: fr ? (
        <>
          <b>Indépendance des groupes</b><br />
          ➝ Vérifier : design de l'étude (chaque participant dans un seul groupe)<br />
          ➝ Robustesse : essentielle, la violation invalide le test
          <br /><br />
          <b>Normalité dans chaque groupe</b><br />
          ➝ Vérifier : test de Shapiro–Wilk par groupe<br />
          ➝ Robustesse : peu sensible si N &gt; 30 par groupe
          <br /><br />
          <b>Homogénéité des variances</b><br />
          ➝ Vérifier : test de Levene<br />
          ➝ Robustesse : si violée, utiliser le t-test de Welch
        </>
      ) : (
        <>
          <b>Group independence</b><br />
          ➝ Check: study design (each participant is only in one group)<br />
          ➝ Robustness: essential, violation invalidates the test
          <br /><br />
          <b>Normality within each group</b><br />
          ➝ Check: Shapiro–Wilk test per group<br />
          ➝ Robustness: not very sensitive if N &gt; 30 per group
          <br /><br />
          <b>Homogeneity of variances</b><br />
          ➝ Check: Levene's test<br />
          ➝ Robustness: if violated, use Welch's t-test
        </>
      )
    },
    anova: {
      title: fr ? "ANOVA inter-sujets" : "Between-subjects ANOVA",
      content: fr ? (
        <>
          <b>Indépendance des groupes</b><br />
          ➝ Vérifier : design<br />
          ➝ Robustesse : essentielle
          <br /><br />
          <b>Normalité dans chaque groupe</b><br />
          ➝ Vérifier : Shapiro–Wilk par groupe<br />
          ➝ Robustesse : peu sensible si N &gt; 30
          <br /><br />
          <b>Homogénéité des variances</b><br />
          ➝ Vérifier : test de Levene<br />
          ➝ Robustesse : assez robuste si les groupes ont des tailles similaires
        </>
      ) : (
        <>
          <b>Group independence</b><br />
          ➝ Check: study design<br />
          ➝ Robustness: essential
          <br /><br />
          <b>Normality within each group</b><br />
          ➝ Check: Shapiro–Wilk per group<br />
          ➝ Robustness: not sensitive if N &gt; 30 per group
          <br /><br />
          <b>Homogeneity of variances</b><br />
          ➝ Check: Levene's test<br />
          ➝ Robustness: fairly robust if group sizes are similar
        </>
      )
    },
    anova_rm: {
      title: fr ? "ANOVA mesures répétées" : "Repeated-measures ANOVA (within-subjects)",
      content: fr ? (
        <>
          <b>Normalité dans chaque condition</b><br />
          ➝ Vérifier : Shapiro–Wilk par condition<br />
          ➝ Robustesse : peu sensible si N &gt; 30
          <br /><br />
          <b>Sphéricité</b><br />
          ➝ Vérifier : test de Mauchly<br />
          ➝ Robustesse : appliquer une correction (Greenhouse–Geisser) si violée
        </>
      ) : (
        <>
          <b>Normality within each condition</b><br />
          ➝ Check: Shapiro–Wilk per condition<br />
          ➝ Robustness: not very sensitive if N &gt; 30
          <br /><br />
          <b>Sphericity</b><br />
          ➝ Check: Mauchly's test<br />
          ➝ Robustness: apply correction (Greenhouse–Geisser) if violated
        </>
      )
    },
    anova_mixed: {
      title: fr ? "ANOVA mixte" : "Mixed ANOVA (within- and between-subjects)",
      content: fr ? (
        <>
          <b>Normalité pour chaque combinaison groupe × condition</b><br />
          ➝ Vérifier : Shapiro–Wilk pour chaque combinaison<br />
          <br />
          <b>Homogénéité des variances (inter-sujets)</b><br />
          ➝ Vérifier : test de Levene<br />
          <br />
          <b>Sphéricité (intra-sujets)</b><br />
          ➝ Vérifier : test de Mauchly<br />
          ➝ Corriger si violée (Greenhouse–Geisser)
          <br /><br />
          <b>Indépendance des groupes</b><br />
          ➝ Vérifier : design — essentielle
        </>
      ) : (
        <>
          <b>Normality for each group × condition combination</b><br />
          ➝ Check: Shapiro–Wilk for each combination<br />
          <br />
          <b>Homogeneity of variances for between-subjects</b><br />
          ➝ Check: Levene's test<br />
          <br />
          <b>Sphericity for within-subjects factors</b><br />
          ➝ Check: Mauchly's test; apply Greenhouse–Geisser if violated
          <br /><br />
          <b>Between-subjects group independence</b><br />
          ➝ Check: study design — essential
        </>
      )
    },
    lmm: {
      title: "Linear Mixed Model (LMM)",
      content: fr ? (
        <>
          <b>LMM (Modèle Mixte Linéaire)</b><br />
          ➝ Analyse de puissance avec effets fixes et aléatoires.<br />
          ➝ Nécessite un facteur aléatoire (ex : participants).<br /><br />
          <b>Méthode</b> : N estimé analytiquement puis validé par simulations Monte Carlo.
        </>
      ) : (
        <>
          <b>LMM (Linear Mixed Model)</b><br />
          ➝ Power analysis based on a model with fixed and random effects.<br />
          ➝ Requires specifying a random factor (usually "participants").<br /><br />
          <b>Method</b>: N found analytically, then validated by Monte Carlo simulations.
        </>
      )
    },
    ttest_paired: {
      title: fr ? "t-test apparié" : "Paired t-test",
      content: fr ? (
        <>
          <b>Normalité des différences</b><br />
          ➝ Vérifier : Shapiro–Wilk sur les scores de différences (post − pré)<br />
          ➝ Robustesse : peu sensible si N &gt; 30
          <br /><br />
          <b>Dépendance entre les mesures</b><br />
          ➝ Chaque participant est mesuré deux fois — il est son propre contrôle
          <br /><br />
          <b>Taille d'effet d</b> : 0,2 = petit · 0,5 = moyen · 0,8 = grand
        </>
      ) : (
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
      title: fr ? "Corrélation (Pearson r)" : "Correlation (Pearson r)",
      content: fr ? (
        <>
          <b>Linéarité</b><br />
          ➝ Vérifier : nuage de points entre les deux variables<br />
          ➝ Si non linéaire, utiliser le ρ de Spearman
          <br /><br />
          <b>Normalité bivariée</b><br />
          ➝ Peu critique si N &gt; 30
          <br /><br />
          <b>Pas de valeurs aberrantes influentes</b><br />
          ➝ Une seule valeur aberrante peut fortement distordre r
          <br /><br />
          <b>Taille d'effet r</b> : 0,10 = petit · 0,30 = moyen · 0,50 = grand
        </>
      ) : (
        <>
          <b>Linearity</b><br />
          ➝ Check: scatterplot between the two variables<br />
          ➝ If non-linear, use Spearman's ρ instead
          <br /><br />
          <b>Bivariate normality</b><br />
          ➝ Not critical if N &gt; 30
          <br /><br />
          <b>No influential outliers</b><br />
          ➝ One outlier can strongly distort r
          <br /><br />
          <b>Effect size r</b>: 0.10 = small · 0.30 = medium · 0.50 = large
        </>
      )
    },
    chi2: {
      title: fr ? "Khi-deux (χ²)" : "Chi-square test",
      content: fr ? (
        <>
          <b>Indépendance des observations</b><br />
          ➝ Chaque participant compté une seule fois (essentiel)
          <br /><br />
          <b>Fréquences attendues minimales</b><br />
          ➝ Toutes les fréquences attendues ≥ 5<br />
          ➝ Si violé : test exact de Fisher ou fusion de catégories
          <br /><br />
          <b>Degrés de liberté</b> : dl = (lignes − 1) × (colonnes − 1)
          <br /><br />
          <b>Taille d'effet w</b> : 0,10 = petit · 0,30 = moyen · 0,50 = grand
        </>
      ) : (
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
      title: fr ? "Régression linéaire multiple" : "Multiple Linear Regression",
      content: fr ? (
        <>
          <b>Linéarité</b> — Vérifier : résidus vs. valeurs ajustées
          <br /><br />
          <b>Indépendance des résidus</b> — Vérifier : test de Durbin–Watson
          <br /><br />
          <b>Homoscédasticité</b> — Vérifier : test de Breusch–Pagan
          <br /><br />
          <b>Normalité des résidus</b> — Q-Q plot (peu critique si N &gt; 50)
          <br /><br />
          <b>Taille d'effet f²</b> = R²/(1−R²) : 0,02 = petit · 0,15 = moyen · 0,35 = grand
        </>
      ) : (
        <>
          <b>Linearity</b> — Check: residuals vs. fitted plot
          <br /><br />
          <b>Independence of residuals</b> — Check: Durbin–Watson test
          <br /><br />
          <b>Homoscedasticity</b> — Check: Breusch–Pagan test
          <br /><br />
          <b>Normality of residuals</b> — Q-Q plot (not critical N &gt; 50)
          <br /><br />
          <b>Effect size f²</b> = R²/(1−R²): 0.02 = small · 0.15 = medium · 0.35 = large
        </>
      )
    }
  };

  const handleFormUpdate = (data) => {
    sessionStorage.setItem('ss_last_design', JSON.stringify({ ...data, selectedTest }));
    if (data.interFactors) setInterFactors(data.interFactors);
    if (data.intraFactors) setIntraFactors(data.intraFactors);
    setFormData(data);
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

  const detectPossibleTests = (data, touched) => {
    if (!touched) { setPossibleTests([]); return; }
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
    if (nIntra >= 1 && nInter === 0) { tests.push("anova_rm"); tests.push("lmm"); }
    if (nInter >= 1 && nIntra >= 1) { tests.push("anova_mixed"); tests.push("lmm"); }
    if (nIntra === 1 && validIntra[0]?.levels.length === 2 && nInter === 0) tests.push("ttest_paired");
    tests = [...new Set(tests)];
    setPossibleTests(tests);
    if (selectedTest && !['correlation','chi2','regression'].includes(selectedTest) && !tests.includes(selectedTest)) {
      setSelectedTest(null);
    }
  };

  const handleTestSelect = async (test) => {
    setSelectedTest(test);
    setResult(null);
    if (['correlation','chi2','regression'].includes(test)) {
      setDesignMode("variables"); setVariablesTest(test);
    } else {
      setDesignMode("experimental");
    }
    const factors = {};
    interFactors.forEach(f => { if (f.name) factors[f.name] = "between"; });
    intraFactors.forEach(f => { if (f.name) factors[f.name] = "within"; });
    const group_levels = interFactors[0]?.levels?.length > 0 ? interFactors[0].levels : [];
    const level_levels = intraFactors[0]?.levels?.length > 0 ? intraFactors[0].levels : [];
    let fValue = parseFloat((formData.f || "0.25").replace(",", "."));
    let effectToSend = fValue;
    if (test === "ttest" && !isNaN(fValue)) {
      effectToSend = fValue * 2;
      const msg = fr
        ? `Conversion G*Power : f × 2 = d = ${effectToSend.toFixed(3)}`
        : `G*Power conversion: f × 2 = d = ${effectToSend.toFixed(3)}`;
      setConversionInfo(msg); setShowConversionInfo(true);
      setTimeout(() => setShowConversionInfo(false), 3500);
    }
    if (test === "lmm") return;
    const payload = {
      alpha: parseFloat((formData.alpha || "0.05").replace(",", ".")),
      power: parseFloat((formData.power || "0.8").replace(",", ".")),
      f: effectToSend,
      r: parseFloat((formData.r || "0.3").replace(",", ".")),
      f2: parseFloat((formData.f2 || "0.15").replace(",", ".")),
      chi2_df: parseInt(formData.chi2_df || 1),
      n_predictors: parseInt(formData.n_predictors || 1),
      two_tailed: true, factors, group_levels, level_levels,
      interFactors, intraFactors, selected_test: test
    };
    try {
      const res = await fetch((process.env.REACT_APP_API_URL || 'https://simplesize-production.up.railway.app') + '/api/simplesize', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      setResult(data);
    } catch { setResult(null); }
  };

  const handleLmmLaunch = async () => {
    setIsLoadingLmm(true); setResult(null);
    const factors = {};
    interFactors.forEach(f => { if (f.name) factors[f.name] = "between"; });
    intraFactors.forEach(f => { if (f.name) factors[f.name] = "within"; });
    const group_levels = interFactors[0]?.levels?.length > 0 ? interFactors[0].levels : [];
    const level_levels = intraFactors[0]?.levels?.length > 0 ? intraFactors[0].levels : [];
    const payload = {
      alpha: parseFloat((formData.alpha || "0.05").replace(",", ".")),
      power: parseFloat((formData.power || "0.8").replace(",", ".")),
      f: parseFloat((formData.f || "0.25").replace(",", ".")),
      factors, group_levels, level_levels, interFactors, intraFactors,
      selected_test: "lmm", random_factor: formData.randomFactor, n_sim: formData.nSimulations || 50
    };
    try {
      const res = await fetch((process.env.REACT_APP_API_URL || 'https://simplesize-production.up.railway.app') + '/api/simplesize', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      setResult(data);
    } catch { setResult(null); }
    setIsLoadingLmm(false);
  };

  // ----------- EXPORT: figure + résultats, cadrage serré -----------
  const handleExportJpeg = () => {
    const target = exportAreaRef.current;
    if (!target) return;
    toJpeg(target, { quality: 0.98, backgroundColor: '#fff', pixelRatio: 2 })
      .then(dataUrl => {
        const link = document.createElement('a');
        link.download = 'simplesize-export.jpeg';
        link.href = dataUrl; link.click();
      })
      .catch(() => alert(fr ? 'Erreur lors de la génération du JPEG' : 'Error while generating the JPEG'));
  };

  // ----------- SHARE DESIGN ONLY -----------
  const handleShareDesign = () => {
    const target = designShareRef.current;
    if (!target) return;
    toJpeg(target, { quality: 0.98, backgroundColor: '#fff', pixelRatio: 2 })
      .then(dataUrl => {
        const link = document.createElement('a');
        link.download = 'simplesize-design.jpeg';
        link.href = dataUrl; link.click();
      })
      .catch(() => alert(fr ? 'Erreur lors de la génération du JPEG' : 'Error generating JPEG'));
  };

  // ----------- UI / PANELS -----------
  const containerStyle = {
    display: 'grid', gridTemplateColumns: '220px 1fr 300px', gap: '24px',
    maxWidth: 1100, margin: '16px auto', background: '#fff', borderRadius: 24,
    boxShadow: '0 4px 32px #55D1E312', padding: 26, minHeight: 580
  };
  const colStyle = { display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 };
  const leftPanelStyle  = { ...colStyle, borderRight: '1.5px solid #F4F6F8', paddingRight: 16, alignItems: 'flex-start' };
  const centerPanelStyle = { ...colStyle, alignItems: 'center', justifyContent: 'flex-start', padding: '0 12px', paddingTop: 8 };
  const rightPanelStyle  = { ...colStyle, borderLeft: '1.5px solid #F4F6F8', paddingLeft: 16 };

  const testButtonStyle = (active, disabled) => ({
    background: active ? 'linear-gradient(90deg, #80e8fc 0%, #f4f6f8 100%)' : disabled ? '#F4F6F8' : 'linear-gradient(90deg,#f4f6f8 0%, #e6faff 100%)',
    color: active ? '#2F344A' : disabled ? '#B0B8D4' : '#2F344A',
    border: active ? '2px solid #55D1E3' : '1.5px solid #55D1E3',
    borderRadius: 16, fontWeight: 600, fontSize: 16, margin: '0 0 10px 0', padding: '10px 0',
    width: '100%', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1,
    boxShadow: active ? '0 2px 12px #55D1E326' : '0 1px 4px #55D1E312', transition: 'all .15s'
  });

  const actionBtnStyle = (bg, border, color) => ({
    background: bg, border: `1.5px solid ${border}`, color,
    borderRadius: 20, fontWeight: 600, fontSize: 13, padding: '7px 18px',
    cursor: 'pointer', transition: 'all .13s', boxShadow: '0 1px 6px rgba(0,0,0,0.07)'
  });

  let testTitle = selectedTest && testLabels[selectedTest] ? testLabels[selectedTest] : '';

  return (
  <>
    <div style={containerStyle}>
      {/* LEFT */}
      <div style={leftPanelStyle}>
        <div style={{ fontWeight: 600, fontSize: 14, color: "#8A93B2", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 12 }}>
          {fr ? "Tests proposés" : "Proposed tests"}
        </div>

        {designMode === "experimental" && (
          possibleTests.length === 0 ? (
            <div style={{ fontSize: 13, color: "#B0B8D4", fontStyle: "italic", lineHeight: 1.6 }}>
              {fr
                ? <>Définissez vos facteurs à droite<br />— les tests correspondants apparaîtront ici.</>
                : <>Define your factors on the right<br />— the matching tests will appear here.</>}
            </div>
          ) : (
            possibleTests.map(test => (
              <div key={test} style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
                <button style={testButtonStyle(selectedTest === test, false)} onClick={() => handleTestSelect(test)}>
                  {testLabels[test] || test.toUpperCase()}
                </button>
                {testInfos[test] && (
                  <span style={{ marginLeft: 7, cursor: "pointer", color: "#55D1E3", fontSize: 17, fontWeight: 800, borderRadius: "50%", border: "1.2px solid #55D1E3", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}
                    onClick={() => setInfoModal({ open: true, testKey: test })}>i</span>
                )}
              </div>
            ))
          )
        )}

        {designMode === "variables" && (
          !variablesTest ? (
            <div style={{ fontSize: 13, color: "#B0B8D4", fontStyle: "italic", lineHeight: 1.6 }}>
              {fr
                ? <>Sélectionnez ce que vous voulez étudier à droite<br />— le test correspondant apparaîtra ici.</>
                : <>Select what you want to study on the right<br />— the matching test will appear here.</>}
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
              <button style={testButtonStyle(selectedTest === variablesTest, false)} onClick={() => handleTestSelect(variablesTest)}>
                {testLabels[variablesTest] || variablesTest.toUpperCase()}
              </button>
              {testInfos[variablesTest] && (
                <span style={{ marginLeft: 7, cursor: "pointer", color: "#55D1E3", fontSize: 17, fontWeight: 800, borderRadius: "50%", border: "1.2px solid #55D1E3", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}
                  onClick={() => setInfoModal({ open: true, testKey: variablesTest })}>i</span>
              )}
            </div>
          )
        )}
      </div>

      {/* CENTER */}
      <div style={centerPanelStyle} ref={centerPanelRef}>

        {selectedTest ? (
          <>
            {/* Exportable area: design + results, cropped tight */}
            <div ref={exportAreaRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%' }}>

              {/* Design viz — also has its own ref for design-only share */}
              <div ref={designShareRef} style={{ background: '#fff', borderRadius: 14, padding: '14px 10px 10px', width: '100%', boxSizing: 'border-box' }}>
                <DesignVisualizer
                  groupFactors={interFactors} levelFactors={intraFactors}
                  selectedTest={selectedTest} testTitle={testTitle}
                  nPerGroup={result?.n_per_group ?? null} formData={formData} result={result}
                />
                {/* SimpleSize branding for design share */}
                <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #f0f3f8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: '#C8D0E7', fontWeight: 600 }}>
                    {fr ? "Conçu avec SimpleSize" : "Designed with SimpleSize"}
                  </span>
                  <span style={{ fontSize: 10, color: '#C8D0E7' }}>simplesize.science</span>
                </div>
              </div>

              {/* Results appear after calculation */}
              {result?.n_per_group != null && (
                <>
                  {selectedTest === "lmm" && result?.estimated_power != null && (
                    <div style={{ width: '100%', background: "#f0f8ff", border: "1px solid #b3d8f0", borderRadius: 8, padding: "10px 16px", fontSize: 13, color: "#334" }}>
                      <div style={{ fontWeight: 700, marginBottom: 4, color: "#1a6a9a" }}>
                        {fr ? "Résultat simulation LMM" : "LMM simulation result"}
                      </div>
                      <div>
                        <b>{fr ? "N par groupe :" : "N per group:"}</b> {result.n_per_group}
                        &nbsp;·&nbsp;
                        <b>{fr ? "Puissance simulée :" : "Simulated power:"}</b> {Math.round(result.estimated_power * 100)}%
                        &nbsp;·&nbsp;
                        <b>{fr ? "Simulations :" : "Simulations:"}</b> {result.n_sim} ({result.converged} {fr ? "convergées" : "converged"})
                      </div>
                      {result.message && <div style={{ marginTop: 5, color: "#555", fontStyle: "italic" }}>{result.message}</div>}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Action buttons — outside exportable area */}
            <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button style={actionBtnStyle('#f0fbfd', '#b3e8f0', '#1a8fa8')} onClick={handleShareDesign}>
                &#128247; {fr ? "Partager ce design (JPG)" : "Share design (JPG)"}
              </button>
              {result?.n_per_group != null && (
                <button style={actionBtnStyle('#fff', '#E0E7EF', '#2F344A')} onClick={handleExportJpeg}>
                  &#8659; {fr ? "Exporter figure + résultats" : "Export figure + results"}
                </button>
              )}
            </div>
          </>
        ) : (
          <div style={{ color: "#C8D0E7", fontSize: 15, fontStyle: "italic", marginTop: 40, textAlign: "center", lineHeight: 1.8 }}>
            {fr
              ? <>Définissez votre design à droite<br />et sélectionnez un test pour le visualiser ici.</>
              : <>Define your design on the right<br />and select a test to visualize it here.</>}
          </div>
        )}
      </div>

      {/* RIGHT */}
      <div style={rightPanelStyle}>
        <AnovaForm
          formData={formData} onUpdate={handleFormUpdate}
          conversionInfo={conversionInfo} showConversionInfo={showConversionInfo}
          selectedTest={selectedTest} onLmmLaunch={handleLmmLaunch}
          isLoadingLmm={isLoadingLmm} interFactors={interFactors} intraFactors={intraFactors}
          onRun={() => { const test = designMode === "variables" ? variablesTest : selectedTest; if (test && test !== "lmm") handleTestSelect(test); }}
          onDesignModeChange={mode => setDesignMode(mode)}
          onOpenTemplate={() => setSentenceModalOpen(true)}
          onVariablesTestChange={test => { setVariablesTest(test); if (test) setSelectedTest(test); }}
        />
      </div>
    </div>

    {/* TEST INFO MODAL */}
    {infoModal.open && testInfos[infoModal.testKey] && (
      <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(47,52,74,0.17)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
        <div style={{ background: "#fff", borderRadius: 17, padding: "28px 32px 20px 32px", minWidth: 370, maxWidth: 440, boxShadow: "0 2px 24px #2f344a33", position: "relative" }}>
          <div style={{ fontSize: 21, fontWeight: 700, marginBottom: 15, color: "#2F344A" }}>{testInfos[infoModal.testKey].title}</div>
          <div style={{ fontSize: 16, color: "#344", lineHeight: 1.5 }}>{testInfos[infoModal.testKey].content}</div>
          <button onClick={() => setInfoModal({ open: false, testKey: null })} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", fontWeight: 800, fontSize: 18, color: "#B0B8D4", cursor: "pointer" }}>×</button>
        </div>
      </div>
    )}

    {/* SENTENCE TEMPLATE MODAL */}
    {sentenceModalOpen && (
      <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(47,52,74,0.17)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 900 }}>
        <PlanSentenceFiller
          formData={formData}
          onApply={(data) => {
            setSentenceModalOpen(false);
            handleFormUpdate(data);
            if (data._testType) { setDesignMode("variables"); setVariablesTest(data._testType); setSelectedTest(data._testType); }
          }}
          onCancel={() => setSentenceModalOpen(false)}
        />
      </div>
    )}
  </>
  );
}

export default HomePage;
