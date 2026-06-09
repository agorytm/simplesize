import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const EXAMPLES = [
  {
    id: "flashcard-ttest",
    tag: "t-test",
    tagColor: "#55D1E3",
    en: {
      title: "Flashcards vs. re-reading",
      context: "A student compares two study methods (flashcards vs. passive re-reading) on memory test scores. 2 independent groups.",
      design: "1 between-subjects factor: Method (2 levels: Flashcards / Re-reading)",
      test: "Independent t-test",
    },
    fr: {
      title: "Flashcards vs. relecture",
      context: "Un étudiant compare deux méthodes de révision (flashcards vs relecture passive) sur des scores à un test de mémoire. 2 groupes indépendants.",
      design: "1 facteur inter-sujets : Méthode (2 niveaux : Flashcards / Relecture)",
      test: "t-test indépendant",
    },
    formData: { interFactors: [{ name: "Method", levels: ["Flashcards", "Re-reading"] }], intraFactors: [], alpha: "0.05", power: "0.8", f: "0.5" },
    defaultTest: "ttest",
  },
  {
    id: "anxiety-time-rm",
    tag: "Repeated Measures ANOVA",
    tagColor: "#f9b448",
    en: {
      title: "Anxiety across a therapy program",
      context: "Measuring anxiety scores at 3 time points (before, during, after) in the same participants. Repeated measures.",
      design: "1 within-subjects factor: Time (3 levels: Pre / Mid / Post)",
      test: "Repeated Measures ANOVA",
    },
    fr: {
      title: "Anxiété au cours d'un programme de thérapie",
      context: "Mesure des scores d'anxiété à 3 temps (avant, pendant, après) chez les mêmes participants. Mesures répétées.",
      design: "1 facteur intra-sujets : Temps (3 niveaux : Avant / Pendant / Après)",
      test: "ANOVA à mesures répétées",
    },
    formData: { interFactors: [], intraFactors: [{ name: "Time", levels: ["Pre", "Mid", "Post"] }], alpha: "0.05", power: "0.8", f: "0.25" },
    defaultTest: "anova_rm",
  },
  {
    id: "sleep-anxiety-corr",
    tag: "Correlation",
    tagColor: "#9b79e0",
    en: {
      title: "Screen time and sleep quality",
      context: "Is there a link between daily screen time (hours) and sleep quality score (0–100)? Measuring both on the same participants.",
      design: "2 numerical variables: screen time (X) and sleep quality (Y)",
      test: "Pearson correlation",
    },
    fr: {
      title: "Temps d'écran et qualité du sommeil",
      context: "Y a-t-il un lien entre le temps d'écran quotidien (heures) et le score de qualité du sommeil (0–100) ? Mesure des deux variables sur les mêmes participants.",
      design: "2 variables numériques : temps d'écran (X) et qualité du sommeil (Y)",
      test: "Corrélation de Pearson",
    },
    formData: { interFactors: [], intraFactors: [], alpha: "0.05", power: "0.8", r: "0.3" },
    defaultTest: "correlation",
  },
  {
    id: "grades-prediction",
    tag: "Regression",
    tagColor: "#e9807e",
    en: {
      title: "Predicting exam scores",
      context: "Can study hours and sleep hours predict final exam scores? Multiple regression with 2 predictors.",
      design: "Outcome: exam score (Y). Predictors: study hours (X1), sleep hours (X2).",
      test: "Multiple regression",
    },
    fr: {
      title: "Prédire les résultats aux examens",
      context: "Le nombre d'heures de révision et de sommeil prédit-il le score à l'examen final ? Régression multiple avec 2 prédicteurs.",
      design: "Variable cible : score à l'examen (Y). Prédicteurs : heures de révision (X1), heures de sommeil (X2).",
      test: "Régression multiple",
    },
    formData: { interFactors: [], intraFactors: [], alpha: "0.05", power: "0.8", f2: "0.15", n_predictors: "2" },
    defaultTest: "regression",
  },
  {
    id: "drug-gender-mixed",
    tag: "Mixed ANOVA",
    tagColor: "#4fc6e1",
    en: {
      title: "Drug effect × gender interaction",
      context: "Testing a drug effect on stress scores, measured before and after treatment, in men and women separately. Mixed ANOVA: 1 between (Gender) × 1 within (Time).",
      design: "Between: Gender (Male/Female) × Within: Time (Before/After)",
      test: "Mixed ANOVA",
    },
    fr: {
      title: "Effet d'un médicament × interaction genre",
      context: "Test de l'effet d'un médicament sur le score de stress, mesuré avant et après traitement, chez les hommes et les femmes. ANOVA mixte : 1 inter (Genre) × 1 intra (Temps).",
      design: "Inter : Genre (Homme/Femme) × Intra : Temps (Avant/Après)",
      test: "ANOVA mixte",
    },
    formData: {
      interFactors: [{ name: "Gender", levels: ["Male", "Female"] }],
      intraFactors: [{ name: "Time", levels: ["Before", "After"] }],
      alpha: "0.05", power: "0.8", f: "0.25"
    },
    defaultTest: "anova_mixed",
  },
  {
    id: "learning-style-chi2",
    tag: "Chi-square",
    tagColor: "#f9b448",
    en: {
      title: "Learning style preferences by major",
      context: "Do science and humanities students differ in their preferred learning style (visual / auditory / kinesthetic)? Comparing proportions across categories.",
      design: "2 categorical variables: Major (2 groups) × Learning style (3 categories) → 2×3 table",
      test: "Chi-square test of independence",
    },
    fr: {
      title: "Préférences de style d'apprentissage par filière",
      context: "Les étudiants en sciences et en lettres diffèrent-ils dans leur style d'apprentissage préféré (visuel / auditif / kinesthésique) ? Comparaison des proportions entre catégories.",
      design: "2 variables catégorielles : Filière (2 groupes) × Style (3 catégories) → tableau 2×3",
      test: "Test du chi-deux d'indépendance",
    },
    formData: { interFactors: [], intraFactors: [], alpha: "0.05", power: "0.8", f: "0.3", chi2_df: "2" },
    defaultTest: "chi2",
  },
];

export default function GalleryPage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const fr = i18n.language === 'fr';

  const loadExample = (ex) => {
    // Store in sessionStorage and navigate to calculator
    sessionStorage.setItem('ss_gallery_load', JSON.stringify({ formData: ex.formData, defaultTest: ex.defaultTest }));
    navigate('/');
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px 80px' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, color: '#2F344A', marginBottom: 8, marginTop: 0 }}>
        {fr ? "Galerie d'exemples" : 'Example gallery'}
      </h1>
      <p style={{ color: '#8A93B2', fontSize: 15, marginBottom: 36, marginTop: 0 }}>
        {fr
          ? "Cliquez sur un exemple pour le charger dans le calculateur."
          : "Click an example to load it in the calculator."}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
        {EXAMPLES.map((ex) => {
          const data = fr ? ex.fr : ex.en;
          return (
            <div key={ex.id} style={{
              background: '#fff', borderRadius: 16, padding: '20px 22px',
              border: '1.5px solid #e8edf4',
              boxShadow: '0 2px 16px #55D1E308',
              cursor: 'pointer', transition: 'all 0.18s',
            }}
              onClick={() => loadExample(ex)}
              onMouseEnter={e => { e.currentTarget.style.borderColor = ex.tagColor; e.currentTarget.style.boxShadow = `0 4px 24px ${ex.tagColor}22`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8edf4'; e.currentTarget.style.boxShadow = '0 2px 16px #55D1E308'; }}
            >
              <div style={{
                display: 'inline-block', background: `${ex.tagColor}18`,
                color: ex.tagColor, borderRadius: 20,
                padding: '3px 12px', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.04em', marginBottom: 12,
              }}>
                {ex.tag}
              </div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#2F344A', marginBottom: 8 }}>
                {data.title}
              </div>
              <p style={{ fontSize: 13, color: '#5a6080', lineHeight: 1.6, margin: '0 0 12px' }}>
                {data.context}
              </p>
              <div style={{ fontSize: 12, color: '#8A93B2', borderTop: '1px solid #f0f3f8', paddingTop: 10 }}>
                <strong style={{ color: '#3a3f5c' }}>{fr ? 'Design' : 'Design'}: </strong>{data.design}
              </div>
              <div style={{ marginTop: 12, textAlign: 'right' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: ex.tagColor }}>
                  {fr ? 'Charger cet exemple' : 'Load this example'} →
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
