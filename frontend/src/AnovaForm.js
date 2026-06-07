import React, { useState, useEffect } from 'react';

function AnovaForm({
  formData, onUpdate, conversionInfo, showConversionInfo, selectedTest, onLmmLaunch, isLoadingLmm,
  interFactors: externalInterFactors = null,
  intraFactors: externalIntraFactors = null
}) {
  // Dynamic states for factors
  const [interFactors, setInterFactors] = useState(externalInterFactors || [{ name: '', levels: [] }]);
  const [intraFactors, setIntraFactors] = useState(externalIntraFactors || [{ name: '', levels: [] }]);
  const totalFactors = interFactors.length + intraFactors.length;
  const canAdd = totalFactors < 3;

  const [alpha, setAlpha] = useState(formData.alpha || "0.05");
  const [power, setPower] = useState(formData.power || "0.8");
  const [f, setF] = useState(formData.f || "0.25");

  // --- LMM ---
  const [randomFactor, setRandomFactor] = useState(formData.randomFactor || "");

  // --- MDE (Minimum Detectable Effect Size) ---
  const [hasSample, setHasSample] = useState(false);
  const [nGiven, setNGiven] = useState(""); // provided sample size (per group or total)
  const [mde, setMDE] = useState(null);
  const [mdeError, setMdeError] = useState("");

  // Sync when formData changes (useful for sentence filler)
  useEffect(() => {
    setAlpha(formData.alpha || "0.05");
    setPower(formData.power || "0.8");
    setF(formData.f || "0.25");
    setRandomFactor(formData.randomFactor || "");

    if (formData.interFactors) setInterFactors(formData.interFactors);
    if (formData.intraFactors) setIntraFactors(formData.intraFactors);
  }, [formData]);

  // Propagate all changes to parent (App.js)
  useEffect(() => {
    onUpdate({
      ...formData,
      interFactors,
      intraFactors,
      alpha,
      power,
      f,
      randomFactor,
      nSimulations: formData.nSimulations || 20,
    });
  }, [interFactors, intraFactors, alpha, power, f, randomFactor, formData.nSimulations]);

  // -- MDE UI sync --
  useEffect(() => {
    if (!hasSample) {
      setNGiven("");
      setMDE(null);
      setMdeError("");
    }
  }, [hasSample, selectedTest, interFactors, intraFactors]);

  useEffect(() => {
    if (
      hasSample &&
      nGiven &&
      !isNaN(Number(nGiven)) &&
      Number(nGiven) > 0 &&
      selectedTest &&
      !testsSansMde.includes(selectedTest) &&
      ["ttest", "anova", "anova_rm", "anova_mixed", "anova_3f"].includes(selectedTest)
    ) {
      fetchMDE();
    } else {
      setMDE(null);
      setMdeError("");
    }
  }, [nGiven, hasSample, selectedTest, interFactors, intraFactors, alpha, power]);

  // -- Backend call for MDE --
  const fetchMDE = async () => {
    const groupLevels = interFactors[0]?.levels || [];
    const levelLevels = intraFactors[0]?.levels || [];

    let payload = {
      alpha: parseFloat(alpha.replace(",", ".")),
      power: parseFloat(power.replace(",", ".")),
      f: parseFloat(f.replace(",", ".")),
      group_levels: groupLevels,
      level_levels: levelLevels,
      selected_test: selectedTest,
      mde_mode: true,
      n_given: Number(nGiven)
    };
    try {
      const res = await fetch((process.env.REACT_APP_API_URL || 'http://localhost:5000') + '/api/simplesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.mde) {
        setMDE(data.mde);
        setMdeError("");
      } else if (data.error) {
        setMDE(null);
        setMdeError(data.error);
      } else {
        setMDE(null);
        setMdeError("Unknown error");
      }
    } catch (e) {
      setMDE(null);
      setMdeError("Network error");
    }
  };

  const testsSansMde = ["anova_mixed", "anova_3f", "anova_factorielle"];

  // Styles
  const labelStyle = { fontWeight: 500, fontSize: 14, marginTop: 8, display: 'block' };
  const inputStyle = { margin: '0 0 10px 0', padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', width: 130 };

  const addButtonStyle = {
    background: 'linear-gradient(90deg,#fff7e0 0%,#ffeabf 100%)',
    color: '#b4880a',
    border: 'none',
    borderRadius: '50%',
    width: 32,
    height: 32,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 20,
    margin: '0 6px',
    cursor: 'pointer',
    boxShadow: '0 1px 5px #ffeeb412'
  };
  const removeButtonStyle = {
    background: 'linear-gradient(90deg,#fde2e2 0%,#fff7e7 100%)',
    color: '#a0422c',
    border: 'none',
    borderRadius: '50%',
    width: 26,
    height: 26,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 16,
    margin: '0 3px',
    cursor: 'pointer',
    boxShadow: '0 1px 4px #eb21211a'
  };
  const factorColors = [
    "#4fc6e1", // light blue for first factor
    "#f9b448", // orange for second factor
    "#e99db9"  // soft pink for third factor
  ];

  let nLabel = "N per group";
  if (selectedTest === "anova_rm" || selectedTest === "anova_mixed") {
    nLabel = "N subjects (total)";
  }
  let effetLabel = "f";
  if (selectedTest === "ttest") effetLabel = "d";

  let showWarning = false;
  if (mde && (
    (selectedTest === "ttest" && mde > 0.8) ||
    (selectedTest !== "ttest" && mde > 0.4)
  )) {
    showWarning = true;
  }

  function getFactorColor(factor, allFactors) {
    const idx = allFactors.findIndex(f => f === factor);
    if (factor.levels && factor.levels.length >= 2 && idx !== -1) {
      return factorColors[idx % factorColors.length];
    }
    return "white"; // no color if not enough levels
  }

  const allFactors = [...interFactors, ...intraFactors];



  return (
    <form
      onSubmit={e => e.preventDefault()}
      style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}
    >
      <span style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Define the design</span>

      {/* BETWEEN-SUBJECTS FACTORS */}
      {interFactors.map((factor, idx) => (
        <div key={`inter-${idx}`} style={{ marginBottom: 10 }}>
          <label style={labelStyle}>{`Between-subject factor name ${idx + 1}`}</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <input
              type="text"
              value={factor.name}
              onChange={e => {
                const copy = [...interFactors];
                copy[idx].name = e.target.value;
                setInterFactors(copy);
              }}
              style={{
                ...inputStyle,
                backgroundColor: getFactorColor(factor, allFactors)
              }}
            />
            {canAdd && interFactors.length < 2 && idx === interFactors.length - 1 && (
              <button
                type="button"
                onClick={() => setInterFactors([...interFactors, { name: '', levels: [] }])}
                style={addButtonStyle}
                title="Add between-subject factor"
              >+</button>
            )}
            {interFactors.length > 1 && (
              <button
                type="button"
                onClick={() => setInterFactors(interFactors.filter((_, i) => i !== idx))}
                style={removeButtonStyle}
                title="Remove this factor"
              >-</button>
            )}
          </div>
          <label style={labelStyle}>Groups</label>
          <input
            type="text"
            value={factor.levelInput || ''}
            onChange={e => {
              const copy = [...interFactors];
              copy[idx].levelInput = e.target.value;
              setInterFactors(copy);
            }}
            placeholder="Add a group"
            style={inputStyle}
          />
          <button
            type="button"
            onClick={() => {
              const copy = [...interFactors];
              if (
                copy[idx].levelInput &&
                !copy[idx].levels?.includes(copy[idx].levelInput.trim())
              ) {
                copy[idx].levels = [...(copy[idx].levels || []), copy[idx].levelInput.trim()];
                copy[idx].levelInput = '';
                setInterFactors(copy);
              }
            }}
            style={addButtonStyle}
          >+</button>
          <div>
            {(factor.levels || []).map((lvl, i) => (
              <span key={i} style={{
                display: 'inline-flex', alignItems: 'center',
                background: '#f2f6ff', borderRadius: 9, padding: '4px 7px 4px 11px',
                fontSize: 14, margin: '0 6px 6px 0', fontWeight: 500, color: '#357'
              }}>
                {lvl}
                <button
                  type="button"
                  onClick={() => {
                    const copy = [...interFactors];
                    copy[idx].levels = copy[idx].levels.filter((_, j) => j !== i);
                    setInterFactors(copy);
                  }}
                  style={removeButtonStyle}
                  title="Remove this group"
                >-</button>
              </span>
            ))}
          </div>
        </div>
      ))}

      {/* WITHIN-SUBJECTS FACTORS */}
      {intraFactors.map((factor, idx) => (
        <div key={`intra-${idx}`} style={{ marginBottom: 10 }}>
          <label style={labelStyle}>{`Within-subject factor name ${idx + 1}`}</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <input
              type="text"
              value={factor.name}
              onChange={e => {
                const copy = [...intraFactors];
                copy[idx].name = e.target.value;
                setIntraFactors(copy);
              }}
              style={{
                ...inputStyle,
                backgroundColor: getFactorColor(factor, allFactors)
              }}
            />
            {canAdd && intraFactors.length < 2 && idx === intraFactors.length - 1 && (
              <button
                type="button"
                onClick={() => setIntraFactors([...intraFactors, { name: '', levels: [] }])}
                style={addButtonStyle}
                title="Add within-subject factor"
              >+</button>
            )}
            {intraFactors.length > 1 && (
              <button
                type="button"
                onClick={() => setIntraFactors(intraFactors.filter((_, i) => i !== idx))}
                style={removeButtonStyle}
                title="Remove this factor"
              >-</button>
            )}
          </div>
          <label style={labelStyle}>Levels</label>
          <input
            type="text"
            value={factor.levelInput || ''}
            onChange={e => {
              const copy = [...intraFactors];
              copy[idx].levelInput = e.target.value;
              setIntraFactors(copy);
            }}
            placeholder="Add a level"
            style={inputStyle}
          />
          <button
            type="button"
            onClick={() => {
              const copy = [...intraFactors];
              if (
                copy[idx].levelInput &&
                !copy[idx].levels?.includes(copy[idx].levelInput.trim())
              ) {
                copy[idx].levels = [...(copy[idx].levels || []), copy[idx].levelInput.trim()];
                copy[idx].levelInput = '';
                setIntraFactors(copy);
              }
            }}
            style={addButtonStyle}
          >+</button>
          <div>
            {(factor.levels || []).map((lvl, i) => (
              <span key={i} style={{
                display: 'inline-flex', alignItems: 'center',
                background: '#fff7e0', borderRadius: 9, padding: '4px 7px 4px 11px',
                fontSize: 14, margin: '0 6px 6px 0', fontWeight: 500, color: '#b4880a'
              }}>
                {lvl}
                <button
                  type="button"
                  onClick={() => {
                    const copy = [...intraFactors];
                    copy[idx].levels = copy[idx].levels.filter((_, j) => j !== i);
                    setIntraFactors(copy);
                  }}
                  style={removeButtonStyle}
                  title="Remove this level"
                >-</button>
              </span>
            ))}
          </div>
        </div>
      ))}

      {/* alpha, power, f */}
      <label style={labelStyle}>α</label>
      <input type="text" value={alpha} onChange={e => setAlpha(e.target.value)} style={inputStyle} />

      <label style={labelStyle}>Power</label>
      <input type="text" value={power} onChange={e => setPower(e.target.value)} style={inputStyle} />

      <label style={labelStyle}>Expected effect size (f)</label>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <input
          type="number"
          step="0.01"
          value={f}
          onChange={e => setF(e.target.value)}
          style={inputStyle}
          placeholder="e.g. 0.25"
        />
        {showConversionInfo && (
          <div style={{
            marginLeft: 10,
            background: "#fff6da",
            border: "1.5px solid #FBC02D",
            color: "#B4880A",
            fontWeight: 600,
            fontSize: 14,
            borderRadius: 10,
            padding: "6px 13px",
            boxShadow: "0 1px 8px #B4880A22",
            minWidth: 80,
            textAlign: "center"
          }}>
            {conversionInfo}
          </div>
        )}
      </div>
      <div style={{ fontSize: 12, color: "#779", margin: "2px 0 9px 3px" }}>
        <div>
          <b>f</b> (ANOVA): 0.10 = small, 0.25 = medium, 0.40 = large.
        </div>
        <div>
          <b>d</b> (t-test): 0.2 = small, 0.5 = medium, 0.8 = large.<br />
          For t-test, the conversion <b>f → d</b> is automatic.
        </div>
      </div>

      {/* --- DROPDOWN NUMBER OF SIMULATIONS --- */}
      {selectedTest === "lmm" && (
        <label style={{ fontWeight: 500, fontSize: 14, marginBottom: 6 }}>
          Number of simulations:&nbsp;
          <select
            value={formData.nSimulations || 20}
            onChange={e => onUpdate({ ...formData, nSimulations: Number(e.target.value) })}
            style={{
              marginLeft: 7,
              padding: "4px 10px",
              borderRadius: 7,
              border: "1px solid #ddd",
              fontSize: 14
            }}
          >
            <option value={10}>small (10)</option>
            <option value={20}>medium (20)</option>
            <option value={30}>large (30)</option>
          </select>
        </label>
      )}

      {/* --- RANDOM FACTOR INPUT --- */}
      {selectedTest === "lmm" && (
        <div style={{
          margin: "10px 0 10px 0",
          padding: "13px 13px 6px 13px",
          background: "#f6faff",
          borderRadius: 10,
          border: "1.3px solid #98d9ed"
        }}>
          <label style={{ ...labelStyle, fontWeight: 600, color: "#209" }}>
            Random factor (e.g., participant)
          </label>
          <input
            type="text"
            value={randomFactor}
            onChange={e => setRandomFactor(e.target.value)}
            style={{ ...inputStyle, width: 140 }}
            placeholder='participant'
          />
          <div style={{ marginTop: 13, marginBottom: 2 }}>
            <button
              type="button"
              style={{
                background: isLoadingLmm ? "#E0E7EF" : "linear-gradient(90deg, #80e8fc 0%, #f4f6f8 100%)",
                color: "#276b7b",
                fontWeight: 700,
                fontSize: 16,
                padding: "10px 22px",
                border: "1.7px solid #55D1E3",
                borderRadius: 13,
                cursor: isLoadingLmm ? "not-allowed" : "pointer",
                boxShadow: "0 2px 10px #55d1e326",
                minWidth: 54
              }}
              onClick={() => {
                if (!isLoadingLmm && onLmmLaunch) onLmmLaunch();
              }}
              disabled={isLoadingLmm || !randomFactor.trim()}
            >
              {isLoadingLmm ? "Calculating…" : "Run LMM calculation"}
            </button>
          </div>
        </div>
      )}

      {/* ---- MDE ---- */}
      <div style={{
        margin: '20px 0 2px 0',
        background: '#f8fafc',
        padding: '12px 13px 7px 13px',
        borderRadius: 13,
        border: '1.5px solid #E7ECF2',
        boxShadow: '0 2px 9px #d1eaff18'
      }}>
        <label style={{
          display: 'flex', alignItems: 'center', fontWeight: 500, fontSize: 14, marginBottom: 5
        }}>
          <input
            type="checkbox"
            checked={hasSample}
            onChange={e => setHasSample(e.target.checked)}
            style={{ marginRight: 7 }}
          />
          I already have a sample size
        </label>
        {hasSample && (
          <div style={{ marginTop: 4 }}>
            {testsSansMde.includes(selectedTest) ? (
              <div style={{
                background: "#fff2e6",
                border: "1.5px solid #e18d53",
                color: "#a14b16",
                marginTop: 10,
                fontWeight: 600,
                fontSize: 15,
                borderRadius: 9,
                padding: "10px 13px",
                minWidth: 80,
                textAlign: "center"
              }}>
                MDE mode not implemented for {selectedTest === "anova_mixed" ? "mixed" : "factorial"} ANOVA
              </div>
            ) : (
              <>
                <label style={{ fontSize: 13 }}>
                  {nLabel}
                  <input
                    type="number"
                    min={1}
                    value={nGiven}
                    onChange={e => setNGiven(e.target.value)}
                    style={{ ...inputStyle, width: 90, marginLeft: 8 }}
                    placeholder={nLabel}
                  />
                </label>
                {mde && (
                  <div style={{
                    background: "#e7f8ed",
                    border: "1.5px solid #45b688",
                    color: "#216747",
                    marginTop: 10,
                    fontWeight: 600,
                    fontSize: 15,
                    borderRadius: 9,
                    padding: "8px 13px",
                    minWidth: 80,
                    textAlign: "center"
                  }}>
                    Minimum detectable effect size: <b>{effetLabel} = {mde}</b>
                    {showWarning && (
                      <div style={{
                        color: "#a64e1c",
                        background: "#fff0e6",
                        borderRadius: 7,
                        fontWeight: 600,
                        fontSize: 13,
                        marginTop: 8,
                        padding: "5px 10px",
                        border: "1.2px solid #f9b79b"
                      }}>
                        Warning: this sample size only detects large effects.
                      </div>
                    )}
                  </div>
                )}
                {mdeError && (
                  <div style={{
                    background: "#fff2e6",
                    border: "1.5px solid #e18d53",
                    color: "#a14b16",
                    marginTop: 10,
                    fontWeight: 600,
                    fontSize: 14,
                    borderRadius: 9,
                    padding: "8px 13px",
                    minWidth: 80,
                    textAlign: "center"
                  }}>{mdeError}</div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </form>
  );
}

export default AnovaForm;
