import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

function AnovaForm({
  formData, onUpdate, conversionInfo, showConversionInfo, selectedTest, onLmmLaunch, isLoadingLmm, onRun,
  interFactors: externalInterFactors = null,
  intraFactors: externalIntraFactors = null,
  onDesignModeChange,
  onVariablesTestChange,
  onOpenTemplate,
}) {
  const { i18n } = useTranslation();
  const fr = i18n.language === 'fr';

  const [interFactors, setInterFactors] = useState(externalInterFactors || [{ name: '', levels: [] }]);
  const [intraFactors, setIntraFactors] = useState(externalIntraFactors || [{ name: '', levels: [] }]);
  const totalFactors = interFactors.length + intraFactors.length;
  const canAdd = totalFactors < 3;

  const [alpha, setAlpha] = useState(formData.alpha || "0.05");
  const [power, setPower] = useState(formData.power || "0.8");
  const [f, setF] = useState(formData.f || "0.25");
  const [r, setR] = useState(formData.r || "0.3");
  const [chi2Df, setChi2Df] = useState(formData.chi2_df || "1");
  const [nPredictors, setNPredictors] = useState(formData.n_predictors || "1");
  const [f2, setF2] = useState(formData.f2 || "0.15");
  const [randomFactor, setRandomFactor] = useState(formData.randomFactor || "");
  const [randomStructure, setRandomStructure] = useState(formData.randomStructure || "intercept");
  const [sdSlope, setSdSlope] = useState(formData.sdSlope || "0.3");
  const [nItems, setNItems] = useState(formData.nItems || "20");
  const [sdItem, setSdItem] = useState(formData.sdItem || "0.3");
  const [expectMissing, setExpectMissing] = useState(formData.expectMissing || false);
  const [sdSubject, setSdSubject] = useState(formData.sdSubject || "0.5");
  const [corr, setCorr] = useState(formData.corr !== undefined ? String(formData.corr) : "0.5");
  const [epsilon, setEpsilon] = useState(formData.epsilon !== undefined ? String(formData.epsilon) : "1.0");
  const [testMethod, setTestMethod] = useState(formData.testMethod || "lrt");
  const [lmmAdvanced, setLmmAdvanced] = useState(false);
  const [missingRate, setMissingRate] = useState(formData.missingRate || 0);
  const [nComparisons, setNComparisons] = useState(formData.nComparisons || 1);
  const [mcMethod, setMcMethod] = useState(formData.mcMethod || "bonferroni");

  const [designTab, setDesignTab] = useState("experimental");
  const [varType, setVarType] = useState(null);

  const [hasSample, setHasSample] = useState(false);
  const [nGiven, setNGiven] = useState("");
  const [mde, setMDE] = useState(null);
  const [mdeError, setMdeError] = useState("");

  useEffect(() => {
    setAlpha(formData.alpha || "0.05");
    setPower(formData.power || "0.8");
    setF(formData.f || "0.25");
    setR(formData.r || "0.3");
    setChi2Df(formData.chi2_df || "1");
    setNPredictors(formData.n_predictors || "1");
    setF2(formData.f2 || "0.15");
    setRandomFactor(formData.randomFactor || "");
    if (formData.sdSubject) setSdSubject(formData.sdSubject);
    if (formData.randomStructure) setRandomStructure(formData.randomStructure);
    if (formData.sdSlope) setSdSlope(formData.sdSlope);
    if (formData.nItems) setNItems(formData.nItems);
    if (formData.sdItem) setSdItem(formData.sdItem);
    if (formData.expectMissing !== undefined) setExpectMissing(formData.expectMissing);
    if (formData.corr !== undefined) setCorr(String(formData.corr));
    if (formData.nComparisons !== undefined) setNComparisons(formData.nComparisons);
    if (formData.missingRate !== undefined) setMissingRate(formData.missingRate);
    if (formData.mcMethod !== undefined) setMcMethod(formData.mcMethod);
    if (formData.epsilon !== undefined) setEpsilon(String(formData.epsilon));
    if (formData.testMethod) setTestMethod(formData.testMethod);
    if (formData.interFactors) setInterFactors(formData.interFactors);
    if (formData.intraFactors) setIntraFactors(formData.intraFactors);
  }, [formData]);

  useEffect(() => {
    onUpdate({
      ...formData, interFactors, intraFactors, alpha, power, f, r,
      chi2_df: chi2Df, n_predictors: nPredictors, f2, randomFactor,
      nSimulations: formData.nSimulations || 50,
      sdSubject, testMethod, corr, epsilon, nComparisons, mcMethod, missingRate,
      randomStructure, sdSlope, nItems, sdItem, expectMissing,
    });
  }, [interFactors, intraFactors, alpha, power, f, r, chi2Df, nPredictors, f2, randomFactor, sdSubject, testMethod, corr, epsilon, nComparisons, mcMethod, missingRate, randomStructure, sdSlope, nItems, sdItem, expectMissing, formData.nSimulations]);

  useEffect(() => {
    if (!hasSample) { setNGiven(""); setMDE(null); setMdeError(""); }
  }, [hasSample, selectedTest, interFactors, intraFactors]);

  useEffect(() => {
    if (hasSample && nGiven && !isNaN(Number(nGiven)) && Number(nGiven) > 0 && selectedTest) {
      fetchMDE();
    } else { setMDE(null); setMdeError(""); }
  }, [nGiven, hasSample, selectedTest, interFactors, intraFactors, alpha, power, r, f, f2, chi2Df, nPredictors]);

  useEffect(() => { if (onDesignModeChange) onDesignModeChange(designTab); }, [designTab]);
  useEffect(() => { if (onVariablesTestChange) onVariablesTestChange(varType); }, [varType]);

  const fetchMDE = async () => {
    const payload = {
      alpha: parseFloat(alpha.replace(",", ".")), power: parseFloat(power.replace(",", ".")),
      f: parseFloat(f.replace(",", ".")), r: parseFloat(r.replace(",", ".")),
      f2: parseFloat(f2.replace(",", ".")), chi2_df: parseInt(chi2Df),
      n_predictors: parseInt(nPredictors),
      group_levels: interFactors[0]?.levels || [], level_levels: intraFactors[0]?.levels || [],
      interFactors, intraFactors, selected_test: selectedTest, mde_mode: true, n_given: Number(nGiven),
      corr: parseFloat(corr), epsilon: parseFloat(epsilon),
      n_comparisons: nComparisons, mc_method: mcMethod
    };
    try {
      const res = await fetch((process.env.REACT_APP_API_URL || 'https://simplesize-production.up.railway.app') + '/api/simplesize', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.mde) { setMDE(data.mde); setMdeError(""); }
      else if (data.error) { setMDE(null); setMdeError(data.error); }
      else { setMDE(null); setMdeError(fr ? "Erreur inconnue" : "Unknown error"); }
    } catch { setMDE(null); setMdeError(fr ? "Erreur réseau" : "Network error"); }
  };

  const labelStyle = { fontWeight: 500, fontSize: 14, marginTop: 8, display: 'block' };
  const inputStyle = { margin: '0 0 10px 0', padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', width: 130 };
  const addButtonStyle = {
    background: 'linear-gradient(90deg,#fff7e0 0%,#ffeabf 100%)',
    color: '#b4880a', border: 'none', borderRadius: '50%', width: 32, height: 32,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 20, margin: '0 6px', cursor: 'pointer', boxShadow: '0 1px 5px #ffeeb412'
  };
  const removeButtonStyle = {
    background: 'linear-gradient(90deg,#fde2e2 0%,#fff7e7 100%)',
    color: '#a0422c', border: 'none', borderRadius: '50%', width: 26, height: 26,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 16, margin: '0 3px', cursor: 'pointer', boxShadow: '0 1px 4px #eb21211a'
  };
  const factorColors = ["#4fc6e1", "#f9b448", "#e99db9"];

  let effetLabel = "f";
  if (selectedTest === "ttest" || selectedTest === "ttest_paired") effetLabel = "d";
  let showWarning = false;
  if (mde && ((selectedTest === "ttest" && mde > 0.8) || (selectedTest !== "ttest" && mde > 0.4))) showWarning = true;

  function getFactorColor(factor, allFactors) {
    const idx = allFactors.findIndex(ff => ff === factor);
    if (factor.levels && factor.levels.length >= 2 && idx !== -1) return factorColors[idx % factorColors.length];
    return "white";
  }
  const allFactors = [...interFactors, ...intraFactors];

  const tabBarStyle = { display: "flex", borderBottom: "2px solid #E7ECF2", marginBottom: 16, marginTop: 4 };
  const tabBtnStyle = (active) => ({
    flex: 1, padding: "8px 6px", fontWeight: active ? 700 : 400, fontSize: 13,
    color: active ? "#1a8fa8" : "#9AA3C0", background: "none", border: "none",
    borderBottom: active ? "2.5px solid #55D1E3" : "2.5px solid transparent",
    marginBottom: -2, cursor: "pointer", transition: "all 0.15s",
  });
  const radioOptionStyle = (active) => ({
    display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", marginBottom: 8,
    borderRadius: 9, border: active ? "1.5px solid #55D1E3" : "1.5px solid #E7ECF2",
    background: active ? "#f0fbfd" : "#fafbfc", cursor: "pointer",
  });

  return (
    <form onSubmit={e => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>

      {/* SENTENCE TEMPLATE BUTTON */}
      {onOpenTemplate && (
        <button type="button" onClick={onOpenTemplate} style={{
          width: '100%', marginBottom: 12, background: '#fff6da',
          border: '1.5px solid #FBC02D', color: '#B4880A', borderRadius: 10,
          fontWeight: 700, fontSize: 13, padding: '8px 14px', cursor: 'pointer',
          textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>&#128221;</span>
          {fr ? "Modèle de phrase" : "Sentence template"}
          <span style={{ fontSize: 11, fontWeight: 400, color: '#c8960a', marginLeft: 'auto' }}>
            {fr ? "Remplir le formulaire avec une phrase" : "Fill the form with a sentence"}
          </span>
        </button>
      )}

      {/* DESIGN MODE TABS */}
      <div style={tabBarStyle}>
        <button type="button" style={tabBtnStyle(designTab === "experimental")} onClick={() => { setDesignTab("experimental"); setVarType(null); }}>
          {fr ? "Design expérimental" : "Experimental design"}
        </button>
        <button type="button" style={tabBtnStyle(designTab === "variables")} onClick={() => { setDesignTab("variables"); }}>
          {fr ? "Variables & relations" : "Variables & relations"}
        </button>
      </div>

      {/* ── EXPERIMENTAL TAB ── */}
      {designTab === "experimental" && (
        <>
          <span style={{ fontWeight: 600, fontSize: 15, marginBottom: 10, color: "#2F344A" }}>
            {fr ? "Définir votre design" : "Define your design"}
          </span>

          {interFactors.map((factor, idx) => (
            <div key={`inter-${idx}`} style={{ marginBottom: 10 }}>
              <label style={labelStyle}>{fr ? `Facteur inter-sujets ${idx + 1}` : `Between-subject factor ${idx + 1}`}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <input type="text" value={factor.name}
                  onChange={e => { const copy = [...interFactors]; copy[idx].name = e.target.value; setInterFactors(copy); }}
                  style={{ ...inputStyle, backgroundColor: getFactorColor(factor, allFactors) }}
                />
                {canAdd && interFactors.length < 2 && idx === interFactors.length - 1 && (
                  <button type="button" onClick={() => setInterFactors([...interFactors, { name: '', levels: [] }])} style={addButtonStyle} title={fr ? "Ajouter un facteur inter-sujets" : "Add between-subject factor"}>+</button>
                )}
                {interFactors.length > 1 && (
                  <button type="button" onClick={() => setInterFactors(interFactors.filter((_, i) => i !== idx))} style={removeButtonStyle}>-</button>
                )}
              </div>
              <label style={labelStyle}>{fr ? "Groupes" : "Groups"}</label>
              <input type="text" value={factor.levelInput || ''} placeholder={fr ? "Ajouter un groupe" : "Add a group"}
                onChange={e => { const copy = [...interFactors]; copy[idx].levelInput = e.target.value; setInterFactors(copy); }}
                style={inputStyle}
              />
              <button type="button" onClick={() => {
                const copy = [...interFactors];
                if (copy[idx].levelInput && !copy[idx].levels?.includes(copy[idx].levelInput.trim())) {
                  copy[idx].levels = [...(copy[idx].levels || []), copy[idx].levelInput.trim()];
                  copy[idx].levelInput = ''; setInterFactors(copy);
                }
              }} style={addButtonStyle}>+</button>
              <div>{(factor.levels || []).map((lvl, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', background: '#f2f6ff', borderRadius: 9, padding: '4px 7px 4px 11px', fontSize: 14, margin: '0 6px 6px 0', fontWeight: 500, color: '#357' }}>
                  {lvl}
                  <button type="button" onClick={() => { const copy = [...interFactors]; copy[idx].levels = copy[idx].levels.filter((_, j) => j !== i); setInterFactors(copy); }} style={removeButtonStyle}>-</button>
                </span>
              ))}</div>
            </div>
          ))}

          {intraFactors.map((factor, idx) => (
            <div key={`intra-${idx}`} style={{ marginBottom: 10 }}>
              <label style={labelStyle}>{fr ? `Facteur intra-sujets ${idx + 1}` : `Within-subject factor ${idx + 1}`}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <input type="text" value={factor.name}
                  onChange={e => { const copy = [...intraFactors]; copy[idx].name = e.target.value; setIntraFactors(copy); }}
                  style={{ ...inputStyle, backgroundColor: getFactorColor(factor, allFactors) }}
                />
                {canAdd && intraFactors.length < 2 && idx === intraFactors.length - 1 && (
                  <button type="button" onClick={() => setIntraFactors([...intraFactors, { name: '', levels: [] }])} style={addButtonStyle}>+</button>
                )}
                {intraFactors.length > 1 && (
                  <button type="button" onClick={() => setIntraFactors(intraFactors.filter((_, i) => i !== idx))} style={removeButtonStyle}>-</button>
                )}
              </div>
              <label style={labelStyle}>{fr ? "Niveaux" : "Levels"}</label>
              <input type="text" value={factor.levelInput || ''} placeholder={fr ? "Ajouter un niveau" : "Add a level"}
                onChange={e => { const copy = [...intraFactors]; copy[idx].levelInput = e.target.value; setIntraFactors(copy); }}
                style={inputStyle}
              />
              <button type="button" onClick={() => {
                const copy = [...intraFactors];
                if (copy[idx].levelInput && !copy[idx].levels?.includes(copy[idx].levelInput.trim())) {
                  copy[idx].levels = [...(copy[idx].levels || []), copy[idx].levelInput.trim()];
                  copy[idx].levelInput = ''; setIntraFactors(copy);
                }
              }} style={addButtonStyle}>+</button>
              <div>{(factor.levels || []).map((lvl, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', background: '#fff7e0', borderRadius: 9, padding: '4px 7px 4px 11px', fontSize: 14, margin: '0 6px 6px 0', fontWeight: 500, color: '#b4880a' }}>
                  {lvl}
                  <button type="button" onClick={() => { const copy = [...intraFactors]; copy[idx].levels = copy[idx].levels.filter((_, j) => j !== i); setIntraFactors(copy); }} style={removeButtonStyle}>-</button>
                </span>
              ))}</div>
            </div>
          ))}

          {/* ── EXPECT MISSING CHECKBOX ────────────────────────────── */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            padding: "10px 12px", marginBottom: 10, borderRadius: 9,
            border: expectMissing ? "1.8px solid #F5A623" : "1.5px solid #e0e7ef",
            background: expectMissing ? "#fffbf2" : "#fafbfc",
            cursor: "pointer"
          }} onClick={() => setExpectMissing(!expectMissing)}>
            <input type="checkbox" checked={expectMissing}
              onChange={e => setExpectMissing(e.target.checked)}
              onClick={e => e.stopPropagation()}
              style={{ marginTop: 3, accentColor: "#F5A623", flexShrink: 0, width: 15, height: 15 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#2F344A" }}>
                {fr ? "Je prévois des données manquantes / participants perdus" : "I expect missing data / participant attrition"}
              </div>
              <div style={{ fontSize: 12, color: "#778", marginTop: 2 }}>
                {fr
                  ? "Certains participants ne termineront pas l'étude (abandon, données aberrantes…). Recommande le LMM qui gère les plans incomplets."
                  : "Some participants won't complete all measurements (dropout, outliers…). Recommends LMM which handles incomplete designs."}
              </div>
            </div>
          </div>

          <label style={labelStyle}>Alpha (&#945;)</label>
          <input type="text" value={alpha} onChange={e => setAlpha(e.target.value)} style={inputStyle} />
          <label style={labelStyle}>{fr ? "Puissance" : "Power"}</label>
          <input type="text" value={power} onChange={e => setPower(e.target.value)} style={inputStyle} />
          <label style={labelStyle}>{fr ? "Taille d'effet (f)" : "Effect size (f)"}</label>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input type="number" step="0.01" value={f} onChange={e => setF(e.target.value)} style={inputStyle} placeholder="ex. 0.25" />
            {showConversionInfo && (
              <div style={{ marginLeft: 10, background: "#fff6da", border: "1.5px solid #FBC02D", color: "#B4880A", fontWeight: 600, fontSize: 14, borderRadius: 10, padding: "6px 13px", boxShadow: "0 1px 8px #B4880A22" }}>
                {conversionInfo}
              </div>
            )}
          </div>
          <div style={{ fontSize: 12, color: "#779", margin: "2px 0 9px 3px" }}>
            {fr ? (
              <>
                <div><b>f</b> (ANOVA) : 0,10 = petit · 0,25 = moyen · 0,40 = grand</div>
                <div><b>d</b> (t-test) : 0,2 = petit · 0,5 = moyen · 0,8 = grand — conversion automatique</div>
              </>
            ) : (
              <>
                <div><b>f</b> (ANOVA): 0.10 = small, 0.25 = medium, 0.40 = large</div>
                <div><b>d</b> (t-test): 0.2 = small, 0.5 = medium, 0.8 = large — conversion automatic</div>
              </>
            )}
          </div>

          {selectedTest === "lmm" && (
            <div style={{ margin: "10px 0 10px 0", padding: "13px 13px 10px 13px", background: "#f6faff", borderRadius: 10, border: "1.3px solid #98d9ed" }}>
              {/* Structure des effets aléatoires */}
              <div style={{ fontWeight: 600, fontSize: 13, color: "#1a8fa8", marginBottom: 8 }}>
                {fr ? "Structure des effets aléatoires" : "Random effects structure"}
              </div>

              {[
                {
                  value: "intercept",
                  label: fr ? "Intercept aléatoire" : "Random intercept",
                  desc: fr
                    ? "Chaque participant a son propre niveau de base. Cas le plus courant."
                    : "Each participant has their own baseline level. Most common case.",
                  tip: fr
                    ? "Utilisez ce choix pour la majorité des designs. La variabilité entre participants est captée par l'intercept aléatoire."
                    : "Use this for most designs. Between-participant variability is captured by the random intercept."
                },
                {
                  value: "intercept_slope",
                  label: fr ? "Intercept + pente aléatoires" : "Random intercept + slope",
                  desc: fr
                    ? "Chaque participant a aussi sa propre évolution dans le temps / réponse au traitement. Études longitudinales."
                    : "Each participant also has their own growth/treatment response trajectory. Longitudinal studies.",
                  tip: fr
                    ? "Recommandé quand les participants peuvent réagir très différemment d'une mesure à l'autre (ex: apprentissage, récupération, effets de fatigue). Donne une puissance plus faible car le modèle estime plus d'incertitude."
                    : "Recommended when participants may respond very differently across measurements (e.g. learning, recovery, fatigue effects). Gives lower power because the model estimates more uncertainty."
                },
                {
                  value: "crossed",
                  label: fr ? "Effets croisés (participants × stimuli)" : "Crossed effects (participants × items)",
                  desc: fr
                    ? "Les stimuli/items sont aussi une source de variabilité aléatoire. Psychologie expérimentale, linguistique."
                    : "Stimuli/items are also a random source of variability. Experimental psychology, linguistics.",
                  tip: fr
                    ? "Utilisez ce choix quand chaque participant est exposé à plusieurs stimuli différents (mots, images, sons…) et que vous voulez généraliser à la fois aux participants ET aux stimuli (Baayen et al., 2008). Nécessite de spécifier le nombre de stimuli."
                    : "Use this when each participant is exposed to multiple stimuli (words, images, sounds…) and you want to generalize to both participants AND stimuli (Baayen et al., 2008). Requires specifying the number of stimuli."
                }
              ].map(opt => (
                <div key={opt.value}
                  onClick={() => setRandomStructure(opt.value)}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    padding: "9px 11px", marginBottom: 7, borderRadius: 9,
                    border: randomStructure === opt.value ? "1.8px solid #55D1E3" : "1.5px solid #e0e7ef",
                    background: randomStructure === opt.value ? "#f0fbfd" : "#fafbfc",
                    cursor: "pointer",
                  }}>
                  <input type="radio" name="randomStructure" value={opt.value}
                    checked={randomStructure === opt.value} onChange={() => setRandomStructure(opt.value)}
                    style={{ marginTop: 3, accentColor: "#55D1E3", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#2F344A" }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: "#778", marginTop: 2 }}>{opt.desc}</div>
                  </div>
                  <span title={opt.tip}
                    style={{ cursor: "help", color: "#55D1E3", fontSize: 11, fontWeight: 800,
                             borderRadius: "50%", border: "1.2px solid #55D1E3",
                             width: 15, height: 15, display: "flex", alignItems: "center",
                             justifyContent: "center", background: "#fff", flexShrink: 0, marginTop: 2 }}>
                    i
                  </span>
                </div>
              ))}

              {/* Paramètres selon la structure */}
              {randomStructure === "intercept_slope" && (
                <div style={{ padding: "8px 10px", background: "#f0fbfd", borderRadius: 8, marginBottom: 8, fontSize: 13 }}>
                  <label style={{ fontWeight: 500, display: "block", marginBottom: 4 }}>
                    {fr ? "Variabilité de la pente entre participants :" : "Between-participant slope variability:"}
                    <input type="number" step="0.1" min="0.05" max="3"
                      value={sdSlope} onChange={e => setSdSlope(e.target.value)}
                      style={{ ...inputStyle, width: 65, marginLeft: 8, fontSize: 13 }} />
                    <span style={{ fontSize: 11, color: "#8aabbc", marginLeft: 6 }}>
                      {fr ? "(défaut 0.3)" : "(default 0.3)"}
                    </span>
                  </label>
                </div>
              )}
              {randomStructure === "crossed" && (
                <div style={{ padding: "8px 10px", background: "#f0fbfd", borderRadius: 8, marginBottom: 8, fontSize: 13 }}>
                  <label style={{ fontWeight: 500, display: "block", marginBottom: 6 }}>
                    {fr ? "Nombre de stimuli/items :" : "Number of stimuli/items:"}
                    <input type="number" step="1" min="4" max="200"
                      value={nItems} onChange={e => setNItems(e.target.value)}
                      style={{ ...inputStyle, width: 65, marginLeft: 8, fontSize: 13 }} />
                  </label>
                  <label style={{ fontWeight: 500, display: "block" }}>
                    {fr ? "Variabilité entre stimuli :" : "Between-stimuli variability:"}
                    <input type="number" step="0.1" min="0.05" max="3"
                      value={sdItem} onChange={e => setSdItem(e.target.value)}
                      style={{ ...inputStyle, width: 65, marginLeft: 8, fontSize: 13 }} />
                    <span style={{ fontSize: 11, color: "#8aabbc", marginLeft: 6 }}>
                      {fr ? "(défaut 0.3)" : "(default 0.3)"}
                    </span>
                  </label>
                  <div style={{ fontSize: 11, color: "#7a9abc", marginTop: 6 }}>
                    {fr
                      ? "⚠ Estimation conservatrice : la variance items est incluse dans les résidus du modèle ajusté."
                      : "⚠ Conservative estimate: item variance is absorbed into residuals of the fitted model."}
                  </div>
                </div>
              )}

              {/* Simulations */}
              <label style={{ fontWeight: 500, fontSize: 13, display: "block", margin: "10px 0 4px" }}>
                {fr ? "Précision de simulation :" : "Simulation precision:"}&nbsp;
                <select value={formData.nSimulations || 50}
                  onChange={e => onUpdate({ ...formData, nSimulations: Number(e.target.value) })}
                  style={{ marginLeft: 4, padding: "3px 8px", borderRadius: 7, border: "1px solid #ddd", fontSize: 13 }}>
                  <option value={50}>{fr ? "rapide (50 simul.)" : "fast (50 simul.)"}</option>
                  <option value={200}>{fr ? "précis (200 simul.)" : "precise (200 simul.)"}</option>
                  <option value={500}>{fr ? "très précis (500 simul.)" : "very precise (500 simul.)"}</option>
                </select>
              </label>
              <div style={{ fontSize: 11, color: "#9aabbc", marginBottom: 8 }}>
                {fr ? "⚠ Plus de simulations = calcul plus long (200+ peut prendre 10–30 s)." : "⚠ More simulations = longer calculation (200+ may take 10–30 s)."}
              </div>

              {/* Mesures manquantes */}
              <label style={{ fontWeight: 500, fontSize: 13, display: "block", marginTop: 4, marginBottom: 4 }}>
                {fr ? "Mesures manquantes prévues :" : "Expected missing measurements:"}
                <span title={fr
                  ? "Le LMM peut analyser des données incomplètes (contrairement à l'ANOVA RM). Si vous prévoyez que certains participants manqueront des séances, indiquez ce pourcentage. La simulation supprimera aléatoirement cette proportion de mesures pour estimer la puissance réelle."
                  : "LMM can handle incomplete data (unlike RM ANOVA). If you expect some participants to miss sessions, enter that percentage. The simulation will randomly drop that proportion of measurements to estimate real-world power."}
                  style={{ cursor: "help", color: "#55D1E3", fontSize: 12, fontWeight: 800, borderRadius: "50%", border: "1.2px solid #55D1E3", width: 15, height: 15, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#fff", marginLeft: 6, flexShrink: 0, verticalAlign: "middle" }}>
                  i
                </span>
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <input type="range" min={0} max={50} step={5}
                  value={Math.round(missingRate * 100)}
                  onChange={e => setMissingRate(Number(e.target.value) / 100)}
                  style={{ flex: 1, accentColor: "#55D1E3" }} />
                <span style={{ fontWeight: 700, color: missingRate > 0.3 ? "#e67e22" : "#1a8fa8", minWidth: 36, fontSize: 14 }}>
                  {Math.round(missingRate * 100)}%
                </span>
              </div>
              {missingRate > 0 && (
                <div style={{ fontSize: 11, color: "#7a9abc", marginBottom: 4 }}>
                  {fr
                    ? `→ Le LMM utilisera les données partielles (${Math.round((1 - missingRate) * 100)}% des mesures disponibles) — avantage clé vs ANOVA RM.`
                    : `→ LMM will use partial data (${Math.round((1 - missingRate) * 100)}% of measurements available) — key advantage over RM ANOVA.`}
                </div>
              )}

              {/* Paramètres avancés (repliables) */}
              <button type="button" onClick={() => setLmmAdvanced(v => !v)}
                style={{ background: "none", border: "none", color: "#55D1E3", fontWeight: 600, fontSize: 12, cursor: "pointer", padding: "2px 0 6px", display: "flex", alignItems: "center", gap: 4 }}>
                {lmmAdvanced ? "▾" : "▸"} {fr ? "Paramètres avancés" : "Advanced parameters"}
              </button>
              {lmmAdvanced && (
                <div style={{ padding: "8px 10px", background: "#eef7fc", borderRadius: 8, marginBottom: 6 }}>
                  {/* SD intercept sujet */}
                  <label style={{ fontWeight: 500, fontSize: 13, display: "block", marginBottom: 6 }}>
                    {fr ? "SD intercept sujet :" : "Subject intercept SD:"}
                    <input type="number" step="0.1" min="0.1" max="5"
                      value={sdSubject}
                      onChange={e => setSdSubject(e.target.value)}
                      style={{ ...inputStyle, width: 70, marginLeft: 8, fontSize: 13 }} />
                    <span style={{ fontSize: 11, color: "#8aabbc", marginLeft: 6 }}>
                      {fr ? "(défaut 0.5 — variabilité inter-sujets)" : "(default 0.5 — between-subject variability)"}
                    </span>
                  </label>
                  {/* Méthode de test */}
                  <label style={{ fontWeight: 500, fontSize: 13, display: "block" }}>
                    {fr ? "Méthode de test :" : "Test method:"}
                    <select value={testMethod} onChange={e => setTestMethod(e.target.value)}
                      style={{ marginLeft: 8, padding: "3px 8px", borderRadius: 7, border: "1px solid #ddd", fontSize: 13 }}>
                      <option value="lrt">{fr ? "LRT — rapport de vraisemblance (recommandé)" : "LRT — likelihood ratio (recommended)"}</option>
                      <option value="wald">{fr ? "Wald z (rapide, moins précis à petit N)" : "Wald z (fast, less precise at small N)"}</option>
                    </select>
                  </label>
                </div>
              )}

              {/* Bouton lancement */}
              <div style={{ marginTop: 10, marginBottom: 2 }}>
                <button type="button"
                  style={{ background: isLoadingLmm ? "#E0E7EF" : "linear-gradient(90deg, #80e8fc 0%, #f4f6f8 100%)", color: "#276b7b", fontWeight: 700, fontSize: 15, padding: "10px 22px", border: "1.7px solid #55D1E3", borderRadius: 13, cursor: isLoadingLmm ? "not-allowed" : "pointer", boxShadow: "0 2px 10px #55d1e326", minWidth: 54 }}
                  onClick={() => { if (!isLoadingLmm && onLmmLaunch) onLmmLaunch(); }}
                  disabled={isLoadingLmm}
                >
                  {isLoadingLmm ? (fr ? "Calcul..." : "Calculating...") : (fr ? "Lancer le calcul LMM" : "Run LMM calculation")}
                </button>
              </div>
            </div>
          )}

          {/* ── COMPARAISONS MULTIPLES ───────────────────────────────────── */}
          {selectedTest && selectedTest !== "lmm" && (
            <div style={{ margin: "6px 0 4px 0", padding: "10px 13px", background: "#fffbf0", borderRadius: 10, border: "1.3px solid #f9d689" }}>
              <label style={{ fontWeight: 600, fontSize: 13, display: "block", marginBottom: 6, color: "#b4880a" }}>
                {fr ? "🔁 Comparaisons multiples" : "🔁 Multiple comparisons"}
                <span title={fr
                  ? "Si vous réalisez plusieurs tests statistiques sur les mêmes données, le risque de faux positifs augmente. Une correction ajuste le seuil α en conséquence. Ex : 5 comparaisons avec Bonferroni → α effectif = 0,05/5 = 0,01."
                  : "If you run multiple tests on the same data, the false-positive rate increases. A correction adjusts the effective α. E.g., 5 comparisons with Bonferroni → effective α = 0.05/5 = 0.01."}
                  style={{ cursor: "help", color: "#b4880a", fontSize: 12, fontWeight: 800, borderRadius: "50%", border: "1.2px solid #f9d689", width: 15, height: 15, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#fff", marginLeft: 6, verticalAlign: "middle" }}>
                  i
                </span>
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <label style={{ fontSize: 13, fontWeight: 500 }}>
                  {fr ? "Nombre de tests :" : "Number of tests:"}
                  <input type="number" min={1} max={100} value={nComparisons}
                    onChange={e => setNComparisons(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{ width: 60, marginLeft: 8, padding: "4px 7px", borderRadius: 6, border: "1px solid #f0c030", fontSize: 13 }} />
                </label>
                {nComparisons > 1 && (
                  <label style={{ fontSize: 13, fontWeight: 500 }}>
                    {fr ? "Correction :" : "Correction:"}
                    <select value={mcMethod} onChange={e => setMcMethod(e.target.value)}
                      style={{ marginLeft: 8, padding: "4px 8px", borderRadius: 6, border: "1px solid #f0c030", fontSize: 13 }}>
                      <option value="bonferroni">{fr ? "Bonferroni (conservateur)" : "Bonferroni (conservative)"}</option>
                      <option value="holm">{fr ? "Holm-Bonferroni (moins strict)" : "Holm–Bonferroni (less strict)"}</option>
                      <option value="none">{fr ? "Aucune correction" : "No correction"}</option>
                    </select>
                  </label>
                )}
              </div>
              {nComparisons > 1 && mcMethod !== "none" && (
                <div style={{ fontSize: 12, color: "#a07010", marginTop: 6 }}>
                  {fr
                    ? `→ α effectif utilisé pour le calcul : ${(parseFloat(alpha.replace(",",".")) / nComparisons).toFixed(4)} (α/${nComparisons})`
                    : `→ Effective α used for calculation: ${(parseFloat(alpha.replace(",",".")) / nComparisons).toFixed(4)} (α/${nComparisons})`}
                </div>
              )}
            </div>
          )}

          {/* ── CORR / EPSILON (anova_rm + anova_mixed) ─────────────────── */}
          {(selectedTest === "anova_rm" || selectedTest === "anova_mixed") && (
            <div style={{ margin: "10px 0 8px 0", padding: "13px 13px 10px 13px", background: "#f6faff", borderRadius: 10, border: "1.3px solid #98d9ed" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1a8fa8", marginBottom: 10 }}>
                {fr ? "⚙️ Paramètres de la structure intra-sujets" : "⚙️ Within-subjects structure parameters"}
              </div>

              {/* Corrélation */}
              <label style={{ fontWeight: 500, fontSize: 13, display: "block", marginBottom: 2 }}>
                {fr
                  ? "Corrélation entre mesures répétées"
                  : "Correlation between repeated measures"}
                <span title={fr
                  ? "À quel point les mesures d'un même sujet se ressemblent-elles ? 0 = pas de lien, 1 = identiques. La plupart des études utilisent 0.5 (défaut)."
                  : "How similar are measurements from the same subject? 0 = no link, 1 = identical. Most studies use 0.5 (default)."}
                  style={{ cursor: "help", color: "#55D1E3", fontSize: 12, fontWeight: 800, borderRadius: "50%", border: "1.2px solid #55D1E3", width: 15, height: 15, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#fff", marginLeft: 6, flexShrink: 0, verticalAlign: "middle" }}>
                  i
                </span>
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <input type="range" min="0.05" max="0.95" step="0.05"
                  value={corr}
                  onChange={e => setCorr(e.target.value)}
                  style={{ flex: 1, accentColor: "#55D1E3" }} />
                <span style={{ fontWeight: 700, color: "#1a8fa8", minWidth: 32, fontSize: 14 }}>{parseFloat(corr).toFixed(2)}</span>
              </div>
              <div style={{ fontSize: 11, color: "#9aabbc", marginBottom: 8 }}>
                {fr
                  ? "Faible ≈ 0.2 · Typique ≈ 0.5 · Forte ≈ 0.8"
                  : "Low ≈ 0.2 · Typical ≈ 0.5 · High ≈ 0.8"}
              </div>

              {/* Epsilon (sphéricité) */}
              <label style={{ fontWeight: 500, fontSize: 13, display: "block", marginBottom: 2 }}>
                {fr
                  ? "Sphéricité (ε, epsilon)"
                  : "Sphericity (ε, epsilon)"}
                <span title={fr
                  ? "Hypothèse de sphéricité : les variances des différences entre paires de mesures sont égales. ε = 1 = sphéricité parfaite. Si le test de Mauchly est significatif, réduire ε (Greenhouse-Geisser ≈ 0.75, Huynh-Feldt ≈ 0.85)."
                  : "Sphericity assumption: variances of differences between measurement pairs are equal. ε = 1 = perfect sphericity. If Mauchly's test is significant, reduce ε (Greenhouse-Geisser ≈ 0.75, Huynh-Feldt ≈ 0.85)."}
                  style={{ cursor: "help", color: "#55D1E3", fontSize: 12, fontWeight: 800, borderRadius: "50%", border: "1.2px solid #55D1E3", width: 15, height: 15, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#fff", marginLeft: 6, flexShrink: 0, verticalAlign: "middle" }}>
                  i
                </span>
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <input type="range" min="0.4" max="1.0" step="0.05"
                  value={epsilon}
                  onChange={e => setEpsilon(e.target.value)}
                  style={{ flex: 1, accentColor: "#55D1E3" }} />
                <span style={{ fontWeight: 700, color: parseFloat(epsilon) < 0.75 ? "#e67e22" : parseFloat(epsilon) < 1 ? "#f0a500" : "#27ae60", minWidth: 32, fontSize: 14 }}>
                  {parseFloat(epsilon).toFixed(2)}
                </span>
              </div>
              <div style={{ fontSize: 11, color: "#9aabbc" }}>
                {fr
                  ? "ε = 1.0 → sphéricité parfaite (défaut) · ε ≈ 0.75 → Greenhouse-Geisser · ε ≈ 0.85 → Huynh-Feldt"
                  : "ε = 1.0 → perfect sphericity (default) · ε ≈ 0.75 → Greenhouse-Geisser · ε ≈ 0.85 → Huynh-Feldt"}
              </div>
            </div>
          )}

          {selectedTest && selectedTest !== "lmm" && (
            <div style={{ margin: "14px 0 6px 0" }}>
              <button type="button"
                style={{ background: "linear-gradient(90deg, #80e8fc 0%, #f4f6f8 100%)", color: "#276b7b", fontWeight: 700, fontSize: 15, padding: "10px 24px", border: "1.7px solid #55D1E3", borderRadius: 13, cursor: "pointer", boxShadow: "0 2px 10px #55d1e326", width: "100%" }}
                onClick={() => onRun && onRun()}>
                {fr ? "Lancer l'analyse" : "Run analysis"}
              </button>
            </div>
          )}
        </>
      )}

      {/* ── VARIABLES & RELATIONS TAB ── */}
      {designTab === "variables" && (
        <>
          <span style={{ fontWeight: 600, fontSize: 15, marginBottom: 12, color: "#2F344A" }}>
            {fr ? "Que souhaitez-vous étudier ?" : "What do you want to study?"}
          </span>

          {[
            fr
              ? { key: "correlation", label: "Association entre deux variables", desc: "Y a-t-il un lien entre X et Y ?" }
              : { key: "correlation", label: "Association between two variables", desc: "Is there a link between X and Y?" },
            fr
              ? { key: "regression",  label: "Prédiction",                         desc: "Est-ce que X prédit Y ? (un ou plusieurs prédicteurs)" }
              : { key: "regression",  label: "Prediction",                          desc: "Does X predict Y? (one or more predictors)" },
            fr
              ? { key: "chi2",        label: "Distribution des fréquences",         desc: "Les catégories sont-elles distribuées comme attendu ?" }
              : { key: "chi2",        label: "Frequency distribution",              desc: "Are categories distributed as expected?" },
          ].map(({ key, label, desc }) => (
            <div key={key} style={radioOptionStyle(varType === key)} onClick={() => setVarType(key)}>
              <input type="radio" name="varType" value={key} checked={varType === key} onChange={() => setVarType(key)} style={{ marginTop: 3, accentColor: "#55D1E3" }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#2F344A" }}>{label}</div>
                <div style={{ fontSize: 12, color: "#778", marginTop: 2 }}>{desc}</div>
              </div>
            </div>
          ))}

          {varType && (
            <div style={{ marginTop: 10 }}>
              <label style={labelStyle}>Alpha (&#945;)</label>
              <input type="text" value={alpha} onChange={e => setAlpha(e.target.value)} style={inputStyle} />
              <label style={labelStyle}>{fr ? "Puissance" : "Power"}</label>
              <input type="text" value={power} onChange={e => setPower(e.target.value)} style={inputStyle} />

              {varType === "correlation" && (
                <>
                  <label style={labelStyle}>{fr ? "r attendu (Pearson)" : "Expected r (Pearson)"}</label>
                  <input type="number" step="0.01" min="0.01" max="0.99" value={r} onChange={e => setR(e.target.value)} style={inputStyle} />
                  <div style={{ fontSize: 12, color: "#779", margin: "2px 0 9px 3px" }}>
                    {fr ? "0,10 = petit · 0,30 = moyen · 0,50 = grand" : "0.10 = small · 0.30 = medium · 0.50 = large"}
                  </div>
                </>
              )}

              {varType === "regression" && (
                <>
                  <label style={labelStyle}>{fr ? "Taille d'effet f²" : "Effect size f²"}</label>
                  <input type="number" step="0.01" min="0.01" value={f2} onChange={e => setF2(e.target.value)} style={inputStyle} />
                  <div style={{ fontSize: 12, color: "#779", margin: "2px 0 9px 3px" }}>
                    {fr ? "0,02 = petit · 0,15 = moyen · 0,35 = grand" : "0.02 = small · 0.15 = medium · 0.35 = large"}
                  </div>
                  <label style={labelStyle}>{fr ? "Nombre de prédicteurs" : "Number of predictors"}</label>
                  <input type="number" step="1" min="1" value={nPredictors} onChange={e => setNPredictors(e.target.value)} style={inputStyle} />
                </>
              )}

              {varType === "chi2" && (
                <>
                  <label style={labelStyle}>{fr ? "Taille d'effet w (w de Cohen)" : "Effect size w (Cohen's w)"}</label>
                  <input type="number" step="0.01" min="0.01" value={f} onChange={e => setF(e.target.value)} style={inputStyle} />
                  <div style={{ fontSize: 12, color: "#779", margin: "2px 0 9px 3px" }}>
                    {fr ? "0,10 = petit · 0,30 = moyen · 0,50 = grand" : "0.10 = small · 0.30 = medium · 0.50 = large"}
                  </div>
                  <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 6 }}>
                    {fr ? "Degrés de liberté (dl)" : "Degrees of freedom (df)"}
                    <span
                      title={fr
                        ? "Ajustement (1 variable, k catégories) : dl = k-1. Table de contingence (r lignes × c colonnes) : dl = (r-1) × (c-1). Ex : table 2×3 → dl = 2."
                        : "Goodness-of-fit (1 variable, k categories): df = k-1. Contingency table (r rows × c cols): df = (r-1) × (c-1). Example: 2×3 table → df = 2."}
                      style={{ cursor: "help", color: "#55D1E3", fontSize: 13, fontWeight: 800, borderRadius: "50%", border: "1.2px solid #55D1E3", width: 17, height: 17, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#fff", flexShrink: 0 }}>
                      i
                    </span>
                  </label>
                  <input type="number" step="1" min="1" value={chi2Df} onChange={e => setChi2Df(e.target.value)} style={inputStyle} />
                  <div style={{ fontSize: 12, color: "#779", margin: "2px 0 9px 3px" }}>
                    {fr ? "1 variable k catégories : dl = k-1 · table r×c : dl = (r-1)×(c-1)" : "1 variable k categories: df = k-1 · table r×c: df = (r-1)×(c-1)"}
                  </div>
                </>
              )}

              <div style={{ margin: "14px 0 6px 0" }}>
                <button type="button"
                  style={{ background: "linear-gradient(90deg, #80e8fc 0%, #f4f6f8 100%)", color: "#276b7b", fontWeight: 700, fontSize: 15, padding: "10px 24px", border: "1.7px solid #55D1E3", borderRadius: 13, cursor: "pointer", boxShadow: "0 2px 10px #55d1e326", width: "100%" }}
                  onClick={() => onRun && onRun()}>
                  {fr ? "Lancer l'analyse" : "Run analysis"}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* MDE — shown in both tabs */}
      <div style={{ margin: '20px 0 2px 0', background: '#f8fafc', padding: '12px 13px 7px 13px', borderRadius: 13, border: '1.5px solid #E7ECF2', boxShadow: '0 2px 9px #d1eaff18' }}>
        <label style={{ display: 'flex', alignItems: 'center', fontWeight: 500, fontSize: 14, marginBottom: 5 }}>
          <input type="checkbox" checked={hasSample} onChange={e => setHasSample(e.target.checked)} style={{ marginRight: 7 }} />
          {fr ? "J'ai déjà une taille d'échantillon" : "I already have a sample size"}
        </label>
        {hasSample && (
          <div style={{ marginTop: 4 }}>
            <label style={{ fontSize: 13 }}>
              {fr ? "N par groupe" : "N per group"}
              <input type="number" min={1} value={nGiven} onChange={e => setNGiven(e.target.value)}
                style={{ ...inputStyle, width: 90, marginLeft: 8 }} />
            </label>
            {mde && (
              <div style={{ background: "#e7f8ed", border: "1.5px solid #45b688", color: "#216747", marginTop: 10, fontWeight: 600, fontSize: 15, borderRadius: 9, padding: "8px 13px", textAlign: "center" }}>
                {fr ? "Effet minimum détectable :" : "Min. detectable effect:"} <b>{effetLabel} = {mde}</b>
                {showWarning && (
                  <div style={{ color: "#a64e1c", background: "#fff0e6", borderRadius: 7, fontWeight: 600, fontSize: 13, marginTop: 8, padding: "5px 10px", border: "1.2px solid #f9b79b" }}>
                    {fr ? "Attention : cette taille d'échantillon ne détecte que les effets larges." : "Warning: this sample size only detects large effects."}
                  </div>
                )}
              </div>
            )}
            {mdeError && <div style={{ background: "#fff2e6", border: "1.5px solid #e18d53", color: "#a14b16", marginTop: 10, fontWeight: 600, fontSize: 14, borderRadius: 9, padding: "8px 13px", textAlign: "center" }}>{mdeError}</div>}
          </div>
        )}
      </div>
    </form>
  );
}

export default AnovaForm;
