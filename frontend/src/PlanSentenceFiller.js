import React, { useState } from "react";

function PlanSentenceFiller({ formData = {}, onApply, onCancel }) {
  const [nGroups, setNGroups] = useState(formData.interFactors?.[0]?.levels?.length || 2);
  const [groupNames, setGroupNames] = useState(
    formData.interFactors?.[0]?.levels?.length
      ? formData.interFactors[0].levels
      : ["Control", "Intervention"].slice(0, formData.interFactors?.[0]?.levels?.length || 2)
  );
  const [variable, setVariable] = useState(formData.intraFactors?.[0]?.name || "performance");
  const [nConditions, setNConditions] = useState(formData.intraFactors?.[0]?.levels?.length || 2);
  const [conditionNames, setConditionNames] = useState(
    formData.intraFactors?.[0]?.levels?.length
      ? formData.intraFactors[0].levels
      : ["Before", "After"].slice(0, formData.intraFactors?.[0]?.levels?.length || 2)
  );
  const [hasThirdFactor, setHasThirdFactor] = useState(
    (formData.interFactors?.length === 2 || formData.intraFactors?.length === 2) || false
  );
  const [thirdFactorType, setThirdFactorType] = useState(
    formData.interFactors?.length === 2 ? "inter" : "intra"
  );
  const [nThirdLevels, setNThirdLevels] = useState(
    (thirdFactorType === "inter"
      ? formData.interFactors?.[1]?.levels?.length
      : formData.intraFactors?.[1]?.levels?.length
    ) || 2
  );
  const [thirdFactorNames, setThirdFactorNames] = useState(
    (thirdFactorType === "inter"
      ? formData.interFactors?.[1]?.levels
      : formData.intraFactors?.[1]?.levels
    ) || ["Factor 3a", "Factor 3b"]
  );
  const [comparison, setComparison] = useState("interaction");
  const [power, setPower] = useState(formData.power ? Number(formData.power) * 100 : 90);
  const [effectSize, setEffectSize] = useState("medium");

  const handleNGroupsChange = (val) => {
    setNGroups(val);
    setGroupNames((prev) => {
      const base = [...prev, ...Array(val).fill("")].slice(0, val);
      return base.map((n, i) => n || `Group ${i + 1}`);
    });
  };

  const handleNConditionsChange = (val) => {
    setNConditions(val);
    setConditionNames((prev) => {
      const base = [...prev, ...Array(val).fill("")].slice(0, val);
      return base.map((n, i) => n || `Condition ${i + 1}`);
    });
  };

  const handleNThirdLevelsChange = (val) => {
    setNThirdLevels(val);
    setThirdFactorNames((prev) => {
      const base = [...prev, ...Array(val).fill("")].slice(0, val);
      return base.map((n, i) => n || `Level ${i + 1}`);
    });
  };

  const comparisonOptions = [
    ...(nGroups > 1 ? [{ value: "groups", label: "the difference in scores between groups" }] : []),
    ...(nConditions > 1 ? [{ value: "conditions", label: "the difference between conditions" }] : []),
    ...(nGroups > 1 && nConditions > 1 ? [{ value: "interaction", label: "the interaction between group and conditions" }] : []),
    ...(hasThirdFactor && nGroups > 1 && nConditions > 1 && nThirdLevels > 1
      ? [{ value: "3factors", label: "the interaction between the 3 factors" }]
      : [])
  ];

  const handleAutoFill = () => {
    const interFactors = nGroups > 1
      ? [{ name: "group", levels: groupNames }]
      : [];
    const intraFactors = nConditions > 1
      ? [{ name: variable, levels: conditionNames }]
      : [];
    if (hasThirdFactor) {
      const third = { name: "Factor 3", levels: thirdFactorNames };
      if (thirdFactorType === "inter") interFactors.push(third);
      else intraFactors.push(third);
    }
    const updatedFormData = {
      ...formData,
      interFactors,
      intraFactors,
      alpha: formData.alpha || "0.05",
      power: (power / 100).toString(),
      f: effectSize === "small" ? "0.10" : effectSize === "medium" ? "0.25" : "0.40",
      randomFactor: formData.randomFactor || "",
    };
    onApply(updatedFormData);
  };

  return (
    <div style={{
      background: "#fff",
      borderRadius: 17,
      padding: "32px 38px 24px 38px",
      minWidth: 480,
      maxWidth: 570,
      boxShadow: "0 2px 32px #2f344a28",
      fontSize: 16
    }}>
      <div style={{ marginBottom: 18, fontWeight: 600, fontSize: 19 }}>
        Build your experimental design!
      </div>
      <span>My participants are divided into&nbsp;</span>
      <select value={nGroups} onChange={e => handleNGroupsChange(Number(e.target.value))}>
        {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
      </select>
      <span>&nbsp;groups (with modalities:</span>
      {groupNames.map((name, idx) => (
        <input
          key={idx}
          value={name}
          onChange={e => {
            const newArr = [...groupNames];
            newArr[idx] = e.target.value;
            setGroupNames(newArr);
          }}
          style={{ width: 90, margin: "0 5px" }}
          placeholder={`Group ${idx + 1}`}
        />
      ))}
      <span>),<br />in each group I measure&nbsp;</span>
      <input
        value={variable}
        onChange={e => setVariable(e.target.value)}
        style={{ width: 120, margin: "0 5px" }}
        placeholder="variable name"
      />
      <span>&nbsp;with&nbsp;</span>
      <select value={nConditions} onChange={e => handleNConditionsChange(Number(e.target.value))}>
        {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
      </select>
      <span>&nbsp;conditions (called:</span>
      {conditionNames.map((name, idx) => (
        <input
          key={idx}
          value={name}
          onChange={e => {
            const newArr = [...conditionNames];
            newArr[idx] = e.target.value;
            setConditionNames(newArr);
          }}
          style={{ width: 90, margin: "0 5px" }}
          placeholder={`Condition ${idx + 1}`}
        />
      ))}
      <span>),</span>
      <div style={{ margin: "12px 0" }}>
        <label>
          <input
            type="checkbox"
            checked={hasThirdFactor}
            onChange={e => setHasThirdFactor(e.target.checked)}
            style={{ marginRight: 7 }}
          />
          I have a third factor&nbsp;
        </label>
        {hasThirdFactor && (
          <span>
            <select
              value={thirdFactorType}
              onChange={e => setThirdFactorType(e.target.value)}
              style={{ marginRight: 7 }}
            >
              <option value="inter">between-subjects</option>
              <option value="intra">within-subjects</option>
            </select>
            → The&nbsp;
            <select
              value={nThirdLevels}
              onChange={e => handleNThirdLevelsChange(Number(e.target.value))}
              style={{ marginRight: 7 }}
            >
              {[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            levels of this factor are&nbsp;:
            {thirdFactorNames.map((name, idx) => (
              <input
                key={idx}
                value={name}
                onChange={e => {
                  const newArr = [...thirdFactorNames];
                  newArr[idx] = e.target.value;
                  setThirdFactorNames(newArr);
                }}
                style={{ width: 90, margin: "0 5px" }}
                placeholder={`Level ${idx + 1}`}
              />
            ))}
          </span>
        )}
      </div>
      <span>I want to compare&nbsp;</span>
      <select value={comparison} onChange={e => setComparison(e.target.value)}>
        {comparisonOptions.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <span>,<br />and I want&nbsp;</span>
      <select value={power} onChange={e => setPower(Number(e.target.value))}>
        {[80, 90, 95].map(p => <option key={p} value={p}>{p}%</option>)}
      </select>
      <span>&nbsp;power to detect a&nbsp;</span>
      <select value={effectSize} onChange={e => setEffectSize(e.target.value)}>
        <option value="small">small</option>
        <option value="medium">medium</option>
        <option value="large">large</option>
      </select>
      <span>&nbsp;effect.</span>
      <br />
      <div style={{ marginTop: 28, display: "flex", gap: 12 }}>
        <button
          style={{
            background: "#55D1E3",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 16,
            padding: "10px 24px",
            cursor: "pointer",
            boxShadow: "0 2px 8px #55D1E322",
          }}
          onClick={handleAutoFill}
        >
          Auto-fill parameters
        </button>
        <button
          style={{
            background: "#eee",
            color: "#2F344A",
            border: "none",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 16,
            padding: "10px 24px",
            cursor: "pointer"
          }}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default PlanSentenceFiller;
