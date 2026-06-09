import React, { useState } from "react";
import { useTranslation } from 'react-i18next';

function PlanSentenceFiller({ formData = {}, onApply, onCancel }) {
  const { i18n } = useTranslation();
  const fr = i18n.language === 'fr';

  const [studyType, setStudyType] = useState("experimental");

  const [nGroups, setNGroups] = useState(formData.interFactors?.[0]?.levels?.length || 2);
  const [groupNames, setGroupNames] = useState(
    formData.interFactors?.[0]?.levels?.length
      ? formData.interFactors[0].levels
      : fr ? ["Contrôle", "Intervention"] : ["Control", "Intervention"]
  );
  const [variable, setVariable] = useState(formData.intraFactors?.[0]?.name || (fr ? "performance" : "performance"));
  const [nConditions, setNConditions] = useState(formData.intraFactors?.[0]?.levels?.length || 1);
  const [conditionNames, setConditionNames] = useState(
    formData.intraFactors?.[0]?.levels?.length
      ? formData.intraFactors[0].levels
      : fr ? ["Avant", "Après"] : ["Before", "After"]
  );
  const [hasThirdFactor, setHasThirdFactor] = useState(false);
  const [thirdFactorType, setThirdFactorType] = useState("inter");
  const [nThirdLevels, setNThirdLevels] = useState(2);
  const [thirdFactorNames, setThirdFactorNames] = useState(
    fr ? ["Facteur 3a", "Facteur 3b"] : ["Factor 3a", "Factor 3b"]
  );
  const [comparison, setComparison] = useState("interaction");
  const [power, setPower] = useState(formData.power ? Number(formData.power) * 100 : 90);
  const [effectSize, setEffectSize] = useState("medium");

  const [bivariate_goal, setBivariateGoal] = useState("correlation");
  const [var1, setVar1] = useState("X");
  const [var2, setVar2] = useState("Y");
  const [nPredictors, setNPredictors] = useState(1);
  const [predictorNames, setPredictorNames] = useState(["X1"]);
  const [outcomeVar, setOutcomeVar] = useState("Y");
  const [tableRows, setTableRows] = useState(2);
  const [tableCols, setTableCols] = useState(2);
  const [powerBiv, setPowerBiv] = useState(80);
  const [effectSizeBiv, setEffectSizeBiv] = useState("medium");

  const handleNGroupsChange = (val) => {
    setNGroups(val);
    setGroupNames(prev => {
      const base = [...prev, ...Array(val).fill("")].slice(0, val);
      return base.map((n, i) => n || (fr ? `Groupe ${i + 1}` : `Group ${i + 1}`));
    });
  };
  const handleNConditionsChange = (val) => {
    setNConditions(val);
    setConditionNames(prev => {
      const base = [...prev, ...Array(val).fill("")].slice(0, val);
      return base.map((n, i) => n || (fr ? `Condition ${i + 1}` : `Condition ${i + 1}`));
    });
  };
  const handleNThirdLevelsChange = (val) => {
    setNThirdLevels(val);
    setThirdFactorNames(prev => {
      const base = [...prev, ...Array(val).fill("")].slice(0, val);
      return base.map((n, i) => n || (fr ? `Niveau ${i + 1}` : `Level ${i + 1}`));
    });
  };
  const handleNPredictorsChange = (val) => {
    setNPredictors(val);
    setPredictorNames(prev => {
      const base = [...prev, ...Array(val).fill("")].slice(0, val);
      return base.map((n, i) => n || `X${i + 1}`);
    });
  };

  const comparisonOptions = fr ? [
    ...(nGroups > 1 ? [{ value: "groups", label: "la différence de scores entre les groupes" }] : []),
    ...(nConditions > 1 ? [{ value: "conditions", label: "la différence entre les conditions" }] : []),
    ...(nGroups > 1 && nConditions > 1 ? [{ value: "interaction", label: "l'interaction entre groupe et conditions" }] : []),
    ...(hasThirdFactor && nGroups > 1 && nConditions > 1 && nThirdLevels > 1
      ? [{ value: "3factors", label: "l'interaction entre les 3 facteurs" }] : [])
  ] : [
    ...(nGroups > 1 ? [{ value: "groups", label: "the difference in scores between groups" }] : []),
    ...(nConditions > 1 ? [{ value: "conditions", label: "the difference between conditions" }] : []),
    ...(nGroups > 1 && nConditions > 1 ? [{ value: "interaction", label: "the interaction between group and conditions" }] : []),
    ...(hasThirdFactor && nGroups > 1 && nConditions > 1 && nThirdLevels > 1
      ? [{ value: "3factors", label: "the interaction between the 3 factors" }] : [])
  ];

  const handleAutoFillExperimental = () => {
    const interFactors = nGroups > 1 ? [{ name: fr ? "groupe" : "group", levels: groupNames }] : [];
    const intraFactors = nConditions > 1 ? [{ name: variable, levels: conditionNames }] : [];
    if (hasThirdFactor) {
      const third = { name: fr ? "Facteur 3" : "Factor 3", levels: thirdFactorNames };
      if (thirdFactorType === "inter") interFactors.push(third);
      else intraFactors.push(third);
    }
    onApply({
      ...formData, interFactors, intraFactors,
      alpha: formData.alpha || "0.05",
      power: (power / 100).toString(),
      f: effectSize === "small" ? "0.10" : effectSize === "medium" ? "0.25" : "0.40",
      randomFactor: formData.randomFactor || "",
      _fromTemplate: true,
    });
  };

  const handleAutoFillBivariate = () => {
    const pwr = (powerBiv / 100).toString();
    const rMap = { small: "0.10", medium: "0.30", large: "0.50" };
    const f2Map = { small: "0.02", medium: "0.15", large: "0.35" };
    const wMap = { small: "0.10", medium: "0.30", large: "0.50" };
    if (bivariate_goal === "correlation") {
      onApply({ ...formData, interFactors: [], intraFactors: [], alpha: formData.alpha || "0.05", power: pwr, r: rMap[effectSizeBiv], f: "0.25", _fromTemplate: true, _testType: "correlation" });
    } else if (bivariate_goal === "prediction") {
      onApply({ ...formData, interFactors: [], intraFactors: [], alpha: formData.alpha || "0.05", power: pwr, f2: f2Map[effectSizeBiv], n_predictors: String(nPredictors), f: "0.25", _fromTemplate: true, _testType: "regression" });
    } else if (bivariate_goal === "distribution") {
      const df = String((tableRows - 1) * (tableCols - 1) || 1);
      onApply({ ...formData, interFactors: [], intraFactors: [], alpha: formData.alpha || "0.05", power: pwr, f: wMap[effectSizeBiv], chi2_df: df, _fromTemplate: true, _testType: "chi2" });
    }
  };

  const tabStyle = (active) => ({
    padding: "8px 20px", borderRadius: 10,
    border: active ? "2px solid #55D1E3" : "1.5px solid #E0E7EF",
    background: active ? "linear-gradient(90deg, #e6faff 0%, #f4f6f8 100%)" : "#fff",
    color: active ? "#2F344A" : "#B0B8D4", fontWeight: 600, fontSize: 14, cursor: "pointer", marginRight: 10,
  });

  const effSmall = fr ? "petit" : "small";
  const effMedium = fr ? "moyen" : "medium";
  const effLarge = fr ? "grand" : "large";

  return (
    <div style={{ background: "#fff", borderRadius: 17, padding: "28px 34px 22px 34px", minWidth: 500, maxWidth: 600, boxShadow: "0 2px 32px #2f344a28", fontSize: 15 }}>
      <div style={{ marginBottom: 18, fontWeight: 700, fontSize: 19 }}>
        {fr ? "Construire votre design" : "Build your study design"}
      </div>

      {/* Mode tabs */}
      <div style={{ marginBottom: 20 }}>
        <button type="button" style={tabStyle(studyType === "experimental")} onClick={() => setStudyType("experimental")}>
          {fr ? "Design expérimental" : "Experimental design"}
        </button>
        <button type="button" style={tabStyle(studyType === "bivariate")} onClick={() => setStudyType("bivariate")}>
          {fr ? "Variables & relations" : "Variables & relationships"}
        </button>
      </div>

      {/* ─── EXPERIMENTAL DESIGN ─── */}
      {studyType === "experimental" && (
        <div>
          <span>{fr ? "Mes participants sont divisés en " : "My participants are divided into "}</span>
          <select value={nGroups} onChange={e => handleNGroupsChange(Number(e.target.value))}>
            {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <span>&nbsp;{fr ? "groupes (" : "groups ("}</span>
          {groupNames.map((name, idx) => (
            <input key={idx} value={name} onChange={e => { const a=[...groupNames];a[idx]=e.target.value;setGroupNames(a); }}
              style={{ width: 80, margin: "0 4px" }} placeholder={fr ? `Groupe ${idx+1}` : `Group ${idx+1}`} />
          ))}
          <span>),<br /><br /></span>
          <span>{fr ? "dans chaque groupe je mesure " : "in each group I measure "}</span>
          <input value={variable} onChange={e => setVariable(e.target.value)} style={{ width: 110, margin: "0 5px" }} />
          <span>&nbsp;{fr ? "avec " : "with "}</span>
          <select value={nConditions} onChange={e => handleNConditionsChange(Number(e.target.value))}>
            {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <span>&nbsp;{fr ? `condition${nConditions > 1 ? "s" : ""}` : `condition${nConditions > 1 ? "s" : ""}`}</span>
          {nConditions > 1 && (<span>&nbsp;(
            {conditionNames.map((name, idx) => (
              <input key={idx} value={name} onChange={e => { const a=[...conditionNames];a[idx]=e.target.value;setConditionNames(a); }}
                style={{ width: 80, margin: "0 4px" }} />
            ))})</span>)}
          <span>,</span>
          <div style={{ margin: "12px 0" }}>
            <label>
              <input type="checkbox" checked={hasThirdFactor} onChange={e => setHasThirdFactor(e.target.checked)} style={{ marginRight: 7 }} />
              {fr ? "J'ai un troisième facteur " : "I have a third factor "}
            </label>
            {hasThirdFactor && (
              <span>
                <select value={thirdFactorType} onChange={e => setThirdFactorType(e.target.value)} style={{ marginRight: 7 }}>
                  <option value="inter">{fr ? "inter-sujets" : "between-subjects"}</option>
                  <option value="intra">{fr ? "intra-sujets" : "within-subjects"}</option>
                </select>
                {fr ? "avec " : "with "}
                <select value={nThirdLevels} onChange={e => handleNThirdLevelsChange(Number(e.target.value))}>
                  {[2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                &nbsp;{fr ? "niveaux (" : "levels ("}
                {thirdFactorNames.map((name, idx) => (
                  <input key={idx} value={name} onChange={e => { const a=[...thirdFactorNames];a[idx]=e.target.value;setThirdFactorNames(a); }}
                    style={{ width: 80, margin: "0 4px" }} />
                ))})
              </span>
            )}
          </div>
          <span>{fr ? "Je veux comparer " : "I want to compare "}</span>
          <select value={comparison} onChange={e => setComparison(e.target.value)}>
            {comparisonOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <span>,<br />{fr ? "avec " : "with "}</span>
          <select value={power} onChange={e => setPower(Number(e.target.value))}>
            {[80,90,95].map(p => <option key={p} value={p}>{p}%</option>)}
          </select>
          <span>&nbsp;{fr ? "de puissance pour détecter un effet " : "power to detect a "}</span>
          <select value={effectSize} onChange={e => setEffectSize(e.target.value)}>
            <option value="small">{effSmall}</option>
            <option value="medium">{effMedium}</option>
            <option value="large">{effLarge}</option>
          </select>
          {!fr && <span>&nbsp;effect.</span>}
          {fr && <span>.</span>}

          <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
            <button type="button" style={{ background: "#55D1E3", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 16, padding: "10px 24px", cursor: "pointer" }} onClick={handleAutoFillExperimental}>
              {fr ? "Remplir automatiquement" : "Auto-fill parameters"}
            </button>
            <button type="button" style={{ background: "#eee", color: "#2F344A", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 16, padding: "10px 24px", cursor: "pointer" }} onClick={onCancel}>
              {fr ? "Annuler" : "Cancel"}
            </button>
          </div>
        </div>
      )}

      {/* ─── VARIABLES & RELATIONSHIPS ─── */}
      {studyType === "bivariate" && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 600, marginRight: 12 }}>
              {fr ? "Que souhaitez-vous faire ?" : "What do you want to do?"}
            </label>
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>

              <label style={{ cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 10px", borderRadius: 8, border: bivariate_goal === "correlation" ? "1.5px solid #55D1E3" : "1.5px solid #eee", background: bivariate_goal === "correlation" ? "#f0fbfd" : "#fff", marginBottom: 4 }}>
                <input type="radio" value="correlation" checked={bivariate_goal === "correlation"} onChange={() => setBivariateGoal("correlation")} style={{ marginTop: 3 }} />
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {fr ? "Deux mesures numériques — sont-elles liées ?" : "Two numerical measurements — are they related?"}
                  </div>
                  <div style={{ color: "#778", fontSize: 13, marginTop: 2 }}>
                    {fr ? "ex. Un score élevé en " : "e.g. Does a higher score in "}
                    <input value={var1} onChange={e => setVar1(e.target.value)} style={{ width: 65, margin: "0 3px", fontSize: 13 }} />
                    {fr ? " va-t-il de pair avec un score élevé en " : " go along with a higher score in "}
                    <input value={var2} onChange={e => setVar2(e.target.value)} style={{ width: 65, margin: "0 3px", fontSize: 13 }} />
                    {fr ? " ?" : "?"}
                  </div>
                </div>
              </label>

              <label style={{ cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 10px", borderRadius: 8, border: bivariate_goal === "prediction" ? "1.5px solid #55D1E3" : "1.5px solid #eee", background: bivariate_goal === "prediction" ? "#f0fbfd" : "#fff", marginBottom: 4 }}>
                <input type="radio" value="prediction" checked={bivariate_goal === "prediction"} onChange={() => setBivariateGoal("prediction")} style={{ marginTop: 3 }} />
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {fr ? "Prédire un score à partir d'autres variables" : "Predict a score from other variables"}
                  </div>
                  <div style={{ color: "#778", fontSize: 13, marginTop: 2 }}>
                    {fr ? "ex. Puis-je prédire " : "e.g. Can I predict "}
                    <input value={outcomeVar} onChange={e => setOutcomeVar(e.target.value)} style={{ width: 65, margin: "0 3px", fontSize: 13 }} />
                    {fr ? " à partir de " : " from "}
                    <select value={nPredictors} onChange={e => handleNPredictorsChange(Number(e.target.value))} style={{ marginRight: 4, fontSize: 13 }}>
                      {[1,2,3,4,5,6,8,10].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    {fr ? `variable${nPredictors > 1 ? "s" : ""} (` : `variable${nPredictors > 1 ? "s" : ""} (`}
                    {predictorNames.map((name, idx) => (
                      <input key={idx} value={name} onChange={e => { const a=[...predictorNames];a[idx]=e.target.value;setPredictorNames(a); }}
                        style={{ width: 45, margin: "0 3px", fontSize: 13 }} />
                    ))}) ?
                  </div>
                </div>
              </label>

              <label style={{ cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 10px", borderRadius: 8, border: bivariate_goal === "distribution" ? "1.5px solid #55D1E3" : "1.5px solid #eee", background: bivariate_goal === "distribution" ? "#f0fbfd" : "#fff", marginBottom: 4 }}>
                <input type="radio" value="distribution" checked={bivariate_goal === "distribution"} onChange={() => setBivariateGoal("distribution")} style={{ marginTop: 3 }} />
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {fr ? "Comparer des pourcentages ou proportions entre groupes" : "Compare percentages or proportions between groups"}
                  </div>
                  <div style={{ color: "#778", fontSize: 13, marginTop: 2 }}>
                    {fr ? "ex. Y a-t-il une différence entre " : "e.g. Is there a difference between "}
                    <select value={tableRows} onChange={e => setTableRows(Number(e.target.value))} style={{ fontSize: 13 }}>
                      {[2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    {fr ? " groupes dans leur répartition sur " : " groups in how they distribute across "}
                    <select value={tableCols} onChange={e => setTableCols(Number(e.target.value))} style={{ fontSize: 13 }}>
                      {[2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    {fr ? " catégories ? (ex. hommes vs femmes choisissant A, B ou C)" : " categories? (e.g. men vs women choosing A, B or C)"}
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <span>{fr ? "J'attends un effet " : "I expect a "}</span>
            <select value={effectSizeBiv} onChange={e => setEffectSizeBiv(e.target.value)}>
              <option value="small">{effSmall}</option>
              <option value="medium">{effMedium}</option>
              <option value="large">{effLarge}</option>
            </select>
            <span>{fr ? ", avec " : ", with "}</span>
            <select value={powerBiv} onChange={e => setPowerBiv(Number(e.target.value))}>
              {[80,90,95].map(p => <option key={p} value={p}>{p}%</option>)}
            </select>
            <span>&nbsp;{fr ? "de puissance." : "power."}</span>
          </div>

          <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
            <button type="button" style={{ background: "#55D1E3", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 16, padding: "10px 24px", cursor: "pointer" }} onClick={handleAutoFillBivariate}>
              {fr ? "Remplir automatiquement" : "Auto-fill parameters"}
            </button>
            <button type="button" style={{ background: "#eee", color: "#2F344A", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 16, padding: "10px 24px", cursor: "pointer" }} onClick={onCancel}>
              {fr ? "Annuler" : "Cancel"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlanSentenceFiller;
