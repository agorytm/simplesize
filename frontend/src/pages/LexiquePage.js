import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const TERMS = [
  {
    key: "alpha",
    en: { term: "Alpha (α) — Significance level", short: "The maximum probability of a false positive you're willing to accept.", body: "Alpha is the threshold you set before your study. The standard is α = 0.05, meaning you accept a 5% chance of concluding there's an effect when there isn't one. Lowering alpha (e.g. 0.01) makes your test stricter but requires more participants." },
    fr: { term: "Alpha (α) — Seuil de signification", short: "La probabilité maximale de fausse alarme que vous acceptez.", body: "L'alpha est le seuil que vous fixez avant l'étude. La convention est α = 0,05 : vous acceptez 5% de risque de conclure à un effet qui n'existe pas. Baisser l'alpha (ex. 0,01) rend le test plus sévère mais nécessite plus de participants." }
  },
  {
    key: "power",
    en: { term: "Statistical power (1 − β)", short: "The probability of detecting a real effect when it exists.", body: "Power answers: if there really is an effect, what's the chance my study will find it? Standard is 0.80 (80%). Higher power = more participants needed. Low power = high risk of a false negative (missing a real effect)." },
    fr: { term: "Puissance statistique (1 − β)", short: "La probabilité de détecter un effet réel quand il existe.", body: "La puissance répond à : si un effet existe vraiment, quelle est la probabilité que mon étude le trouve ? La convention est 0,80 (80%). Plus de puissance = plus de participants nécessaires. Puissance faible = risque élevé de faux négatif (rater un effet réel)." }
  },
  {
    key: "effect_size",
    en: { term: "Effect size", short: "A standardized measure of how big the difference or relationship is.", body: "Effect size is the heart of power analysis. It tells you 'how much does X affect Y?' in a unit-free way. A small effect (d=0.2) is subtle and hard to detect; a large effect (d=0.8) is obvious. Cohen's benchmarks: small = 0.2, medium = 0.5, large = 0.8 (for d). If you don't know, use medium as a conservative default." },
    fr: { term: "Taille d'effet", short: "Une mesure standardisée de l'amplitude de la différence ou de la relation.", body: "La taille d'effet est au cœur du calcul de puissance. Elle dit 'dans quelle mesure X affecte Y ?' sans unité. Un petit effet (d=0,2) est subtil et difficile à détecter ; un grand effet (d=0,8) est évident. Benchmarks de Cohen : petit = 0,2, moyen = 0,5, grand = 0,8 (pour d). En cas de doute, utilisez 'moyen' par défaut." }
  },
  {
    key: "cohens_d",
    en: { term: "Cohen's d", short: "Effect size for comparing two means.", body: "d = (mean₁ − mean₂) / pooled SD. Used for t-tests. d = 0.5 means the two group means are half a standard deviation apart. Rule of thumb: small = 0.2, medium = 0.5, large = 0.8." },
    fr: { term: "d de Cohen", short: "Taille d'effet pour comparer deux moyennes.", body: "d = (moyenne₁ − moyenne₂) / écart-type commun. Utilisé pour les t-tests. d = 0,5 signifie que les moyennes des deux groupes s'écartent de la moitié d'un écart-type. Référence : petit = 0,2, moyen = 0,5, grand = 0,8." }
  },
  {
    key: "cohens_f",
    en: { term: "Cohen's f", short: "Effect size for ANOVA (3+ groups).", body: "f is used when comparing 3 or more groups. It's related to η² (eta-squared). Rule of thumb: small = 0.1, medium = 0.25, large = 0.4. Note: f = d/2 for a simple two-group comparison." },
    fr: { term: "f de Cohen", short: "Taille d'effet pour les ANOVAs (3+ groupes).", body: "f est utilisé pour comparer 3 groupes ou plus. Il est lié au η² (eta-deux). Référence : petit = 0,1, moyen = 0,25, grand = 0,4. Note : f = d/2 pour une simple comparaison deux groupes." }
  },
  {
    key: "pearson_r",
    en: { term: "Pearson r — Correlation coefficient", short: "Measures the linear relationship between two numerical variables.", body: "r ranges from −1 to +1. r = 0: no relationship. r = 0.5: moderate positive relationship. r = −0.8: strong negative relationship. For power analysis: small = 0.1, medium = 0.3, large = 0.5 (Cohen)." },
    fr: { term: "r de Pearson — Coefficient de corrélation", short: "Mesure la relation linéaire entre deux variables numériques.", body: "r va de −1 à +1. r = 0 : aucune relation. r = 0,5 : relation positive modérée. r = −0,8 : relation négative forte. Pour le calcul de puissance : petit = 0,1, moyen = 0,3, grand = 0,5 (Cohen)." }
  },
  {
    key: "n",
    en: { term: "N — Sample size", short: "The total number of participants in your study.", body: "N is what SimpleSize calculates. 'N per group' is how many participants you need in each condition. 'Total N' = N per group × number of groups. Always recruit slightly more than the minimum (expect some dropouts)." },
    fr: { term: "N — Taille d'échantillon", short: "Le nombre total de participants dans votre étude.", body: "N, c'est ce que SimpleSize calcule. 'N par groupe' est le nombre de participants nécessaires dans chaque condition. 'N total' = N par groupe × nombre de groupes. Recrutez toujours un peu plus que le minimum (anticipez les abandons)." }
  },
  {
    key: "type1",
    en: { term: "Type I error (false positive)", short: "Concluding there's an effect when there isn't one.", body: "Also called α-error. You reject the null hypothesis when it's actually true. Example: concluding a drug works when it doesn't. Controlled by your alpha threshold." },
    fr: { term: "Erreur de type I (faux positif)", short: "Conclure à un effet qui n'existe pas.", body: "Aussi appelée erreur α. Vous rejetez l'hypothèse nulle alors qu'elle est vraie. Exemple : conclure qu'un médicament fonctionne alors qu'il ne fait rien. Contrôlée par votre seuil alpha." }
  },
  {
    key: "type2",
    en: { term: "Type II error (false negative)", short: "Missing a real effect — failing to detect it.", body: "Also called β-error. You fail to reject the null hypothesis when there's actually a real effect. Example: concluding a drug doesn't work when it actually does. Power = 1 − β. Avoided with a large enough sample." },
    fr: { term: "Erreur de type II (faux négatif)", short: "Rater un effet réel — ne pas le détecter.", body: "Aussi appelée erreur β. Vous ne rejetez pas l'hypothèse nulle alors qu'un effet réel existe. Exemple : conclure qu'un médicament ne fonctionne pas alors qu'il est efficace. Puissance = 1 − β. Évitée avec un échantillon suffisamment grand." }
  },
  {
    key: "between",
    en: { term: "Between-subjects factor", short: "Different participants in each group/condition.", body: "Each participant is in only one group. Example: Group A receives drug, Group B receives placebo — these are different people. Also called 'independent groups' design. In SimpleSize: 'Between-subject factor'." },
    fr: { term: "Facteur inter-sujets (between-subjects)", short: "Des participants différents dans chaque groupe/condition.", body: "Chaque participant n'est dans qu'un seul groupe. Exemple : Groupe A reçoit le médicament, Groupe B le placebo — ce sont des personnes différentes. Aussi appelé plan 'groupes indépendants'. Dans SimpleSize : 'Between-subject factor'." }
  },
  {
    key: "within",
    en: { term: "Within-subjects factor (repeated measures)", short: "Same participants measured in every condition.", body: "Each participant experiences all conditions. Example: measuring anxiety before, during, and after an intervention — same people each time. More statistical power with fewer participants. In SimpleSize: 'Within-subject factor'." },
    fr: { term: "Facteur intra-sujets (mesures répétées)", short: "Les mêmes participants mesurés dans toutes les conditions.", body: "Chaque participant passe dans toutes les conditions. Exemple : mesurer l'anxiété avant, pendant et après une intervention — les mêmes personnes à chaque fois. Plus de puissance statistique avec moins de participants. Dans SimpleSize : 'Within-subject factor'." }
  },
  {
    key: "lmm",
    en: { term: "Linear Mixed Model (LMM)", short: "A flexible model for complex designs with random effects.", body: "LMMs handle situations where observations aren't fully independent — e.g., students nested within classrooms, repeated measures over time, or any design with a random grouping variable. They require more complex power estimation (usually Monte Carlo simulation), which SimpleSize does automatically." },
    fr: { term: "Modèle Linéaire Mixte (MLM / LMM)", short: "Un modèle flexible pour les designs complexes avec effets aléatoires.", body: "Les LMM gèrent les situations où les observations ne sont pas totalement indépendantes — ex. élèves nichés dans des classes, mesures répétées dans le temps, ou tout design avec une variable de regroupement aléatoire. Ils nécessitent une estimation de puissance plus complexe (souvent par simulation Monte Carlo), que SimpleSize fait automatiquement." }
  },
];

export default function LexiquePage() {
  const { i18n } = useTranslation();
  const fr = i18n.language === 'fr';
  const [open, setOpen] = useState(null);

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '40px 24px 80px' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, color: '#2F344A', marginBottom: 8, marginTop: 0 }}>
        {fr ? 'Glossaire statistique' : 'Statistical glossary'}
      </h1>
      <p style={{ color: '#8A93B2', fontSize: 15, marginBottom: 36, marginTop: 0 }}>
        {fr
          ? 'Les termes clés expliqués simplement pour les étudiants en licence.'
          : 'Key terms explained simply for undergraduate students.'}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {TERMS.map(({ key, en, fr: frData }) => {
          const data = fr ? frData : en;
          const isOpen = open === key;
          return (
            <div key={key} style={{
              background: '#fff', borderRadius: 12,
              border: isOpen ? '1.5px solid #55D1E3' : '1.5px solid #e8edf4',
              overflow: 'hidden', transition: 'border 0.15s',
            }}>
              <button
                onClick={() => setOpen(isOpen ? null : key)}
                style={{
                  width: '100%', textAlign: 'left', background: 'none', border: 'none',
                  padding: '16px 20px', cursor: 'pointer',
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#2F344A', marginBottom: 3 }}>
                    {data.term}
                  </div>
                  <div style={{ fontSize: 13, color: '#8A93B2', lineHeight: 1.5 }}>{data.short}</div>
                </div>
                <span style={{ color: '#55D1E3', fontSize: 20, flexShrink: 0, marginTop: 2 }}>
                  {isOpen ? '−' : '+'}
                </span>
              </button>
              {isOpen && (
                <div style={{
                  padding: '0 20px 18px',
                  fontSize: 14, color: '#3a3f5c', lineHeight: 1.7,
                  borderTop: '1px solid #f0f3f8',
                  paddingTop: 14,
                }}>
                  {data.body}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
