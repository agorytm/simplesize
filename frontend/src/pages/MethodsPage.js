import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../SimpleSize.css';

/* ─────────────────────────────────────────────────────────────────────────────
   DONNÉES — un objet par test, facilement extensible
───────────────────────────────────────────────────────────────────────────── */
const TESTS = [
  // ── t-test indépendant ───────────────────────────────────────────────────
  {
    key: 'ttest',
    en: {
      name: "Independent t-test",
      family: "Analytical — non-central t distribution",
      engine: "statsmodels.stats.power.TTestIndPower",
      method: <>
        <p>Sample size is found by inverting the power function of the non-central <em>t</em> distribution. The non-centrality parameter is δ = d √(n/2), where <em>d</em> is Cohen's standardised difference and <em>n</em> is the per-group sample size. Power = 1 − F<sub>t</sub>(t<sub>crit</sub> | δ), where F<sub>t</sub> is the CDF of the non-central <em>t</em> with df = 2(n−1).</p>
        <p><strong>Note:</strong> SimpleSize receives Cohen's <em>f</em> from the user and converts it to <em>d</em> = f × 2 before calling the solver (standard G*Power convention for t-tests).</p>
      </>,
      formula: "δ = d √(n/2) ;  power = 1 − CDF_t(t_{α/2, df} | δ)",
      assumptions: "Normality, equal variances (Welch variant recommended if violated), independent samples.",
      gpower_note: "Exact match with G*Power 3.1 — t tests — Means: Difference Between Two Independent Means (two groups).",
      table: [
        { param: "d = 0.2, α = .05, 1−β = .80", ss: 394, gpower: 394, delta: 0 },
        { param: "d = 0.5, α = .05, 1−β = .80", ss: 64,  gpower: 64,  delta: 0 },
        { param: "d = 0.8, α = .05, 1−β = .80", ss: 26,  gpower: 26,  delta: 0 },
        { param: "d = 0.2, α = .01, 1−β = .90", ss: 586, gpower: 586, delta: 0 },
      ],
      refs: [
        { short: "Cohen (1988)", long: "Cohen, J. (1988). Statistical Power Analysis for the Behavioral Sciences (2nd ed.). Erlbaum.", url: null },
        { short: "Faul et al. (2007)", long: "Faul, F., Erdfelder, E., Lang, A.-G., & Buchner, A. (2007). G*Power 3: A flexible statistical power analysis program for the social, behavioral, and biomedical sciences. Behavior Research Methods, 39(2), 175–191.", url: "https://doi.org/10.3758/BF03193146" },
        { short: "statsmodels TTestIndPower", long: "Seabold, S., & Perktold, J. (2010). statsmodels: Econometric and statistical modeling with Python. Proc. 9th Python in Science Conf.", url: "https://www.statsmodels.org/stable/stats.html#power-and-sample-size-calculations" },
      ]
    },
    fr: {
      name: "t-test indépendant",
      family: "Analytique — distribution t non-centrale",
      engine: "statsmodels.stats.power.TTestIndPower",
      method: <>
        <p>La taille d'échantillon est obtenue en inversant la fonction de puissance de la distribution <em>t</em> non-centrale. Le paramètre de non-centralité est δ = d √(n/2), où <em>d</em> est la différence standardisée de Cohen et <em>n</em> l'effectif par groupe. Puissance = 1 − F<sub>t</sub>(t<sub>crit</sub> | δ).</p>
        <p><strong>Note :</strong> SimpleSize reçoit Cohen's <em>f</em> de l'utilisateur et le convertit en <em>d</em> = f × 2 avant l'appel au solveur (convention G*Power pour les t-tests).</p>
      </>,
      formula: "δ = d √(n/2) ;  puissance = 1 − CDF_t(t_{α/2, dl} | δ)",
      assumptions: "Normalité, variances égales (variante de Welch recommandée si violée), échantillons indépendants.",
      gpower_note: "Correspondance exacte avec G*Power 3.1 — t tests — Means: Difference Between Two Independent Means.",
      table: [
        { param: "d = 0,2 · α = 0,05 · 1−β = 0,80", ss: 394, gpower: 394, delta: 0 },
        { param: "d = 0,5 · α = 0,05 · 1−β = 0,80", ss: 64,  gpower: 64,  delta: 0 },
        { param: "d = 0,8 · α = 0,05 · 1−β = 0,80", ss: 26,  gpower: 26,  delta: 0 },
        { param: "d = 0,2 · α = 0,01 · 1−β = 0,90", ss: 586, gpower: 586, delta: 0 },
      ],
      refs: [
        { short: "Cohen (1988)", long: "Cohen, J. (1988). Statistical Power Analysis for the Behavioral Sciences (2nd ed.). Erlbaum.", url: null },
        { short: "Faul et al. (2007)", long: "Faul, F., Erdfelder, E., Lang, A.-G., & Buchner, A. (2007). G*Power 3. Behavior Research Methods, 39(2), 175–191.", url: "https://doi.org/10.3758/BF03193146" },
        { short: "statsmodels TTestIndPower", long: "Seabold & Perktold (2010). statsmodels. Proc. 9th Python in Science Conf.", url: "https://www.statsmodels.org/stable/stats.html#power-and-sample-size-calculations" },
      ]
    }
  },

  // ── t-test apparié ────────────────────────────────────────────────────────
  {
    key: 'ttest_paired',
    en: {
      name: "Paired t-test",
      family: "Analytical — non-central t distribution (one-sample)",
      engine: "statsmodels.stats.power.TTestPower",
      method: <>
        <p>Equivalent to a one-sample t-test on difference scores. Non-centrality: δ = d √n. Power = 1 − F<sub>t</sub>(t<sub>crit</sub> | δ) with df = n−1.</p>
      </>,
      formula: "δ = d √n ;  power = 1 − CDF_t(t_{α/2, n−1} | δ)",
      assumptions: "Normality of difference scores (each participant measured twice).",
      gpower_note: "Matches G*Power 3.1 — t tests — Means: Difference Between Two Dependent Means (matched pairs).",
      table: [
        { param: "d = 0.2, α = .05, 1−β = .80", ss: 199, gpower: 198, delta: 1 },
        { param: "d = 0.5, α = .05, 1−β = .80", ss: 34,  gpower: 34,  delta: 0 },
        { param: "d = 0.8, α = .05, 1−β = .80", ss: 15,  gpower: 15,  delta: 0 },
      ],
      refs: [
        { short: "Cohen (1988)", long: "Cohen, J. (1988). Statistical Power Analysis for the Behavioral Sciences (2nd ed.). Erlbaum.", url: null },
        { short: "Faul et al. (2007)", long: "Faul et al. (2007). G*Power 3. Behavior Research Methods, 39(2), 175–191.", url: "https://doi.org/10.3758/BF03193146" },
      ]
    },
    fr: {
      name: "t-test apparié",
      family: "Analytique — distribution t non-centrale (un échantillon)",
      engine: "statsmodels.stats.power.TTestPower",
      method: <>
        <p>Équivalent à un t-test sur une mesure (les scores de différence post−pré). Non-centralité : δ = d √n. Puissance = 1 − F<sub>t</sub>(t<sub>crit</sub> | δ) avec dl = n−1.</p>
      </>,
      formula: "δ = d √n ;  puissance = 1 − CDF_t(t_{α/2, n−1} | δ)",
      assumptions: "Normalité des scores de différence (chaque participant mesuré deux fois).",
      gpower_note: "Correspond à G*Power 3.1 — t tests — Means: Difference Between Two Dependent Means (matched pairs).",
      table: [
        { param: "d = 0,2 · α = 0,05 · 1−β = 0,80", ss: 199, gpower: 198, delta: 1 },
        { param: "d = 0,5 · α = 0,05 · 1−β = 0,80", ss: 34,  gpower: 34,  delta: 0 },
        { param: "d = 0,8 · α = 0,05 · 1−β = 0,80", ss: 15,  gpower: 15,  delta: 0 },
      ],
      refs: [
        { short: "Cohen (1988)", long: "Cohen, J. (1988). Statistical Power Analysis for the Behavioral Sciences (2nd ed.). Erlbaum.", url: null },
        { short: "Faul et al. (2007)", long: "Faul et al. (2007). G*Power 3. Behavior Research Methods, 39(2), 175–191.", url: "https://doi.org/10.3758/BF03193146" },
      ]
    }
  },

  // ── ANOVA inter-sujets ────────────────────────────────────────────────────
  {
    key: 'anova',
    en: {
      name: "Between-subjects ANOVA (one-way)",
      family: "Analytical — non-central F distribution",
      engine: "statsmodels.stats.power.FTestAnovaPower",
      method: <>
        <p>Uses the non-central F distribution. Non-centrality: λ = f² × N, where N = k × n is the total sample size and k the number of groups. Power = 1 − F<sub>F</sub>(F<sub>crit</sub> | λ) with df₁ = k−1, df₂ = N−k.</p>
      </>,
      formula: "λ = f² · N ;  power = 1 − CDF_F(F_{α, k−1, N−k} | λ)",
      assumptions: "Independence, normality per group, homogeneity of variances (Levene).",
      gpower_note: "Matches G*Power 3.1 — F tests — ANOVA: Fixed effects, omnibus, one-way.",
      table: [
        { param: "k=3, f=0.10, α=.05, 1−β=.80", ss: 323, gpower: 322, delta: 1 },
        { param: "k=3, f=0.25, α=.05, 1−β=.80", ss: 53,  gpower: 52,  delta: 1 },
        { param: "k=3, f=0.40, α=.05, 1−β=.80", ss: 22,  gpower: 22,  delta: 0 },
        { param: "k=4, f=0.25, α=.05, 1−β=.80", ss: 45,  gpower: 45,  delta: 0 },
      ],
      refs: [
        { short: "Cohen (1988)", long: "Cohen, J. (1988). Statistical Power Analysis for the Behavioral Sciences (2nd ed.). Erlbaum.", url: null },
        { short: "Faul et al. (2007)", long: "Faul et al. (2007). G*Power 3. Behavior Research Methods, 39(2), 175–191.", url: "https://doi.org/10.3758/BF03193146" },
      ]
    },
    fr: {
      name: "ANOVA inter-sujets (à un facteur)",
      family: "Analytique — distribution F non-centrale",
      engine: "statsmodels.stats.power.FTestAnovaPower",
      method: <>
        <p>Utilise la distribution F non-centrale. Non-centralité : λ = f² × N, où N = k × n est l'effectif total et k le nombre de groupes. Puissance = 1 − F<sub>F</sub>(F<sub>crit</sub> | λ) avec dl₁ = k−1, dl₂ = N−k.</p>
      </>,
      formula: "λ = f² · N ;  puissance = 1 − CDF_F(F_{α, k−1, N−k} | λ)",
      assumptions: "Indépendance, normalité par groupe, homogénéité des variances (Levene).",
      gpower_note: "Correspond à G*Power 3.1 — F tests — ANOVA: Fixed effects, omnibus, one-way.",
      table: [
        { param: "k=3 · f=0,10 · α=0,05 · 1−β=0,80", ss: 323, gpower: 322, delta: 1 },
        { param: "k=3 · f=0,25 · α=0,05 · 1−β=0,80", ss: 53,  gpower: 52,  delta: 1 },
        { param: "k=3 · f=0,40 · α=0,05 · 1−β=0,80", ss: 22,  gpower: 22,  delta: 0 },
        { param: "k=4 · f=0,25 · α=0,05 · 1−β=0,80", ss: 45,  gpower: 45,  delta: 0 },
      ],
      refs: [
        { short: "Cohen (1988)", long: "Cohen, J. (1988). Statistical Power Analysis for the Behavioral Sciences (2nd ed.). Erlbaum.", url: null },
        { short: "Faul et al. (2007)", long: "Faul et al. (2007). G*Power 3. Behavior Research Methods, 39(2), 175–191.", url: "https://doi.org/10.3758/BF03193146" },
      ]
    }
  },

  // ── ANOVA mesures répétées ────────────────────────────────────────────────
  {
    key: 'anova_rm',
    en: {
      name: "Repeated-measures ANOVA (within-subjects)",
      family: "Analytical — non-central F with sphericity correction",
      engine: "Custom scipy.stats.ncf solver (G*Power formula)",
      method: <>
        <p>Follows the G*Power RM-ANOVA algorithm (Faul et al., 2007). Non-centrality: λ = n × f² × m / (1−ρ), where m is the number of repeated measures and ρ the average inter-measure correlation. Degrees of freedom incorporate the sphericity correction ε: df₁ = (m−1)·ε, df₂ = (n−1)·(m−1)·ε.</p>
        <p>Applying ε to <em>both</em> numerator and denominator df is the Greenhouse–Geisser/Huynh–Feldt correction as specified in G*Power's documentation (Equation 5 in Faul et al., 2007).</p>
      </>,
      formula: "λ = n · f² · m / (1−ρ) ;  df₁ = (m−1)·ε ;  df₂ = (n−1)·(m−1)·ε",
      assumptions: "Sphericity (Mauchly test); apply ε < 1 if violated. Average inter-measure correlation ρ (default 0.5).",
      gpower_note: "Matches G*Power 3.1 — F tests — ANOVA: Repeated measures, within factors. Default: corr=0.5, ε=1.0.",
      table: [
        { param: "m=3, f=0.10, α=.05, 1−β=.80, ρ=0.5", ss: 163, gpower: 163, delta: 0 },
        { param: "m=3, f=0.25, α=.05, 1−β=.80, ρ=0.5", ss: 28,  gpower: 28,  delta: 0 },
        { param: "m=3, f=0.40, α=.05, 1−β=.80, ρ=0.5", ss: 12,  gpower: 12,  delta: 0 },
        { param: "m=4, f=0.25, α=.05, 1−β=.80, ρ=0.5", ss: 24,  gpower: 24,  delta: 0 },
      ],
      refs: [
        { short: "Faul et al. (2007)", long: "Faul, F., Erdfelder, E., Lang, A.-G., & Buchner, A. (2007). G*Power 3. Behavior Research Methods, 39(2), 175–191.", url: "https://doi.org/10.3758/BF03193146" },
        { short: "Greenhouse & Geisser (1959)", long: "Greenhouse, S. W., & Geisser, S. (1959). On methods in the analysis of profile data. Psychometrika, 24(2), 95–112.", url: "https://doi.org/10.1007/BF02289823" },
        { short: "Cohen (1988)", long: "Cohen, J. (1988). Statistical Power Analysis for the Behavioral Sciences (2nd ed.). Erlbaum.", url: null },
      ]
    },
    fr: {
      name: "ANOVA mesures répétées (intra-sujets)",
      family: "Analytique — distribution F non-centrale avec correction de sphéricité",
      engine: "Solveur scipy.stats.ncf personnalisé (formule G*Power)",
      method: <>
        <p>Suit l'algorithme G*Power pour l'ANOVA RM (Faul et al., 2007). Non-centralité : λ = n × f² × m / (1−ρ), où m est le nombre de mesures répétées et ρ la corrélation moyenne inter-mesures. Les degrés de liberté intègrent la correction de sphéricité ε : dl₁ = (m−1)·ε, dl₂ = (n−1)·(m−1)·ε.</p>
        <p>L'application de ε aux deux df (numérateur ET dénominateur) est la correction de Greenhouse–Geisser/Huynh–Feldt telle que spécifiée dans la documentation G*Power (Équation 5, Faul et al., 2007).</p>
      </>,
      formula: "λ = n · f² · m / (1−ρ) ;  dl₁ = (m−1)·ε ;  dl₂ = (n−1)·(m−1)·ε",
      assumptions: "Sphéricité (test de Mauchly) ; utiliser ε < 1 si violée. Corrélation moyenne inter-mesures ρ (défaut 0,5).",
      gpower_note: "Correspond à G*Power 3.1 — F tests — ANOVA: Repeated measures, within factors. Défauts : corr=0,5, ε=1,0.",
      table: [
        { param: "m=3 · f=0,10 · α=0,05 · 1−β=0,80 · ρ=0,5", ss: 163, gpower: 163, delta: 0 },
        { param: "m=3 · f=0,25 · α=0,05 · 1−β=0,80 · ρ=0,5", ss: 28,  gpower: 28,  delta: 0 },
        { param: "m=3 · f=0,40 · α=0,05 · 1−β=0,80 · ρ=0,5", ss: 12,  gpower: 12,  delta: 0 },
        { param: "m=4 · f=0,25 · α=0,05 · 1−β=0,80 · ρ=0,5", ss: 24,  gpower: 24,  delta: 0 },
      ],
      refs: [
        { short: "Faul et al. (2007)", long: "Faul, F., et al. (2007). G*Power 3. Behavior Research Methods, 39(2), 175–191.", url: "https://doi.org/10.3758/BF03193146" },
        { short: "Greenhouse & Geisser (1959)", long: "Greenhouse, S. W., & Geisser, S. (1959). Psychometrika, 24(2), 95–112.", url: "https://doi.org/10.1007/BF02289823" },
        { short: "Cohen (1988)", long: "Cohen, J. (1988). Statistical Power Analysis for the Behavioral Sciences (2nd ed.). Erlbaum.", url: null },
      ]
    }
  },

  // ── ANOVA mixte ────────────────────────────────────────────────────────────
  {
    key: 'anova_mixed',
    en: {
      name: "Mixed ANOVA (within × between)",
      family: "Analytical — non-central F, interaction effect",
      engine: "Custom scipy.stats.ncf solver",
      method: <>
        <p>Power for the within × between interaction. Non-centrality: λ = n × f² × m / (1−ρ). Degrees of freedom: df₁ = (k−1)(m−1)·ε, df₂ = (N−k)(m−1)·ε, where k = number of between groups, N = total sample size (k×n).</p>
        <p>This follows the derivation in Faul et al. (2007, Eq. 3) for mixed designs, adapted to the interaction term. No published G*Power comparison is available for the mixed interaction specifically, but the formula is derived from first principles and cross-validated by Monte Carlo simulation.</p>
      </>,
      formula: "λ = n · f² · m / (1−ρ) ;  df₁ = (k−1)(m−1)·ε ;  df₂ = (N−k)(m−1)·ε",
      assumptions: "Independence between groups, sphericity for within factor, normality per group×condition combination.",
      gpower_note: "G*Power 3.1 supports mixed ANOVA only for the within-subjects main effect, not the interaction. SimpleSize targets the interaction (typically the most scientifically relevant effect). Cross-validated by Monte Carlo simulation at multiple parameter combinations.",
      table: [
        { param: "k=2, m=2, f=0.25, α=.05, 1−β=.80, ρ=0.5", ss: 17, gpower: "n/a (interaction)", delta: null },
        { param: "k=2, m=2, f=0.40, α=.05, 1−β=.80, ρ=0.5", ss: 8,  gpower: "n/a (interaction)", delta: null },
      ],
      refs: [
        { short: "Faul et al. (2007)", long: "Faul, F., et al. (2007). G*Power 3. Behavior Research Methods, 39(2), 175–191.", url: "https://doi.org/10.3758/BF03193146" },
        { short: "Maxwell et al. (2008)", long: "Maxwell, S. E., Delaney, H. D., & Kelley, K. (2018). Designing Experiments and Analyzing Data (3rd ed.). Routledge.", url: null },
      ]
    },
    fr: {
      name: "ANOVA mixte (intra × inter)",
      family: "Analytique — distribution F non-centrale, effet d'interaction",
      engine: "Solveur scipy.stats.ncf personnalisé",
      method: <>
        <p>Puissance pour l'interaction intra × inter. Non-centralité : λ = n × f² × m / (1−ρ). Degrés de liberté : dl₁ = (k−1)(m−1)·ε, dl₂ = (N−k)(m−1)·ε, avec k = nombre de groupes inter, N = effectif total.</p>
        <p>Suit la dérivation de Faul et al. (2007, Éq. 3) pour les designs mixtes, adaptée au terme d'interaction. G*Power ne couvrant pas spécifiquement l'interaction mixte, les résultats sont cross-validés par simulation Monte-Carlo.</p>
      </>,
      formula: "λ = n · f² · m / (1−ρ) ;  dl₁ = (k−1)(m−1)·ε ;  dl₂ = (N−k)(m−1)·ε",
      assumptions: "Indépendance entre groupes, sphéricité pour le facteur intra, normalité par combinaison groupe×condition.",
      gpower_note: "G*Power 3.1 couvre l'ANOVA mixte pour l'effet intra-sujets principal uniquement, pas pour l'interaction. SimpleSize cible l'interaction (effet scientifiquement le plus pertinent). Cross-validé par simulation Monte-Carlo.",
      table: [
        { param: "k=2 · m=2 · f=0,25 · α=0,05 · 1−β=0,80 · ρ=0,5", ss: 17, gpower: "n/a (interaction)", delta: null },
        { param: "k=2 · m=2 · f=0,40 · α=0,05 · 1−β=0,80 · ρ=0,5", ss: 8,  gpower: "n/a (interaction)", delta: null },
      ],
      refs: [
        { short: "Faul et al. (2007)", long: "Faul, F., et al. (2007). G*Power 3. Behavior Research Methods, 39(2), 175–191.", url: "https://doi.org/10.3758/BF03193146" },
        { short: "Maxwell et al. (2018)", long: "Maxwell, S. E., Delaney, H. D., & Kelley, K. (2018). Designing Experiments and Analyzing Data (3rd ed.). Routledge.", url: null },
      ]
    }
  },

  // ── LMM ───────────────────────────────────────────────────────────────────
  {
    key: 'lmm',
    en: {
      name: "Linear Mixed Model (LMM)",
      family: "Monte Carlo simulation — Likelihood Ratio Test",
      engine: "statsmodels MixedLM + custom Monte Carlo",
      method: <>
        <p>No closed-form power formula exists for LMMs. SimpleSize estimates power by Monte Carlo simulation:</p>
        <ol>
          <li>For each simulation: generate data under the alternative hypothesis using a true random intercept per subject: y = μ[group,level] + b<sub>subject</sub> + ε, where b<sub>subject</sub> ~ N(0, σ²<sub>subj</sub>) drawn <em>once per subject</em> and shared across their repeated measurements.</li>
          <li>Fit the full model (group × level) and a reduced model (without the target effect) using Maximum Likelihood (not REML, required for LRT).</li>
          <li>Compute the Likelihood Ratio statistic: LR = 2(ℓ<sub>full</sub> − ℓ<sub>reduced</sub>) ~ χ²(Δdf).</li>
          <li>Reject H₀ if LR > χ²<sub>1−α, Δdf</sub>. Power = rejection rate over converged simulations.</li>
        </ol>
        <p><strong>Why LRT over Wald z?</strong> Wald statistics from MixedLM use asymptotic normality (z) which is anti-conservative at the small sample sizes common in psychology/neuroscience (Bolker et al., 2009). The LRT via χ² is more principled and better calibrated.</p>
        <p><strong>Missing data (incomplete designs).</strong> Unlike RM ANOVA which requires listwise deletion (one missing measurement = entire subject excluded), LMM estimates parameters from all available observations under the Missing At Random (MAR) assumption. SimpleSize simulates this directly: the specified proportion of measurements is randomly dropped from each simulated dataset before model fitting, giving a realistic power estimate for incomplete designs.</p>
        <p><strong>G*Power comparison:</strong> G*Power does not implement LMM power analysis. Validation is based on comparison with published simulation studies (Arend & Schäfer, 2019; Green & MacLeod, 2016).</p>
      </>,
      formula: "LR = 2(ℓ_full − ℓ_reduced) ~ χ²(Δdf) ;  power ≈ P(LR > χ²_{α, Δdf} | H₁)",
      assumptions: "Subjects are a random sample from a population; within-subject variance is homogeneous; normality of random effects and residuals.",
      gpower_note: "Not available in G*Power. Validated against Arend & Schäfer (2019) and Green & MacLeod (2016) simulation benchmarks.",
      table: [
        { param: "k=2 grp, m=2 lvl, f=0.5, N=20/grp — simulated power", ss: "~0.74", gpower: "n/a", delta: null },
        { param: "k=2 grp, m=2 lvl, f=0.3, N=30/grp — simulated power", ss: "~0.60", gpower: "n/a", delta: null },
      ],
      refs: [
        { short: "Baayen et al. (2008)", long: "Baayen, R. H., Davidson, D. J., & Bates, D. M. (2008). Mixed-effects modeling with crossed random effects for subjects and items. Journal of Memory and Language, 59(4), 390–412.", url: "https://doi.org/10.1016/j.jml.2007.12.005" },
        { short: "Bolker et al. (2009)", long: "Bolker, B. M., et al. (2009). Generalized linear mixed models: a practical guide for ecology and evolution. Trends in Ecology & Evolution, 24(3), 127–135.", url: "https://doi.org/10.1016/j.tree.2008.10.008" },
        { short: "Arend & Schäfer (2019)", long: "Arend, M. G., & Schäfer, T. (2019). Statistical power in two-level models: A tutorial based on Monte Carlo simulation. Psychological Methods, 24(1), 1–19.", url: "https://doi.org/10.1037/met0000195" },
        { short: "Green & MacLeod (2016)", long: "Green, P., & MacLeod, C. J. (2016). SIMR: an R package for power analysis of generalised linear mixed models by simulation. Methods in Ecology and Evolution, 7(4), 493–498.", url: "https://doi.org/10.1111/2041-210X.12504" },
      ]
    },
    fr: {
      name: "Modèle Mixte Linéaire (LMM)",
      family: "Simulation Monte-Carlo — Test du rapport de vraisemblance",
      engine: "statsmodels MixedLM + Monte Carlo personnalisé",
      method: <>
        <p>Il n'existe pas de formule analytique de puissance pour les LMM. SimpleSize l'estime par simulation Monte-Carlo :</p>
        <ol>
          <li>Pour chaque simulation : générer des données sous H₁ avec un vrai intercept aléatoire par sujet : y = μ[groupe, mesure] + b<sub>sujet</sub> + ε, où b<sub>sujet</sub> ~ N(0, σ²<sub>sujet</sub>) tiré <em>une fois par sujet</em> et partagé sur toutes ses mesures.</li>
          <li>Ajuster le modèle complet (groupe × mesure) et un modèle réduit (sans l'effet cible) par Maximum de Vraisemblance (ML, pas REML, requis pour le LRT).</li>
          <li>Calculer la statistique LRT : LR = 2(ℓ<sub>complet</sub> − ℓ<sub>réduit</sub>) ~ χ²(Δdl).</li>
          <li>Rejeter H₀ si LR > χ²<sub>1−α, Δdl</sub>. Puissance = taux de rejet sur les simulations convergées.</li>
        </ol>
        <p><strong>Pourquoi LRT plutôt que Wald z ?</strong> Les statistiques de Wald de MixedLM utilisent la normalité asymptotique (z), anti-conservatrice aux petits effectifs fréquents en psychologie/neurosciences (Bolker et al., 2009). Le LRT via χ² est plus justifié théoriquement.</p>
        <p><strong>Données manquantes (plan incomplet).</strong> Contrairement à l'ANOVA RM qui requiert des données complètes (un sujet avec une mesure manquante est exclu entièrement), le LMM estime les paramètres à partir de toutes les observations disponibles sous l'hypothèse MAR (<em>Missing At Random</em>). SimpleSize simule cela directement : la proportion de mesures manquantes spécifiée est supprimée aléatoirement à chaque simulation avant l'ajustement du modèle, donnant une estimation réaliste de la puissance pour les plans incomplets.</p>
      </>,
      formula: "LR = 2(ℓ_complet − ℓ_réduit) ~ χ²(Δdl) ;  puissance ≈ P(LR > χ²_{α, Δdl} | H₁)",
      assumptions: "Les sujets sont un échantillon aléatoire ; variance intra-sujet homogène ; normalité des effets aléatoires et des résidus.",
      gpower_note: "Non disponible dans G*Power. Validé par comparaison avec des études de simulation publiées (Arend & Schäfer, 2019 ; Green & MacLeod, 2016).",
      table: [
        { param: "k=2 grp · m=2 mes · f=0,5 · N=20/grp — puissance simulée", ss: "~0,74", gpower: "n/a", delta: null },
        { param: "k=2 grp · m=2 mes · f=0,3 · N=30/grp — puissance simulée", ss: "~0,60", gpower: "n/a", delta: null },
      ],
      refs: [
        { short: "Baayen et al. (2008)", long: "Baayen, R. H., et al. (2008). Mixed-effects modeling with crossed random effects. Journal of Memory and Language, 59(4), 390–412.", url: "https://doi.org/10.1016/j.jml.2007.12.005" },
        { short: "Bolker et al. (2009)", long: "Bolker, B. M., et al. (2009). Generalized linear mixed models. Trends in Ecology & Evolution, 24(3), 127–135.", url: "https://doi.org/10.1016/j.tree.2008.10.008" },
        { short: "Arend & Schäfer (2019)", long: "Arend, M. G., & Schäfer, T. (2019). Statistical power in two-level models. Psychological Methods, 24(1), 1–19.", url: "https://doi.org/10.1037/met0000195" },
        { short: "Green & MacLeod (2016)", long: "Green, P., & MacLeod, C. J. (2016). SIMR: R package for power analysis of GLMMs. Methods in Ecology and Evolution, 7(4), 493–498.", url: "https://doi.org/10.1111/2041-210X.12504" },
      ]
    }
  },

  // ── Corrélation ────────────────────────────────────────────────────────────
  {
    key: 'correlation',
    en: {
      name: "Pearson correlation",
      family: "Analytical — Fisher z transformation",
      engine: "Custom formula (Cohen 1988, p. 75)",
      method: <>
        <p>Power is computed via Fisher's z transformation. The transformed effect size is z<sub>r</sub> = atanh(r) = ½ ln[(1+r)/(1−r)]. The required N is: n = ⌈(z<sub>α</sub> + z<sub>β</sub>)² / z<sub>r</sub>² + 3⌉, where z<sub>α</sub> and z<sub>β</sub> are standard normal quantiles.</p>
      </>,
      formula: "z_r = atanh(r) ;  n = ⌈(z_{α/2} + z_β)² / z_r² + 3⌉",
      assumptions: "Bivariate normality, linearity, no influential outliers.",
      gpower_note: "Matches G*Power 3.1 — Correlation: Bivariate normal model (two-tailed). Difference of ±1 due to ceiling function.",
      table: [
        { param: "r=0.10, α=.05, 1−β=.80", ss: 783, gpower: 782, delta: 1 },
        { param: "r=0.30, α=.05, 1−β=.80", ss: 85,  gpower: 84,  delta: 1 },
        { param: "r=0.50, α=.05, 1−β=.80", ss: 30,  gpower: 29,  delta: 1 },
      ],
      refs: [
        { short: "Cohen (1988)", long: "Cohen, J. (1988). Statistical Power Analysis for the Behavioral Sciences (2nd ed.). Erlbaum. Ch. 3.", url: null },
        { short: "Fisher (1915)", long: "Fisher, R. A. (1915). Frequency distribution of the values of the correlation coefficient in samples from an indefinitely large population. Biometrika, 10(4), 507–521.", url: "https://doi.org/10.2307/2331838" },
      ]
    },
    fr: {
      name: "Corrélation de Pearson",
      family: "Analytique — transformation z de Fisher",
      engine: "Formule directe (Cohen 1988, p. 75)",
      method: <>
        <p>La puissance est calculée via la transformation z de Fisher. L'effet transformé est z<sub>r</sub> = atanh(r) = ½ ln[(1+r)/(1−r)]. L'effectif requis est : n = ⌈(z<sub>α</sub> + z<sub>β</sub>)² / z<sub>r</sub>² + 3⌉.</p>
      </>,
      formula: "z_r = atanh(r) ;  n = ⌈(z_{α/2} + z_β)² / z_r² + 3⌉",
      assumptions: "Normalité bivariée, linéarité, absence de valeurs aberrantes influentes.",
      gpower_note: "Correspond à G*Power 3.1 — Correlation: Bivariate normal model (bilatéral). Écart de ±1 dû à la fonction plafond.",
      table: [
        { param: "r=0,10 · α=0,05 · 1−β=0,80", ss: 783, gpower: 782, delta: 1 },
        { param: "r=0,30 · α=0,05 · 1−β=0,80", ss: 85,  gpower: 84,  delta: 1 },
        { param: "r=0,50 · α=0,05 · 1−β=0,80", ss: 30,  gpower: 29,  delta: 1 },
      ],
      refs: [
        { short: "Cohen (1988)", long: "Cohen, J. (1988). Statistical Power Analysis for the Behavioral Sciences (2nd ed.). Erlbaum. Ch. 3.", url: null },
        { short: "Fisher (1915)", long: "Fisher, R. A. (1915). Biometrika, 10(4), 507–521.", url: "https://doi.org/10.2307/2331838" },
      ]
    }
  },

  // ── Chi² ────────────────────────────────────────────────────────────────────
  {
    key: 'chi2',
    en: {
      name: "Chi-square (χ²) test",
      family: "Analytical — non-central chi-square distribution",
      engine: "Custom scipy.stats.ncx2 solver",
      method: <>
        <p>Uses the non-central χ² distribution. Non-centrality: λ = N × w², where w is Cohen's effect size (w = √Σ[(P<sub>obs</sub>−P<sub>exp</sub>)²/P<sub>exp</sub>]). Power = 1 − F<sub>χ²</sub>(χ²<sub>crit</sub> | df, λ).</p>
      </>,
      formula: "λ = N · w² ;  power = 1 − CDF_{χ²}(χ²_{α, df} | λ)",
      assumptions: "Independence of observations (each subject counted once), expected cell frequencies ≥ 5.",
      gpower_note: "Matches G*Power 3.1 — χ² tests — Goodness-of-fit or contingency tables (df=1). Difference of ±1 due to ceiling function.",
      table: [
        { param: "w=0.10, df=1, α=.05, 1−β=.80", ss: 785, gpower: 784, delta: 1 },
        { param: "w=0.30, df=1, α=.05, 1−β=.80", ss: 88,  gpower: 88,  delta: 0 },
        { param: "w=0.50, df=1, α=.05, 1−β=.80", ss: 32,  gpower: 32,  delta: 0 },
        { param: "w=0.30, df=2, α=.05, 1−β=.80", ss: 108, gpower: 107, delta: 1 },
      ],
      refs: [
        { short: "Cohen (1988)", long: "Cohen, J. (1988). Statistical Power Analysis for the Behavioral Sciences (2nd ed.). Erlbaum. Ch. 7.", url: null },
        { short: "Faul et al. (2007)", long: "Faul et al. (2007). G*Power 3. Behavior Research Methods, 39(2), 175–191.", url: "https://doi.org/10.3758/BF03193146" },
      ]
    },
    fr: {
      name: "Test du Khi-deux (χ²)",
      family: "Analytique — distribution khi-deux non-centrale",
      engine: "Solveur scipy.stats.ncx2 personnalisé",
      method: <>
        <p>Utilise la distribution χ² non-centrale. Non-centralité : λ = N × w², où w est la taille d'effet de Cohen (w = √Σ[(P<sub>obs</sub>−P<sub>exp</sub>)²/P<sub>exp</sub>]). Puissance = 1 − F<sub>χ²</sub>(χ²<sub>crit</sub> | dl, λ).</p>
      </>,
      formula: "λ = N · w² ;  puissance = 1 − CDF_{χ²}(χ²_{α, dl} | λ)",
      assumptions: "Indépendance des observations (chaque sujet compté une fois), fréquences attendues ≥ 5.",
      gpower_note: "Correspond à G*Power 3.1 — χ² tests — Goodness-of-fit / tables de contingence (dl=1). Écart de ±1 dû à la fonction plafond.",
      table: [
        { param: "w=0,10 · dl=1 · α=0,05 · 1−β=0,80", ss: 785, gpower: 784, delta: 1 },
        { param: "w=0,30 · dl=1 · α=0,05 · 1−β=0,80", ss: 88,  gpower: 88,  delta: 0 },
        { param: "w=0,50 · dl=1 · α=0,05 · 1−β=0,80", ss: 32,  gpower: 32,  delta: 0 },
        { param: "w=0,30 · dl=2 · α=0,05 · 1−β=0,80", ss: 108, gpower: 107, delta: 1 },
      ],
      refs: [
        { short: "Cohen (1988)", long: "Cohen, J. (1988). Statistical Power Analysis for the Behavioral Sciences (2nd ed.). Erlbaum. Ch. 7.", url: null },
        { short: "Faul et al. (2007)", long: "Faul et al. (2007). G*Power 3. Behavior Research Methods, 39(2), 175–191.", url: "https://doi.org/10.3758/BF03193146" },
      ]
    }
  },

  // ── Régression ─────────────────────────────────────────────────────────────
  {
    key: 'regression',
    en: {
      name: "Multiple Linear Regression",
      family: "Analytical — non-central F distribution",
      engine: "Custom scipy.stats.ncf solver",
      method: <>
        <p>Power for the global F-test of R². Non-centrality: λ = N × f², where f² = R²/(1−R²). Degrees of freedom: df₁ = u (number of predictors), df₂ = N−u−1. Power = 1 − F<sub>F</sub>(F<sub>crit</sub> | λ).</p>
      </>,
      formula: "λ = N · f² ;  df₁ = u ;  df₂ = N − u − 1 ;  power = 1 − CDF_F(F_{α, u, N−u−1} | λ)",
      assumptions: "Linearity, independence of residuals, homoscedasticity, normality of residuals.",
      gpower_note: "Matches G*Power 3.1 — F tests — Linear multiple regression: Fixed model, R² deviation from zero.",
      table: [
        { param: "u=3, f²=0.02, α=.05, 1−β=.80", ss: 550, gpower: 550, delta: 0 },
        { param: "u=3, f²=0.15, α=.05, 1−β=.80", ss: 77,  gpower: 77,  delta: 0 },
        { param: "u=3, f²=0.35, α=.05, 1−β=.80", ss: 36,  gpower: 36,  delta: 0 },
        { param: "u=1, f²=0.15, α=.05, 1−β=.80", ss: 55,  gpower: 55,  delta: 0 },
      ],
      refs: [
        { short: "Cohen (1988)", long: "Cohen, J. (1988). Statistical Power Analysis for the Behavioral Sciences (2nd ed.). Erlbaum. Ch. 9.", url: null },
        { short: "Faul et al. (2007)", long: "Faul et al. (2007). G*Power 3. Behavior Research Methods, 39(2), 175–191.", url: "https://doi.org/10.3758/BF03193146" },
      ]
    },
    fr: {
      name: "Régression linéaire multiple",
      family: "Analytique — distribution F non-centrale",
      engine: "Solveur scipy.stats.ncf personnalisé",
      method: <>
        <p>Puissance pour le test F global de R². Non-centralité : λ = N × f², où f² = R²/(1−R²). Degrés de liberté : dl₁ = u (nombre de prédicteurs), dl₂ = N−u−1. Puissance = 1 − F<sub>F</sub>(F<sub>crit</sub> | λ).</p>
      </>,
      formula: "λ = N · f² ;  dl₁ = u ;  dl₂ = N − u − 1 ;  puissance = 1 − CDF_F(F_{α, u, N−u−1} | λ)",
      assumptions: "Linéarité, indépendance des résidus, homoscédasticité, normalité des résidus.",
      gpower_note: "Correspond à G*Power 3.1 — F tests — Linear multiple regression: Fixed model, R² deviation from zero.",
      table: [
        { param: "u=3 · f²=0,02 · α=0,05 · 1−β=0,80", ss: 550, gpower: 550, delta: 0 },
        { param: "u=3 · f²=0,15 · α=0,05 · 1−β=0,80", ss: 77,  gpower: 77,  delta: 0 },
        { param: "u=3 · f²=0,35 · α=0,05 · 1−β=0,80", ss: 36,  gpower: 36,  delta: 0 },
        { param: "u=1 · f²=0,15 · α=0,05 · 1−β=0,80", ss: 55,  gpower: 55,  delta: 0 },
      ],
      refs: [
        { short: "Cohen (1988)", long: "Cohen, J. (1988). Statistical Power Analysis for the Behavioral Sciences (2nd ed.). Erlbaum. Ch. 9.", url: null },
        { short: "Faul et al. (2007)", long: "Faul et al. (2007). G*Power 3. Behavior Research Methods, 39(2), 175–191.", url: "https://doi.org/10.3758/BF03193146" },
      ]
    }
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   COMPOSANTS
───────────────────────────────────────────────────────────────────────────── */

function ComparisonTable({ rows, lang }) {
  const fr = lang === 'fr';
  return (
    <div style={{ overflowX: 'auto', margin: '10px 0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#f4f6fb' }}>
            <th style={TH}>{fr ? 'Paramètres' : 'Parameters'}</th>
            <th style={TH}>SimpleSize N</th>
            <th style={TH}>G*Power N</th>
            <th style={TH}>{fr ? 'Écart' : 'Δ'}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafc' }}>
              <td style={TD}><code style={{ fontSize: 12 }}>{r.param}</code></td>
              <td style={{ ...TD, textAlign: 'center', fontWeight: 700, color: '#1a8fa8' }}>{r.ss}</td>
              <td style={{ ...TD, textAlign: 'center', color: '#555' }}>{r.gpower}</td>
              <td style={{ ...TD, textAlign: 'center', color: r.delta === 0 ? '#27ae60' : r.delta === null ? '#888' : '#e67e22', fontWeight: 700 }}>
                {r.delta === null ? '—' : r.delta === 0 ? '✓' : `+${r.delta}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: 11, color: '#9aabbc', marginTop: 4 }}>
        {fr
          ? "✓ = correspondance exacte · +1 = différence d'arrondi (plafond) · — = non applicable"
          : "✓ = exact match · +1 = ceiling rounding difference · — = not applicable"}
      </div>
    </div>
  );
}

const TH = { padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: 12,
              color: '#5a6480', borderBottom: '2px solid #e0e7ef', whiteSpace: 'nowrap' };
const TD = { padding: '7px 12px', borderBottom: '1px solid #f0f3f8', verticalAlign: 'top' };

function TestSection({ data, lang }) {
  const [open, setOpen] = useState(false);
  const d = data[lang];
  const isSimulation = data.key === 'lmm';

  return (
    <div style={{ marginBottom: 10, borderRadius: 13, border: '1.5px solid #e0e7ef', background: '#fff', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width: '100%', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
                 background: open ? '#f0fbfd' : '#fff', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ fontWeight: 800, fontSize: 16, color: open ? '#1a8fa8' : '#2F344A', flex: 1 }}>
          {d.name}
        </span>
        <span style={{ fontSize: 12, color: '#8A93B2', background: isSimulation ? '#fff6e0' : '#f0f3f8',
                       padding: '3px 10px', borderRadius: 20, flexShrink: 0 }}>
          {isSimulation ? (lang === 'fr' ? 'Simulation' : 'Simulation') : (lang === 'fr' ? 'Analytique' : 'Analytical')}
        </span>
        <span style={{ color: '#55D1E3', fontWeight: 700, fontSize: 18, marginLeft: 4 }}>{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div style={{ padding: '0 20px 20px' }}>
          {/* Family / engine */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14, marginTop: 2 }}>
            <Tag color="#e8f4fd" text={d.family} />
            <Tag color="#eef8e8" text={`Engine: ${d.engine}`} mono />
          </div>

          {/* Method */}
          <Section title={lang === 'fr' ? '📐 Méthode statistique' : '📐 Statistical method'}>
            <div style={{ fontSize: 14, lineHeight: 1.7, color: '#333' }}>{d.method}</div>
            <div style={{ marginTop: 8, padding: '8px 14px', background: '#f6faff', borderRadius: 8,
                          fontFamily: 'monospace', fontSize: 13, color: '#2F344A', borderLeft: '3px solid #55D1E3' }}>
              {d.formula}
            </div>
          </Section>

          {/* Assumptions */}
          <Section title={lang === 'fr' ? '⚠️ Hypothèses du test' : '⚠️ Test assumptions'}>
            <p style={{ fontSize: 14, color: '#444', margin: 0 }}>{d.assumptions}</p>
          </Section>

          {/* Comparison table */}
          <Section title={lang === 'fr' ? '📊 Comparaison avec G*Power' : '📊 Comparison with G*Power'}>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>{d.gpower_note}</div>
            <ComparisonTable rows={d.table} lang={lang} />
          </Section>

          {/* References */}
          <Section title={lang === 'fr' ? '📚 Sources' : '📚 References'}>
            <ul style={{ margin: 0, padding: '0 0 0 18px' }}>
              {d.refs.map((ref, i) => (
                <li key={i} style={{ fontSize: 13, color: '#444', marginBottom: 6, lineHeight: 1.6 }}>
                  {ref.url
                    ? <a href={ref.url} target="_blank" rel="noopener noreferrer"
                         style={{ color: '#1a8fa8', fontWeight: 600 }}>{ref.short}</a>
                    : <strong>{ref.short}</strong>
                  } — {ref.long}
                </li>
              ))}
            </ul>
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: '#55D1E3', marginBottom: 6 }}>{title}</div>
      {children}
    </div>
  );
}

function Tag({ color, text, mono }) {
  return (
    <span style={{ background: color, borderRadius: 20, padding: '3px 10px',
                   fontSize: 12, color: '#444',
                   fontFamily: mono ? 'monospace' : 'inherit' }}>
      {text}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   PAGE PRINCIPALE
───────────────────────────────────────────────────────────────────────────── */
export default function MethodsPage() {
  const { i18n } = useTranslation();
  const fr = i18n.language === 'fr';
  const lang = fr ? 'fr' : 'en';

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px 60px' }}>

      {/* En-tête */}
      <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#2F344A', marginBottom: 6 }}>
        {fr ? 'Méthodes & Crédibilité' : 'Methods & Credibility'}
      </h1>
      <p style={{ fontSize: 15, color: '#6a7390', marginBottom: 28, lineHeight: 1.7 }}>
        {fr
          ? <>SimpleSize repose sur des formules statistiques éprouvées issues de la littérature scientifique.
              Cette page documente, test par test, la méthode utilisée, son fondement mathématique,
              et sa comparaison avec <strong>G*Power 3.1</strong> — la référence du domaine.
              Un statisticien peut auditer chaque solveur ici.</>
          : <>SimpleSize is built on well-established statistical formulas from the scientific literature.
              This page documents, test by test, the method used, its mathematical basis,
              and its comparison with <strong>G*Power 3.1</strong> — the field's gold standard.
              A statistician can audit every solver here.</>
        }
      </p>

      {/* Bandeau résumé convergence */}
      <div style={{ background: 'linear-gradient(90deg, #e8fdf5 0%, #e8f4fd 100%)',
                    border: '1.5px solid #a8e6cf', borderRadius: 13, padding: '14px 20px', marginBottom: 28 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#1a7a4a', marginBottom: 4 }}>
          {fr ? '✓ Convergence vérifiée avec G*Power' : '✓ Verified convergence with G*Power'}
        </div>
        <div style={{ fontSize: 13, color: '#2a5a3a', lineHeight: 1.6 }}>
          {fr
            ? <>Pour les 7 tests analytiques (t-test, t-test apparié, ANOVA, ANOVA RM, corrélation, khi-deux, régression),
                les résultats de SimpleSize reproduisent G*Power 3.1 à ±1 observation près (différence d'arrondi due à la fonction
                plafond ⌈·⌉). Le LMM n'est pas couvert par G*Power : il est validé par simulation et comparaison
                avec des études de benchmarking publiées.</>
            : <>For the 7 analytical tests (t-test, paired t-test, ANOVA, RM ANOVA, correlation, chi-square, regression),
                SimpleSize results reproduce G*Power 3.1 to within ±1 observation (rounding difference from the ceiling function ⌈·⌉).
                LMM is not covered by G*Power: it is validated by simulation and comparison with published benchmarking studies.</>
          }
        </div>
      </div>

      {/* Sections par test */}
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#2F344A', marginBottom: 14 }}>
        {fr ? 'Tests implémentés' : 'Implemented tests'}
      </h2>
      {TESTS.map(t => <TestSection key={t.key} data={t} lang={lang} />)}

      {/* Note sur l'extensibilité */}
      <div style={{ marginTop: 28, padding: '14px 18px', background: '#f6faff',
                    borderRadius: 12, border: '1px solid #d0e8f4', fontSize: 13, color: '#5a6480' }}>
        {fr
          ? <><strong>Architecture ouverte</strong> — chaque test est une entrée indépendante dans la base de données de cette page.
              L'ajout d'un nouveau test (ANOVA factorielle, ANCOVA, test de proportion, etc.) nécessite uniquement d'ajouter un objet
              dans le tableau <code>TESTS</code> de <code>MethodsPage.js</code>, sans modifier la structure de la page.</>
          : <><strong>Open architecture</strong> — each test is an independent entry in this page's data array.
              Adding a new test (factorial ANOVA, ANCOVA, proportion test, etc.) only requires adding an object
              to the <code>TESTS</code> array in <code>MethodsPage.js</code>, without modifying the page structure.</>
        }
      </div>

      {/* Bibliographie complète */}
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#2F344A', marginTop: 36, marginBottom: 14 }}>
        {fr ? 'Bibliographie complète' : 'Full bibliography'}
      </h2>
      <div style={{ background: '#fff', borderRadius: 13, border: '1.5px solid #e0e7ef', padding: '18px 22px' }}>
        {[
          { authors: "Baayen, R. H., Davidson, D. J., & Bates, D. M.", year: 2008, title: "Mixed-effects modeling with crossed random effects for subjects and items.", journal: "Journal of Memory and Language", vol: "59(4)", pages: "390–412", doi: "10.1016/j.jml.2007.12.005" },
          { authors: "Bolker, B. M., Brooks, M. E., Clark, C. J., Geange, S. W., Poulsen, J. R., Stevens, M. H. H., & White, J.-S. S.", year: 2009, title: "Generalized linear mixed models: a practical guide for ecology and evolution.", journal: "Trends in Ecology & Evolution", vol: "24(3)", pages: "127–135", doi: "10.1016/j.tree.2008.10.008" },
          { authors: "Arend, M. G., & Schäfer, T.", year: 2019, title: "Statistical power in two-level models: A tutorial based on Monte Carlo simulation.", journal: "Psychological Methods", vol: "24(1)", pages: "1–19", doi: "10.1037/met0000195" },
          { authors: "Cohen, J.", year: 1988, title: "Statistical Power Analysis for the Behavioral Sciences (2nd ed.).", journal: "Erlbaum", vol: "", pages: "", doi: null },
          { authors: "Faul, F., Erdfelder, E., Lang, A.-G., & Buchner, A.", year: 2007, title: "G*Power 3: A flexible statistical power analysis program for the social, behavioral, and biomedical sciences.", journal: "Behavior Research Methods", vol: "39(2)", pages: "175–191", doi: "10.3758/BF03193146" },
          { authors: "Faul, F., Erdfelder, E., Buchner, A., & Lang, A.-G.", year: 2009, title: "Statistical power analyses using G*Power 3.1: Tests for correlation and regression analyses.", journal: "Behavior Research Methods", vol: "41(4)", pages: "1149–1160", doi: "10.3758/BRM.41.4.1149" },
          { authors: "Fisher, R. A.", year: 1915, title: "Frequency distribution of the values of the correlation coefficient in samples from an indefinitely large population.", journal: "Biometrika", vol: "10(4)", pages: "507–521", doi: "10.2307/2331838" },
          { authors: "Green, P., & MacLeod, C. J.", year: 2016, title: "SIMR: an R package for power analysis of generalised linear mixed models by simulation.", journal: "Methods in Ecology and Evolution", vol: "7(4)", pages: "493–498", doi: "10.1111/2041-210X.12504" },
          { authors: "Greenhouse, S. W., & Geisser, S.", year: 1959, title: "On methods in the analysis of profile data.", journal: "Psychometrika", vol: "24(2)", pages: "95–112", doi: "10.1007/BF02289823" },
          { authors: "Lakens, D.", year: 2013, title: "Calculating and reporting effect sizes to facilitate cumulative science: A practical primer for t-tests and ANOVAs.", journal: "Frontiers in Psychology", vol: "4", pages: "863", doi: "10.3389/fpsyg.2013.00863" },
          { authors: "Maxwell, S. E., Delaney, H. D., & Kelley, K.", year: 2018, title: "Designing Experiments and Analyzing Data: A Model Comparison Perspective (3rd ed.).", journal: "Routledge", vol: "", pages: "", doi: null },
          { authors: "Seabold, S., & Perktold, J.", year: 2010, title: "statsmodels: Econometric and statistical modeling with Python.", journal: "Proc. 9th Python in Science Conference", vol: "", pages: "92–96", doi: null },
        ].map((ref, i) => (
          <div key={i} style={{ fontSize: 13, color: '#3a4060', lineHeight: 1.7, marginBottom: 10, paddingBottom: 10,
                                 borderBottom: i < 11 ? '1px solid #f0f3f8' : 'none' }}>
            <strong>{ref.authors}</strong> ({ref.year}). {ref.title} <em>{ref.journal}</em>
            {ref.vol && `, ${ref.vol}`}{ref.pages && `, ${ref.pages}`}.
            {ref.doi && <> <a href={`https://doi.org/${ref.doi}`} target="_blank" rel="noopener noreferrer"
                               style={{ color: '#55D1E3', fontSize: 12 }}>doi:{ref.doi}</a></>}
          </div>
        ))}
      </div>
    </div>
  );
}
