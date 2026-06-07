import React, { useMemo } from 'react';
import styles from './PowerCurve.module.css';

/**
 * Courbe puissance vs N — calcul côté client via approximation normale.
 * On trace la puissance pour un t-test/anova simple en fonction de N.
 */
function approximatePower(n, effect, alpha = 0.05) {
  // Approximation normale simple (Cohen, 1988) — bonne pour illustrer
  const z_alpha = 1.96; // α = 0.05 two-tailed
  const lambda  = effect * Math.sqrt(n / 2);
  const z_beta  = lambda - z_alpha;
  return Math.min(0.999, Math.max(0.001, normalCDF(z_beta)));
}

function normalCDF(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const p = 1 - (1/Math.sqrt(2*Math.PI)) * Math.exp(-x*x/2)
              * t * (0.319381530 + t * (-0.356563782
              + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x >= 0 ? p : 1 - p;
}

export default function PowerCurve({ test, params, targetN }) {
  const effect = parseFloat(params?.f || 0.25);
  const alpha  = parseFloat(params?.alpha || 0.05);

  const points = useMemo(() => {
    const pts = [];
    const maxN = Math.max(targetN * 2.5, 60);
    const step = Math.max(1, Math.floor(maxN / 40));
    for (let n = 2; n <= maxN; n += step) {
      pts.push({ n, pw: approximatePower(n, effect, alpha) });
    }
    return pts;
  }, [effect, alpha, targetN]);

  if (!points.length) return null;

  const W = 260, H = 110;
  const PAD = { t: 10, r: 10, b: 30, l: 36 };
  const cw  = W - PAD.l - PAD.r;
  const ch  = H - PAD.t - PAD.b;
  const maxN = points[points.length - 1].n;

  function xPx(n)  { return PAD.l + (n / maxN) * cw; }
  function yPx(pw) { return PAD.t + ch - pw * ch; }

  const path = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${xPx(p.n).toFixed(1)},${yPx(p.pw).toFixed(1)}`
  ).join(' ');

  const tx = xPx(targetN);
  const ty = yPx(approximatePower(targetN, effect, alpha));
  const powerAtTarget = approximatePower(targetN, effect, alpha);

  // Tick labels
  const nTicks = [Math.round(maxN * 0.25), Math.round(maxN * 0.5), Math.round(maxN * 0.75), maxN];

  return (
    <div className={styles.wrap}>
      <div className={styles.title}>Courbe puissance / effectif</div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className={styles.svg}>
        <defs>
          <linearGradient id="curve-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B6FE0" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#3B6FE0" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grille horizontale */}
        {[0, 0.25, 0.5, 0.75, 1].map(pw => (
          <g key={pw}>
            <line
              x1={PAD.l} y1={yPx(pw)} x2={W - PAD.r} y2={yPx(pw)}
              stroke="#EDF0F5" strokeWidth="1"
            />
            <text x={PAD.l - 4} y={yPx(pw) + 4} textAnchor="end" fontSize="9" fill="#8A93A6">
              {Math.round(pw * 100)}
            </text>
          </g>
        ))}

        {/* Ligne puissance cible (80%) */}
        <line
          x1={PAD.l} y1={yPx(0.8)} x2={W - PAD.r} y2={yPx(0.8)}
          stroke="#0FA88A" strokeWidth="1" strokeDasharray="4,3"
        />
        <text x={W - PAD.r + 2} y={yPx(0.8) + 4} fontSize="8" fill="#0FA88A">80%</text>

        {/* Aire sous la courbe */}
        <path
          d={`${path} L${xPx(maxN)},${yPx(0)} L${xPx(2)},${yPx(0)} Z`}
          fill="url(#curve-grad)"
        />

        {/* Courbe */}
        <path d={path} fill="none" stroke="#3B6FE0" strokeWidth="2" strokeLinecap="round" />

        {/* Ligne verticale N cible */}
        <line
          x1={tx} y1={PAD.t} x2={tx} y2={H - PAD.b}
          stroke="#3B6FE0" strokeWidth="1" strokeDasharray="3,3"
        />

        {/* Point N cible */}
        <circle cx={tx} cy={ty} r="4" fill="#3B6FE0" />
        <text x={tx + 5} y={ty - 5} fontSize="9" fill="#3B6FE0" fontWeight="bold">
          N={targetN} ({Math.round(powerAtTarget * 100)}%)
        </text>

        {/* Axe X ticks */}
        {nTicks.map(n => (
          <text key={n} x={xPx(n)} y={H - PAD.b + 12} textAnchor="middle" fontSize="9" fill="#8A93A6">
            {n}
          </text>
        ))}

        {/* Labels axes */}
        <text x={PAD.l + cw / 2} y={H - 2} textAnchor="middle" fontSize="9" fill="#8A93A6">
          N par groupe
        </text>
        <text
          x={10} y={PAD.t + ch / 2}
          textAnchor="middle" fontSize="9" fill="#8A93A6"
          transform={`rotate(-90, 10, ${PAD.t + ch / 2})`}
        >
          Puissance (%)
        </text>
      </svg>
    </div>
  );
}
