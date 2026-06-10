import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Génère un paragraphe "Methods" APA-style à copier dans un article.
 * Reçoit formData + result + selectedTest depuis HomePage.
 */
export default function MethodsParagraph({ formData, result, selectedTest }) {
  const { i18n } = useTranslation();
  const fr = i18n.language === 'fr';
  const [copied, setCopied] = useState(false);

  if (!result?.n_per_group || !selectedTest) return null;

  const alpha  = parseFloat((formData.alpha || '0.05').toString().replace(',','.'));
  const power  = parseFloat((formData.power || '0.8').toString().replace(',','.'));
  const f      = parseFloat((formData.f    || '0.25').toString().replace(',','.'));
  const r      = parseFloat((formData.r    || '0.3').toString().replace(',','.'));
  const f2     = parseFloat((formData.f2   || '0.15').toString().replace(',','.'));
  const n      = result.n_per_group;
  const corr   = parseFloat((formData.corr   || '0.5').toString());
  const eps    = parseFloat((formData.epsilon || '1.0').toString());
  const nPred  = parseInt(formData.n_predictors || 1);
  const chi2df = parseInt(formData.chi2_df || 1);
  const nGroups = Math.max((formData.interFactors?.[0]?.levels || []).length, 2);
  const nLevels = Math.max((formData.intraFactors?.[0]?.levels || []).length, 2);
  const pct = Math.round(power * 100);
  const alphaTxt = alpha.toString();

  function buildParagraph() {
    if (fr) {
      switch (selectedTest) {
        case 'ttest': {
          const d = (f * 2).toFixed(2);
          return `Une analyse de puissance a priori a été réalisée avec le logiciel SimpleSize (simplesize.science) en utilisant une distribution t non-centrale (Cohen, 1988 ; Faul et al., 2007). Pour un test t indépendant bilatéral, avec une taille d'effet attendue de d = ${d} (effet ${effectLabel(f,'f',fr)}), un seuil α = ${alphaTxt} et une puissance souhaitée de ${pct} %, un effectif de N = ${n} participants par groupe est nécessaire (soit N total = ${n * 2}).`;
        }
        case 'ttest_paired': {
          const d = (f * 2).toFixed(2);
          return `Une analyse de puissance a priori a été réalisée avec SimpleSize (simplesize.science). Pour un test t apparié bilatéral, avec une taille d'effet attendue de d = ${d} (effet ${effectLabel(f,'f',fr)}), un seuil α = ${alphaTxt} et une puissance de ${pct} %, un effectif de N = ${n} participants est nécessaire.`;
        }
        case 'anova': {
          return `Une analyse de puissance a priori a été réalisée avec SimpleSize (simplesize.science) en utilisant la distribution F non-centrale (Cohen, 1988). Pour une ANOVA inter-sujets à ${nGroups} groupes, avec une taille d'effet f = ${f.toFixed(2)} (effet ${effectLabel(f,'f',fr)}), α = ${alphaTxt} et une puissance de ${pct} %, un effectif de N = ${n} participants par groupe est nécessaire (N total = ${n * nGroups}).`;
        }
        case 'anova_rm': {
          const epsNote = eps < 1.0 ? ` Une correction de sphéricité ε = ${eps.toFixed(2)} (Greenhouse–Geisser) a été appliquée.` : '';
          return `Une analyse de puissance a priori a été réalisée avec SimpleSize (simplesize.science) en suivant l'algorithme G*Power pour l'ANOVA à mesures répétées (Faul et al., 2007). Pour ${nLevels} mesures répétées, avec f = ${f.toFixed(2)} (effet ${effectLabel(f,'f',fr)}), une corrélation inter-mesures ρ = ${corr.toFixed(2)}, α = ${alphaTxt} et une puissance de ${pct} %, un effectif de N = ${n} participants est nécessaire.${epsNote}`;
        }
        case 'anova_mixed': {
          return `Une analyse de puissance a priori a été réalisée avec SimpleSize (simplesize.science) pour l'effet d'interaction d'une ANOVA mixte (${nGroups} groupes × ${nLevels} mesures répétées), avec f = ${f.toFixed(2)} (effet ${effectLabel(f,'f',fr)}), une corrélation intra-sujet ρ = ${corr.toFixed(2)}, α = ${alphaTxt} et une puissance de ${pct} %. L'effectif nécessaire est N = ${n} participants par groupe (N total = ${n * nGroups}).`;
        }
        case 'lmm': {
          const pw = result.estimated_power ? Math.round(result.estimated_power * 100) : pct;
          const rs = formData.randomStructure || 'intercept';
          const rsLabel = rs === 'intercept_slope'
            ? 'intercepts et pentes aléatoires par participant'
            : rs === 'crossed'
              ? `effets aléatoires croisés (${nGroups > 1 ? nGroups + ' groupes' : 'participants'} × ${formData.nItems || 20} stimuli)`
              : 'intercept aléatoire par participant';
          const missingNote = parseFloat(formData.missingRate || 0) > 0
            ? ` Un taux d'attrition de ${Math.round(parseFloat(formData.missingRate)*100)} % a été pris en compte ; le LMM conserve les données partielles sous hypothèse MAR.`
            : '';
          return `La puissance statistique a été estimée par simulation Monte-Carlo (${result.n_sim || 50} simulations) avec un modèle mixte linéaire (MixedLM, statsmodels ; Seabold & Perktold, 2010), en utilisant un test du rapport de vraisemblance (LRT) et une structure d'effets aléatoires : ${rsLabel}. Pour un design ${nGroups} groupes × ${nLevels} mesures, avec f = ${f.toFixed(2)}, α = ${alphaTxt}, les simulations indiquent une puissance de ${pw} % avec N = ${n} participants par groupe (N total = ${n * nGroups}).${missingNote}`;
        }
        case 'correlation': {
          return `Une analyse de puissance a priori a été réalisée avec SimpleSize (simplesize.science) via la transformation z de Fisher (Cohen, 1988). Pour détecter une corrélation de Pearson r = ${r.toFixed(2)} (effet ${effectLabel(r,'r',fr)}) avec α = ${alphaTxt} et une puissance de ${pct} %, un effectif de N = ${n} participants est nécessaire.`;
        }
        case 'chi2': {
          return `Une analyse de puissance a priori a été réalisée avec SimpleSize (simplesize.science) en utilisant la distribution khi-deux non-centrale (Cohen, 1988). Pour un test du khi-deux à ${chi2df} degré(s) de liberté, avec w = ${f.toFixed(2)} (effet ${effectLabel(f,'f',fr)}), α = ${alphaTxt} et une puissance de ${pct} %, un effectif de N = ${n} participants est nécessaire.`;
        }
        case 'regression': {
          return `Une analyse de puissance a priori a été réalisée avec SimpleSize (simplesize.science) pour une régression linéaire multiple à ${nPred} prédicteur(s), en utilisant la distribution F non-centrale (Cohen, 1988). Avec une taille d'effet f² = ${f2.toFixed(2)} (effet ${effectLabel(f2,'f2',fr)}), α = ${alphaTxt} et une puissance de ${pct} %, un effectif total de N = ${n} participants est nécessaire.`;
        }
        default: return '';
      }
    } else {
      // English
      switch (selectedTest) {
        case 'ttest': {
          const d = (f * 2).toFixed(2);
          return `An a priori power analysis was conducted using SimpleSize (simplesize.science) with a non-central t distribution (Cohen, 1988; Faul et al., 2007). For a two-tailed independent-samples t-test with an expected effect size of d = ${d} (${effectLabel(f,'f',false)} effect), α = ${alphaTxt}, and desired power of ${pct}%, a sample size of N = ${n} participants per group (total N = ${n * 2}) is required.`;
        }
        case 'ttest_paired': {
          const d = (f * 2).toFixed(2);
          return `An a priori power analysis using SimpleSize (simplesize.science) indicated that for a two-tailed paired t-test with an expected effect size of d = ${d} (${effectLabel(f,'f',false)} effect), α = ${alphaTxt}, and ${pct}% power, a sample size of N = ${n} participants is required.`;
        }
        case 'anova': {
          return `An a priori power analysis was conducted using SimpleSize (simplesize.science) with a non-central F distribution (Cohen, 1988). For a one-way between-subjects ANOVA with ${nGroups} groups, effect size f = ${f.toFixed(2)} (${effectLabel(f,'f',false)} effect), α = ${alphaTxt}, and ${pct}% power, a sample size of N = ${n} per group (total N = ${n * nGroups}) is required.`;
        }
        case 'anova_rm': {
          const epsNote = eps < 1.0 ? ` A sphericity correction of ε = ${eps.toFixed(2)} (Greenhouse–Geisser) was applied.` : '';
          return `An a priori power analysis was conducted using SimpleSize (simplesize.science) following the G*Power algorithm for repeated-measures ANOVA (Faul et al., 2007). For ${nLevels} repeated measurements with f = ${f.toFixed(2)} (${effectLabel(f,'f',false)} effect), inter-measure correlation ρ = ${corr.toFixed(2)}, α = ${alphaTxt}, and ${pct}% power, a sample size of N = ${n} participants is required.${epsNote}`;
        }
        case 'anova_mixed': {
          return `An a priori power analysis using SimpleSize (simplesize.science) for the interaction effect of a mixed ANOVA (${nGroups} groups × ${nLevels} repeated measures) with f = ${f.toFixed(2)} (${effectLabel(f,'f',false)} effect), within-subject correlation ρ = ${corr.toFixed(2)}, α = ${alphaTxt}, and ${pct}% power indicated a required sample size of N = ${n} per group (total N = ${n * nGroups}).`;
        }
        case 'lmm': {
          const pw = result.estimated_power ? Math.round(result.estimated_power * 100) : pct;
          const rs = formData.randomStructure || 'intercept';
          const rsLabel = rs === 'intercept_slope'
            ? 'random intercepts and slopes per participant'
            : rs === 'crossed'
              ? `crossed random effects (participants × ${formData.nItems || 20} items/stimuli)`
              : 'random intercept per participant';
          const missingNote = parseFloat(formData.missingRate || 0) > 0
            ? ` An expected attrition rate of ${Math.round(parseFloat(formData.missingRate)*100)}% was incorporated; the LMM retains partial data under MAR assumption.`
            : '';
          return `Statistical power was estimated via Monte Carlo simulation (${result.n_sim || 50} simulations) using a linear mixed model (MixedLM, statsmodels; Seabold & Perktold, 2010) with a likelihood ratio test (LRT) and random effects structure: ${rsLabel}. For a ${nGroups}-group × ${nLevels}-measurement design with f = ${f.toFixed(2)}, α = ${alphaTxt}, simulations indicate ${pw}% power with N = ${n} participants per group (total N = ${n * nGroups}).${missingNote}`;
        }
        case 'correlation': {
          return `An a priori power analysis using SimpleSize (simplesize.science) via Fisher's z transformation (Cohen, 1988) indicated that detecting a Pearson correlation of r = ${r.toFixed(2)} (${effectLabel(r,'r',false)} effect) with α = ${alphaTxt} and ${pct}% power requires N = ${n} participants.`;
        }
        case 'chi2': {
          return `An a priori power analysis using SimpleSize (simplesize.science) with a non-central chi-square distribution (Cohen, 1988) indicated that for a chi-square test with ${chi2df} degree(s) of freedom, effect size w = ${f.toFixed(2)} (${effectLabel(f,'f',false)} effect), α = ${alphaTxt}, and ${pct}% power, N = ${n} participants are required.`;
        }
        case 'regression': {
          return `An a priori power analysis using SimpleSize (simplesize.science) for a multiple linear regression with ${nPred} predictor(s), effect size f² = ${f2.toFixed(2)} (${effectLabel(f2,'f2',false)} effect), α = ${alphaTxt}, and ${pct}% power indicated a total required sample size of N = ${n} participants (Cohen, 1988).`;
        }
        default: return '';
      }
    }
  }

  function effectLabel(val, type, isFr) {
    let small, med, large;
    if (type === 'r') { small = 0.1; med = 0.3; large = 0.5; }
    else if (type === 'f2') { small = 0.02; med = 0.15; large = 0.35; }
    else { small = 0.1; med = 0.25; large = 0.4; }
    if (isFr) {
      if (val < small) return 'très faible';
      if (val < med)   return 'faible';
      if (val < large) return 'moyen';
      return 'fort';
    } else {
      if (val < small) return 'trivial';
      if (val < med)   return 'small';
      if (val < large) return 'medium';
      return 'large';
    }
  }

  const paragraph = buildParagraph();
  if (!paragraph) return null;

  const refs = fr
    ? `\n\nRéférences : Cohen, J. (1988). Statistical Power Analysis for the Behavioral Sciences (2e éd.). Erlbaum. — Faul, F., et al. (2007). G*Power 3. Behavior Research Methods, 39(2), 175–191. https://doi.org/10.3758/BF03193146 — Seabold, S., & Perktold, J. (2010). statsmodels. Proc. 9th Python in Science Conf.`
    : `\n\nReferences: Cohen, J. (1988). Statistical Power Analysis for the Behavioral Sciences (2nd ed.). Erlbaum. — Faul, F., et al. (2007). G*Power 3. Behavior Research Methods, 39(2), 175–191. https://doi.org/10.3758/BF03193146 — Seabold, S., & Perktold, J. (2010). statsmodels. Proc. 9th Python in Science Conf.`;

  const fullText = paragraph + refs;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div style={{ marginTop: 10, background: '#f8faff', borderRadius: 12,
                  border: '1.5px solid #d0e4f7', padding: '12px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: '#1a8fa8' }}>
          {fr ? '📝 Paragraphe méthodes (APA)' : '📝 Methods paragraph (APA)'}
        </span>
        <button onClick={handleCopy} style={{
          background: copied ? '#e8fdf5' : '#fff',
          border: `1.5px solid ${copied ? '#27ae60' : '#55D1E3'}`,
          color: copied ? '#27ae60' : '#1a8fa8',
          borderRadius: 8, padding: '4px 12px', fontSize: 12,
          fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
        }}>
          {copied ? (fr ? '✓ Copié !' : '✓ Copied!') : (fr ? 'Copier' : 'Copy')}
        </button>
      </div>
      <p style={{ fontSize: 13, lineHeight: 1.7, color: '#2F344A',
                  margin: 0, fontStyle: 'italic', userSelect: 'text' }}>
        {paragraph}
      </p>
      <div style={{ fontSize: 11, color: '#9aabbc', marginTop: 8, borderTop: '1px solid #e0e7ef', paddingTop: 6 }}>
        {fr
          ? 'Le bouton "Copier" inclut le paragraphe + les références complètes.'
          : '"Copy" includes the paragraph + full references.'}
      </div>
    </div>
  );
}
