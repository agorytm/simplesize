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
    if (formData.interFactors) setInterFactors(formData.interFactors);
    if (formData.intraFactors) setIntraFactors(formData.intraFactors);
  }, [formData]);

  useEffect(() => {
    onUpdate({
      ...formData, interFactors, intraFactors, alpha, power, f, r,
      chi2_df: chi2Df, n_predictors: nPredictors, f2, randomFactor,
      nSimulations: formData.nSimulations || 50,
    });
  }, [interFactors, intraFactors, alpha, power, f, r, chi2Df, nPredictors, f2, randomFactor, formData.nSimulations]);

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
      interFactors, intraFactors, selected_test: selectedTest, mde_mode: true, n_given: Number(nGiven)
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
        <button type="button" style={tabBtnStyle(designTab === "experimental")} onClick={() => setDesignTab("experimental")}>
          {fr ? "Design expérimental" : "Experimental design"}
        </button>
        <button type="button" style={tabBtnStyle(designTab === "variables")} onClick={() => setDesignTab("variables")}>
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
            <label style={{ fontWeight: 500, fontSize: 14, marginBottom: 6 }}>
              {fr ? "Simulations :" : "Simulations:"}&nbsp;
              <select value={formData.nSimulations || 50}
                onChange={e => onUpdate({ ...formData, nSimulations: Number(e.target.value) })}
                style={{ marginLeft: 7, padding: "4px 10px", borderRadius: 7, border: "1px solid #ddd", fontSize: 14 }}>
                <option value={50}>{fr ? "rapide (50)" : "fast (50)"}</option>
                <option value={200}>{fr ? "précis (200)" : "precise (200)"}</option>
                <option value={500}>{fr ? "très précis (500)" : "very precise (500)"}</option>
              </select>
            </label>
          )}

          {selectedTest === "lmm" && (
            <div style={{ margin: "10px 0 10px 0", padding: "13px 13px 6px 13px", background: "#f6faff", borderRadius: 10, border: "1.3px solid #98d9ed" }}>
              <label style={{ ...labelStyle, fontWeight: 600, color: "#209" }}>
                {fr ? "Facteur aléatoire (ex : participant)" : "Random factor (e.g., participant)"}
              </label>
              <input type="text" value={randomFactor} onChange={e => setRandomFactor(e.target.value)}
                style={{ ...inputStyle, width: 140 }} placeholder={fr ? "participant" : "participant"} />
              <div style={{ marginTop: 13, marginBottom: 2 }}>
                <button type="button"
                  style={{ background: isLoadingLmm ? "#E0E7EF" : "linear-gradient(90deg, #80e8fc 0%, #f4f6f8 100%)", color: "#276b7b", fontWeight: 700, fontSize: 15, padding: "10px 22px", border: "1.7px solid #55D1E3", borderRadius: 13, cursor: isLoadingLmm ? "not-allowed" : "pointer", boxShadow: "0 2px 10px #55d1e326", minWidth: 54 }}
                  onClick={() => { if (!isLoadingLmm && onLmmLaunch) onLmmLaunch(); }}
                  disabled={isLoadingLmm || !randomFactor.trim()}
                >
                  {isLoadingLmm ? (fr ? "Calcul..." : "Calculating...") : (fr ? "Lancer le calcul LMM" : "Run LMM calculation")}
                </button>
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
