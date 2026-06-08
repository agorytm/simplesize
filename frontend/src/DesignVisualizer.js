import React from 'react';

// Utility for all combinations
function getAllCombinations(arrays) {
  if (!arrays.length) return [[]];
  const rest = getAllCombinations(arrays.slice(1));
  return arrays[0].flatMap(item => rest.map(comb => [item, ...comb]));
}

function getTestLabel(selectedTest) {
  switch (selectedTest) {
    case "ttest": return "Independent t-test";
    case "anova": return "Between-subjects ANOVA";
    case "anova_rm": return "Repeated measures ANOVA";
    case "anova_mixed": return "Mixed ANOVA";
    case "lmm": return "Linear Mixed Model (LMM)";
    default: return "";
  }
}

function DesignVisualizer({
  groupFactors = [],
  levelFactors = [],
  nPerGroup,
  nTotal,
  selectedTest,
  testTitle,
  plan,
  formData = {},
  result = null
}) {
  // Clean factors (non-empty name AND at least 2 levels)
  const cleanedInter = groupFactors.filter(f => (f.name && (f.levels?.length || 0) >= 2));
  const cleanedIntra = levelFactors.filter(f => (f.name && (f.levels?.length || 0) >= 2));

  // Plan notation
  const interStr = cleanedInter.map(f => {
    const label = f.name.charAt(0).toUpperCase();
    const n = f.levels.length;
    return `${label}${n}`;
  }).join("*");

  const intraStr = cleanedIntra.map(f => {
    const label = f.name.charAt(0).toUpperCase();
    const n = f.levels.length;
    return `${label}${n}`;
  }).join("*");

  const S = (nPerGroup && !isNaN(Number(nPerGroup))) ? nPerGroup : "N";

  const nGroups = cleanedInter.length
    ? cleanedInter.reduce((prod, f) => prod * f.levels.length, 1)
    : 1;

  let totalN;
  if (selectedTest === "anova_rm") {
    totalN = parseInt(nPerGroup) > 0 ? parseInt(nPerGroup) : (nTotal || "—");
  } else {
    totalN = (parseInt(nPerGroup) > 0 && nGroups > 0) ? parseInt(nPerGroup) * nGroups : (nTotal || "—");
  }

  // Plan notation
  let planNotation = `S${S}`;
  if (cleanedInter.length && !cleanedIntra.length) {
    planNotation += `<${interStr}>`;
  } else if (!cleanedInter.length && cleanedIntra.length) {
    planNotation += `*${intraStr}`;
  } else if (cleanedInter.length && cleanedIntra.length) {
    planNotation += `<${interStr}>*${intraStr}`;
  }

  const legend = [
    "S = subjects",
    ...cleanedInter.map(f => `${f.name.charAt(0).toUpperCase()} = ${f.name}`),
    ...cleanedIntra.map(f => `${f.name.charAt(0).toUpperCase()} = ${f.name}`)
  ].join(", ");

  const alphaDisplay = (formData.alpha || "—").toString();
  const powerDisplay = (formData.power || "—").toString();
  const fDisplay = (formData.f || "—").toString();
  const testType = getTestLabel(selectedTest);

  const interFactorColors = ["#4fc6e1", "#e99db9"];
  const intraFactorColors = ["#f9b448", "#e99db9"];

  function getFactorColor(factor, idx, type) {
    if (factor && factor.levels && factor.levels.length >= 2) {
      if (type === 'inter') return interFactorColors[idx % interFactorColors.length];
      else if (type === 'intra') return intraFactorColors[idx % intraFactorColors.length];
    }
    return "#ccc";
  }

  const interLevelsArrays = groupFactors.map(f => (f.levels && f.levels.length ? f.levels : []));
  const allInterCombs = getAllCombinations(interLevelsArrays);

  const intraLevelsArrays = levelFactors.map(f => (f.levels && f.levels.length ? f.levels : []));
  const allIntraCombs = getAllCombinations(intraLevelsArrays);
  const hasIntraModalities = levelFactors.some(f => (f.levels && f.levels.length > 0));

  function diagonalGradient(color1, color2) {
    return `linear-gradient(135deg, ${color1} 50%, ${color2} 50%)`;
  }

  function getInterBackground(interComb) {
    if (cleanedInter.length === 1) return getFactorColor(cleanedInter[0], 0, 'inter');
    if (cleanedInter.length === 2) {
      const c1 = getFactorColor(cleanedInter[0], 0, 'inter');
      const c2 = getFactorColor(cleanedInter[1], 1, 'inter');
      return diagonalGradient(c1, c2);
    }
    return "#eee";
  }

  const nPerGroupSafe = nPerGroup && !isNaN(Number(nPerGroup)) ? nPerGroup : (selectedTest === "anova_rm" ? "N" : "-");

  const intraColors = cleanedIntra.map((f, idx) => getFactorColor(f, idx, 'intra'));

  let anovaRmBlock = null;

  if (selectedTest === "anova_rm" && cleanedInter.length === 0 && cleanedIntra.length >= 1) {
    if (cleanedIntra.length === 1) {
      const color = getFactorColor(cleanedIntra[0], 0, 'intra');
      anovaRmBlock = (
        <div style={{
          border: '2.5px solid #ccc',
          background: "#eee",
          borderRadius: 22,
          minWidth: 125,
          padding: 18,
          textAlign: 'center',
          color: '#222',
          fontFamily: "'Nunito', Arial, sans-serif",
          fontWeight: 600,
          boxShadow: '0 1px 8px #55D1E325',
          marginBottom: 18,
          flex: '0 1 auto'
        }}>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 10 }}>
            Single group
          </div>
          <div style={{ marginBottom: 10, fontSize: 13, fontStyle: "italic" }}>
            n = {nPerGroupSafe}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
            {cleanedIntra[0].levels.map((lvl, i) => (
              <div key={i} style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                border: `2.5px solid ${color}`,
                background: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                color: '#fff',
                fontWeight: 600,
                marginBottom: 4,
                userSelect: 'none'
              }}>
                {lvl}
              </div>
            ))}
          </div>
        </div>
      );
    } else if (cleanedIntra.length === 2) {
      const allIntraCombs = getAllCombinations(cleanedIntra.map(f => f.levels));
      anovaRmBlock = (
        <>
          <div style={{
            border: '2.5px solid #ccc',
            background: "#eee",
            borderRadius: 22,
            minWidth: 180,
            padding: 18,
            textAlign: 'center',
            color: '#222',
            fontFamily: "'Nunito', Arial, sans-serif",
            fontWeight: 600,
            boxShadow: '0 1px 8px #55D1E325',
            marginBottom: 6,
            flex: '0 1 auto'
          }}>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 10 }}>
              Single group
            </div>
            <div style={{ marginBottom: 10, fontSize: 13, fontStyle: "italic" }}>
              n = {nPerGroupSafe}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
              {allIntraCombs.map((intraComb, i) => {
                const color1 = getFactorColor(cleanedIntra[0], 0, 'intra');
                const color2 = getFactorColor(cleanedIntra[1], 1, 'intra');
                const bgGradient = `linear-gradient(135deg, ${color1} 50%, ${color2} 50%)`;
                return (
                  <div key={i} style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    border: `2.5px solid #ccc`,
                    backgroundImage: bgGradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    color: '#fff',
                    fontWeight: 600,
                    marginBottom: 4,
                    userSelect: 'none'
                  }}>
                    {intraComb.join(' × ')}
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{
            color: '#4fc6e1',
            fontStyle: 'italic',
            fontSize: 13,
            textAlign: 'center',
            marginTop: 6,
            fontWeight: 600,
            fontFamily: "'Nunito', Arial, sans-serif"
          }}>
            Test under development — placeholder results
          </div>
        </>
      );
    }
  }

  // ─── Special visualizations for non-factorial tests ───
  if (selectedTest === "correlation") {
    const rVal = formData.r || "0.3";
    return (
      <div style={{ marginTop: 30, textAlign: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 20, color: "#276b7b" }}>
          Correlation (Pearson r)
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 18 }}>
          <div style={{ width: 100, height: 100, borderRadius: "50%", background: "rgba(79,198,225,0.35)", border: "2.5px solid #4fc6e1", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, color: "#276b7b", zIndex: 2 }}>Var X</div>
          <div style={{ width: 40, height: 2, background: "linear-gradient(90deg,#4fc6e1,#f9b448)", margin: "0 -18px", zIndex: 1 }} />
          <div style={{ width: 100, height: 100, borderRadius: "50%", background: "rgba(249,180,72,0.35)", border: "2.5px solid #f9b448", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, color: "#7a5a00", zIndex: 2 }}>Var Y</div>
        </div>
        <div style={{ fontSize: 13, color: "#789" }}>
          <span style={{ marginRight: 12 }}><b>α</b> = {formData.alpha || "—"}</span>
          <span style={{ marginRight: 12 }}><b>Power</b> = {formData.power || "—"}</span>
          <span><b>r</b> = {rVal}</span>
        </div>
        {nPerGroup && <div style={{ marginTop: 8, fontWeight: 700, fontSize: 18, color: "#276b7b" }}>N = {nPerGroup} participants</div>}
      </div>
    );
  }

  if (selectedTest === "regression") {
    const f2Val = formData.f2 || "0.15";
    const nPred = formData.n_predictors || "1";
    return (
      <div style={{ marginTop: 30, textAlign: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 18, color: "#276b7b" }}>
          Multiple Linear Regression
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {Array.from({ length: Math.min(Number(nPred), 6) }).map((_, i) => (
            <div key={i} style={{ width: 52, height: 52, borderRadius: 12, background: "rgba(79,198,225,0.25)", border: "2px solid #4fc6e1", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#276b7b" }}>X{i+1}</div>
          ))}
          {Number(nPred) > 6 && <div style={{ color: "#999", fontSize: 13 }}>+{Number(nPred)-6} more</div>}
          <div style={{ fontSize: 24, color: "#55D1E3", margin: "0 4px" }}>→</div>
          <div style={{ width: 60, height: 60, borderRadius: 12, background: "rgba(249,180,72,0.3)", border: "2px solid #f9b448", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#7a5a00" }}>Y</div>
        </div>
        <div style={{ fontSize: 13, color: "#789" }}>
          <span style={{ marginRight: 12 }}><b>α</b> = {formData.alpha || "—"}</span>
          <span style={{ marginRight: 12 }}><b>Power</b> = {formData.power || "—"}</span>
          <span style={{ marginRight: 12 }}><b>f²</b> = {f2Val}</span>
          <span><b>predictors</b> = {nPred}</span>
        </div>
        {nPerGroup && <div style={{ marginTop: 8, fontWeight: 700, fontSize: 18, color: "#276b7b" }}>N = {nPerGroup} participants</div>}
      </div>
    );
  }

  if (selectedTest === "chi2") {
    const df = formData.chi2_df || "1";
    const w = formData.f || "0.3";
    return (
      <div style={{ marginTop: 30, textAlign: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 18, color: "#276b7b" }}>
          Chi-square test
        </div>
        <div style={{ display: "inline-grid", gridTemplateColumns: "repeat(3,44px)", gap: 4, marginBottom: 14 }}>
          {[...Array(9)].map((_, i) => (
            <div key={i} style={{ width: 44, height: 36, borderRadius: 6, background: i === 0 ? "#E0E7EF" : i < 3 ? "rgba(79,198,225,0.25)" : i % 3 === 0 ? "#E0E7EF" : "rgba(249,180,72,0.18)", border: "1.5px solid #ddd", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "#666" }}>
              {i === 0 ? "" : i < 3 ? `C${i}` : i % 3 === 0 ? `R${Math.floor(i/3)}` : "·"}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 13, color: "#789" }}>
          <span style={{ marginRight: 12 }}><b>α</b> = {formData.alpha || "—"}</span>
          <span style={{ marginRight: 12 }}><b>Power</b> = {formData.power || "—"}</span>
          <span style={{ marginRight: 12 }}><b>w</b> = {w}</span>
          <span><b>df</b> = {df}</span>
        </div>
        {nPerGroup && <div style={{ marginTop: 8, fontWeight: 700, fontSize: 18, color: "#276b7b" }}>N = {nPerGroup} participants</div>}
      </div>
    );
  }

  if (selectedTest === "ttest_paired") {
    const d = formData.f || "0.5";
    return (
      <div style={{ marginTop: 30, textAlign: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 18, color: "#276b7b" }}>Paired t-test</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginBottom: 14 }}>
          <div style={{ padding: "14px 22px", background: "rgba(79,198,225,0.25)", border: "2.5px solid #4fc6e1", borderRadius: 14, fontWeight: 700, color: "#276b7b" }}>Measure 1</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ fontSize: 22, color: "#55D1E3" }}>⟷</div>
            <div style={{ fontSize: 12, color: "#999" }}>same participants</div>
          </div>
          <div style={{ padding: "14px 22px", background: "rgba(249,180,72,0.25)", border: "2.5px solid #f9b448", borderRadius: 14, fontWeight: 700, color: "#7a5a00" }}>Measure 2</div>
        </div>
        <div style={{ fontSize: 13, color: "#789" }}>
          <span style={{ marginRight: 12 }}><b>α</b> = {formData.alpha || "—"}</span>
          <span style={{ marginRight: 12 }}><b>Power</b> = {formData.power || "—"}</span>
          <span><b>d</b> = {d}</span>
        </div>
        {nPerGroup && <div style={{ marginTop: 8, fontWeight: 700, fontSize: 18, color: "#276b7b" }}>N = {nPerGroup} participants</div>}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 30 }}>
      {testTitle && (
        <div style={{
          textAlign: "center",
          fontWeight: 700,
          fontSize: 23,
          marginBottom: 22,
          color: "#276b7b",
          letterSpacing: 1
        }}>
          {testTitle}
        </div>
      )}

      {anovaRmBlock}

      {!anovaRmBlock && (
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {allInterCombs.length > 0 ? allInterCombs.map((interComb, gi) => (
            <div key={gi} style={{
              border: `2.5px solid #ccc`,
              background: getInterBackground(interComb),
              borderRadius: 22,
              minWidth: 125,
              padding: 18,
              textAlign: 'center',
              color: '#222',
              fontFamily: "'Nunito', Arial, sans-serif",
              fontWeight: 600,
              boxShadow: '0 1px 8px #55D1E325',
              marginBottom: 18,
              flex: '0 1 auto'
            }}>
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 10 }}>
                {interComb.join(' × ')}
              </div>
              <div style={{ marginBottom: 10, fontSize: 13, fontStyle: "italic" }}>
                n = {nPerGroupSafe}
              </div>
              {hasIntraModalities && allIntraCombs.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
                  {allIntraCombs.map((intraComb, li) => {
                    let bgStyle = "#fff";
                    if (cleanedIntra.length === 1) {
                      const color = getFactorColor(cleanedIntra[0], 0, 'intra');
                      bgStyle = color;
                    } else if (cleanedIntra.length === 2) {
                      const c1 = getFactorColor(cleanedIntra[0], 0, 'intra');
                      const c2 = getFactorColor(cleanedIntra[1], 1, 'intra');
                      bgStyle = `linear-gradient(135deg, ${c1} 50%, ${c2} 50%)`;
                    } else {
                      bgStyle = "#eee";
                    }
                    return (
                      <div key={li} style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        border: "2.5px solid #ccc",
                        background: bgStyle,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        color: '#fff',
                        fontWeight: 600,
                        marginBottom: 4,
                        userSelect: 'none'
                      }}>
                        {intraComb.join(' × ')}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )) : (
            <div style={{
              width: 120,
              border: '2.5px solid #ccc',
              background: '#fafaff',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 15,
              color: "#bbb",
              fontWeight: 600,
              marginBottom: 12,
              padding: 13,
              flexDirection: 'column'
            }}>
              (no condition)
            </div>
          )}
        </div>
      )}

      <div style={{
        fontSize: 14,
        color: "#274567",
        maxWidth: 600,
        margin: "8px auto 0 auto"
      }}>
        <div style={{ marginTop: 3 }}>
          <b>Design:</b> {planNotation}
        </div>
        <div style={{ color: "#888", fontSize: 13, margin: "3px 0 2px 0" }}>
          {legend}
        </div>
        <div style={{ color: "#789", fontSize: 13, margin: "3px 0 2px 0" }}>
          <span style={{ marginRight: 10 }}><b>α</b> = {alphaDisplay}</span>
          <span style={{ marginRight: 10 }}><b>Power</b> = {powerDisplay}</span>
          <span><b>f</b> = {fDisplay}</span>
        </div>
        <div style={{ color: "#666", fontSize: 13, margin: "3px 0 0 0" }}>
          <span><b>Test type:</b> {testType} — </span>
          <span><b>Total number of subjects:</b> {totalN}</span>
        </div>
        {selectedTest === "lmm" && (
          <>
            {formData.randomFactor && (
              <div style={{ color: "#666", fontSize: 13, margin: "3px 0 0 0" }}>
                <span><b>Random factor:</b> {formData.randomFactor}</span>
              </div>
            )}
            {formData.nSimulations && (
              <div style={{ color: "#666", fontSize: 13, margin: "3px 0 0 0" }}>
                <span><b>Number of simulations:</b> {formData.nSimulations}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default DesignVisualizer;
