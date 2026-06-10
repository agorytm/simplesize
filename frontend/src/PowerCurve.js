import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const API = process.env.REACT_APP_API_URL || 'https://simplesize-production.up.railway.app';

export default function PowerCurve({ formData, selectedTest, result }) {
  const { i18n } = useTranslation();
  const fr = i18n.language === 'fr';
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const svgRef = useRef(null);
  const debounceRef = useRef(null);

  const fetchCurve = useCallback(async () => {
    if (!selectedTest || selectedTest === 'lmm') return;
    setLoading(true);
    try {
      const intraLevels = (formData.intraFactors?.[0]?.levels || []).length;
      const interLevels = (formData.interFactors?.[0]?.levels || []).length;
      const payload = {
        selected_test: selectedTest,
        f:             parseFloat((formData.f  || '0.25').toString().replace(',','.')),
        alpha:         parseFloat((formData.alpha || '0.05').toString().replace(',','.')),
        r:             parseFloat((formData.r  || '0.3').toString().replace(',','.')),
        f2:            parseFloat((formData.f2 || '0.15').toString().replace(',','.')),
        chi2_df:       parseInt(formData.chi2_df || 1),
        n_predictors:  parseInt(formData.n_predictors || 1),
        corr:          parseFloat((formData.corr || '0.5').toString()),
        epsilon:       parseFloat((formData.epsilon || '1.0').toString()),
        n_groups:      Math.max(interLevels, 2),
        n_levels:      Math.max(intraLevels, 2),
        n_points:      50,
      };
      const res = await fetch(`${API}/api/power_curve`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.points) setPoints(data.points);
    } catch { /* silently skip */ }
    setLoading(false);
  }, [selectedTest, formData]);

  // Debounce: re-fetch 600ms après un changement de params
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchCurve, 600);
    return () => clearTimeout(debounceRef.current);
  }, [fetchCurve]);

  if (!selectedTest || selectedTest === 'lmm' || points.length < 2) {
    if (loading) return (
      <div style={{ textAlign: 'center', color: '#9aabbc', padding: '28px 0', fontSize: 13 }}>
        {fr ? 'Chargement de la courbe…' : 'Loading curve…'}
      </div>
    );
    return null;
  }

  /* ── Dessin SVG ──────────────────────────────────────────────────────── */
  const W = 320, H = 200, PL = 42, PR = 16, PT = 16, PB = 38;
  const cw = W - PL - PR, ch = H - PT - PB;

  const maxN = points[points.length - 1].n;
  const minN = points[0].n;

  const px = n  => PL + (Math.log(n) - Math.log(minN)) / (Math.log(maxN) - Math.log(minN)) * cw;
  const py = pw => PT + ch - pw * ch;

  // Ligne de puissance cible (0.80)
  const y80 = py(0.80);
  const y95 = py(0.95);

  // N du résultat courant
  const resultN = result?.n_per_group || null;

  // Chemin SVG
  const pathD = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${px(p.n).toFixed(1)},${py(p.power).toFixed(1)}`
  ).join(' ');

  // Graduations Y
  const yTicks = [0, 0.2, 0.4, 0.6, 0.8, 0.95, 1.0];
  // Graduations X (log scale, ~5 pts)
  const xTickValues = [];
  const logMin = Math.log10(minN), logMax = Math.log10(maxN);
  for (let i = 0; i <= 4; i++) {
    const v = Math.round(Math.pow(10, logMin + i * (logMax - logMin) / 4));
    xTickValues.push(v);
  }

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: '#55D1E3', marginBottom: 6 }}>
        {fr ? '📈 Courbe de puissance' : '📈 Power curve'}
        {loading && <span style={{ fontWeight: 400, color: '#aaa', marginLeft: 8, fontSize: 11 }}>
          {fr ? '(mise à jour…)' : '(updating…)'}
        </span>}
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, display: 'block' }}
           xmlns="http://www.w3.org/2000/svg">

        {/* Fond */}
        <rect x={PL} y={PT} width={cw} height={ch} fill="#f8fbfd" rx="4" />

        {/* Bande cible 80%–95% */}
        <rect x={PL} y={y95} width={cw} height={y80 - y95}
              fill="#e8fdf5" opacity="0.7" />

        {/* Grille Y */}
        {yTicks.map(v => (
          <g key={v}>
            <line x1={PL} x2={PL + cw} y1={py(v)} y2={py(v)}
                  stroke={v === 0.8 ? '#27ae60' : '#e0e7ef'}
                  strokeWidth={v === 0.8 ? 1.5 : 0.8}
                  strokeDasharray={v === 0.8 ? '4 3' : 'none'} />
            <text x={PL - 4} y={py(v) + 4} textAnchor="end"
                  fill={v === 0.8 ? '#27ae60' : '#9aabbc'} fontSize="9"
                  fontWeight={v === 0.8 ? 700 : 400}>
              {v === 0.8 ? '80%' : v === 0.95 ? '95%' : v === 1.0 ? '100%' : v === 0 ? '0%' : `${Math.round(v*100)}%`}
            </text>
          </g>
        ))}

        {/* Grille X */}
        {xTickValues.map(v => (
          <g key={v}>
            <line x1={px(v)} x2={px(v)} y1={PT} y2={PT + ch}
                  stroke="#e0e7ef" strokeWidth="0.8" />
            <text x={px(v)} y={PT + ch + 13} textAnchor="middle"
                  fill="#9aabbc" fontSize="9">
              {v >= 1000 ? `${v/1000}k` : v}
            </text>
          </g>
        ))}

        {/* Courbe */}
        <path d={pathD} fill="none" stroke="#55D1E3" strokeWidth="2.5"
              strokeLinejoin="round" strokeLinecap="round" />

        {/* Marqueur résultat courant */}
        {resultN && resultN >= minN && resultN <= maxN && (() => {
          const rx = px(resultN);
          // Trouver power interpolée
          const idx = points.findIndex(p => p.n >= resultN);
          const pw = idx > 0
            ? points[idx - 1].power + (points[idx].power - points[idx - 1].power) *
              (resultN - points[idx-1].n) / (points[idx].n - points[idx-1].n)
            : points[idx]?.power || 0.8;
          const ry = py(pw);
          return (
            <g>
              <line x1={rx} x2={rx} y1={PT} y2={PT + ch}
                    stroke="#1a8fa8" strokeWidth="1.5" strokeDasharray="3 2" />
              <circle cx={rx} cy={ry} r="5" fill="#1a8fa8" stroke="#fff" strokeWidth="1.5" />
              <rect x={rx - 22} y={ry - 22} width={44} height={15} rx="4" fill="#1a8fa8" />
              <text x={rx} y={ry - 12} textAnchor="middle" fill="#fff" fontSize="9" fontWeight="700">
                N={resultN} · {Math.round(pw * 100)}%
              </text>
            </g>
          );
        })()}

        {/* Axes labels */}
        <text x={PL + cw / 2} y={H - 2} textAnchor="middle" fill="#9aabbc" fontSize="10">
          {fr ? 'Effectif par groupe (N)' : 'Sample size per group (N)'}
        </text>
        <text x={10} y={PT + ch / 2} textAnchor="middle" fill="#9aabbc" fontSize="10"
              transform={`rotate(-90, 10, ${PT + ch / 2})`}>
          {fr ? 'Puissance' : 'Power'}
        </text>
      </svg>

      <div style={{ fontSize: 11, color: '#9aabbc', marginTop: 2 }}>
        {fr
          ? 'Zone verte = zone cible (80–95%). Point bleu = votre calcul.'
          : 'Green band = target zone (80–95%). Blue dot = your result.'}
      </div>
    </div>
  );
}
