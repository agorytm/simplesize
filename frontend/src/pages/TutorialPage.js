import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

/* ── Inline UI mockups ─────────────────────────────────── */
function MockButton({ label, color = "#55D1E3", bg = "#f0fbfd", border = "#b3e8f0" }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: bg, color: color,
      border: `1.5px solid ${border}`,
      borderRadius: 9, padding: '5px 14px',
      fontSize: 13, fontWeight: 700,
      fontFamily: 'Nunito, Arial, sans-serif',
      boxShadow: '0 1px 4px #0001',
    }}>{label}</span>
  );
}

function MockTab({ label, active }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '7px 18px',
      fontSize: 13,
      fontWeight: active ? 700 : 500,
      color: active ? '#1a8fa8' : '#9AA3C0',
      borderBottom: active ? '2.5px solid #55D1E3' : '2.5px solid transparent',
      background: 'none',
      fontFamily: 'Nunito, Arial, sans-serif',
    }}>{label}</span>
  );
}

function MockPanel({ children, title, width }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14,
      border: '1.5px solid #e8edf4',
      padding: '16px 18px',
      width: width || '100%',
      boxShadow: '0 2px 12px #55D1E308',
      fontFamily: 'Nunito, Arial, sans-serif',
    }}>
      {title && <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A93B2', marginBottom: 12 }}>{title}</div>}
      {children}
    </div>
  );
}

function MockTestButton({ label, active }) {
  return (
    <div style={{
      background: active ? 'linear-gradient(90deg,#55D1E3,#4fc6e1)' : '#F4F6F8',
      color: active ? '#fff' : '#2F344A',
      borderRadius: 10, padding: '9px 14px',
      fontSize: 13, fontWeight: 700,
      marginBottom: 6, cursor: 'default',
      border: active ? 'none' : '1px solid #e8edf4',
    }}>{label}</div>
  );
}

function MockInput({ label, value }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, color: '#8A93B2', marginBottom: 4, fontWeight: 600 }}>{label}</div>
      <div style={{
        background: '#F4F6F8', borderRadius: 7,
        border: '1.5px solid #d8e0ef',
        padding: '6px 12px', fontSize: 14, color: '#2F344A', width: 120,
      }}>{value}</div>
    </div>
  );
}

/* ── Step component ─────────────────────────────────────── */
function Step({ number, title, body, mockup, video_placeholder }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 18, padding: '28px 30px',
      border: '1.5px solid #e8edf4', marginBottom: 24,
      boxShadow: '0 2px 16px #55D1E308',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'linear-gradient(135deg,#55D1E3,#2F344A)',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: 18, flexShrink: 0,
        }}>{number}</div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#2F344A' }}>{title}</h2>
      </div>
      <div style={{ fontSize: 14, color: '#3a3f5c', lineHeight: 1.75, marginBottom: mockup ? 20 : 0 }}>
        {body}
      </div>
      {mockup && (
        <div style={{
          background: '#f8fafc', borderRadius: 12,
          border: '1.5px dashed #d0d8e8',
          padding: '20px 22px', marginTop: 4,
        }}>
          {mockup}
        </div>
      )}
      {video_placeholder && (
        <div style={{
          marginTop: 16, background: '#f0f3f8', borderRadius: 10,
          border: '1.5px dashed #C8D0E7',
          height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#B0B8D4', fontSize: 13, fontWeight: 600,
        }}>
          Video coming soon
        </div>
      )}
    </div>
  );
}

/* ── FAQ ────────────────────────────────────────────────── */
const FAQ_EN = [
  { q: "What is statistical power?", a: "Power is the probability that your study will detect a real effect if one exists. Standard is 80% (0.80). Low power = high risk of missing a real finding." },
  { q: "What effect size should I use?", a: "If you have previous studies in your field, use their reported effect sizes. If not, Cohen's conventions are: small (d=0.2, f=0.1, r=0.1), medium (d=0.5, f=0.25, r=0.3), large (d=0.8, f=0.4, r=0.5). When in doubt, use medium." },
  { q: "What's the difference between between- and within-subjects factors?", a: "Between-subjects: different people in each group. Within-subjects (repeated measures): same people in all conditions. Within-subjects designs need fewer participants because each person serves as their own control." },
  { q: "When should I use LMM instead of ANOVA?", a: "Use LMM when your data has a hierarchical or clustered structure (e.g., students in classrooms, repeated measures over many time points, partially crossed designs). If basic ANOVA applies, use that — LMM power estimation requires simulation and is less precise." },
  { q: "The required N seems very large. What can I do?", a: "Try increasing the expected effect size (only if justified by literature), increasing alpha (e.g. 0.10 for exploratory studies), or reducing power (0.70 instead of 0.80). Always justify your choices in your methods section." },
  { q: "Can I use SimpleSize for my thesis?", a: "Yes. SimpleSize uses validated methods (pwr package formulas + Monte Carlo for LMM). Cite it as: Lesur, B. (2025). SimpleSize [Web application]. Agorytm SAS. https://simplesize.science" },
];

const FAQ_FR = [
  { q: "Qu'est-ce que la puissance statistique ?", a: "La puissance est la probabilité que votre étude détecte un effet réel s'il existe. La convention est 80% (0,80). Puissance faible = risque élevé de rater un résultat réel." },
  { q: "Quelle taille d'effet choisir ?", a: "Si vous avez des études dans votre domaine, utilisez leurs tailles d'effet rapportées. Sinon, les conventions de Cohen : petit (d=0,2, f=0,1, r=0,1), moyen (d=0,5, f=0,25, r=0,3), grand (d=0,8, f=0,4, r=0,5). En cas de doute, choisissez moyen." },
  { q: "Quelle différence entre facteur inter- et intra-sujets ?", a: "Inter-sujets : des personnes différentes dans chaque groupe. Intra-sujets (mesures répétées) : les mêmes personnes dans toutes les conditions. Les plans intra-sujets nécessitent moins de participants car chaque personne sert de son propre témoin." },
  { q: "Quand utiliser un LMM plutôt qu'une ANOVA ?", a: "Utilisez un LMM quand vos données ont une structure hiérarchique (ex. élèves dans des classes, mesures répétées sur de nombreux points temporels, plans partiellement croisés). Si une ANOVA basique convient, utilisez-la — le calcul de puissance LMM requiert une simulation et est moins précis." },
  { q: "Le N requis semble très grand. Que faire ?", a: "Essayez d'augmenter la taille d'effet attendue (uniquement si justifié par la littérature), d'augmenter l'alpha (ex. 0,10 pour des études exploratoires), ou de réduire la puissance (0,70 au lieu de 0,80). Justifiez toujours vos choix dans la section méthode." },
  { q: "Puis-je utiliser SimpleSize pour mon mémoire ?", a: "Oui. SimpleSize utilise des méthodes validées (formules du package pwr + Monte Carlo pour les LMM). Citez-le ainsi : Lesur, B. (2025). SimpleSize [Application web]. Agorytm SAS. https://simplesize.science" },
];

/* ── Main page ──────────────────────────────────────────── */
export default function TutorialPage() {
  const { i18n } = useTranslation();
  const fr = i18n.language === 'fr';
  const [faqOpen, setFaqOpen] = useState(null);
  const faq = fr ? FAQ_FR : FAQ_EN;

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '40px 24px 80px', fontFamily: 'Nunito, Arial, sans-serif' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{ fontSize: 34, fontWeight: 900, color: '#2F344A', marginBottom: 12, marginTop: 0 }}>
          {fr ? "Tutoriel SimpleSize" : "SimpleSize Tutorial"}
        </h1>
        <p style={{ fontSize: 16, color: '#8A93B2', maxWidth: 520, margin: '0 auto 20px', lineHeight: 1.7 }}>
          {fr
            ? "Apprenez à calculer la taille d'échantillon de votre étude en moins de 5 minutes."
            : "Learn to calculate your study's sample size in under 5 minutes."}
        </p>
        <Link to="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(90deg,#55D1E3,#4fc6e1)',
          color: '#fff', borderRadius: 12, padding: '10px 24px',
          fontSize: 14, fontWeight: 700, textDecoration: 'none',
        }}>
          {fr ? "Ouvrir le calculateur" : "Open the calculator"} →
        </Link>
      </div>

      {/* Step 1 */}
      <Step number={1}
        title={fr ? "Choisissez votre type de design" : "Choose your design type"}
        body={fr
          ? <><p style={{margin:'0 0 10px'}}>En haut du panneau droit, vous voyez deux onglets :</p>
              <ul style={{margin:'0 0 10px',paddingLeft:20,lineHeight:1.8}}>
                <li><strong>Experimental design</strong> — pour les études avec des groupes ou des conditions (ANOVA, t-test, LMM...)</li>
                <li><strong>Variables & relations</strong> — pour les études qui cherchent des liens entre variables (corrélation, régression, chi²)</li>
              </ul>
              <p style={{margin:0}}>Si vous n'êtes pas sûr, utilisez la <strong>Sentence template</strong> (bouton jaune) — décrivez votre étude en français/anglais et le formulaire se remplit automatiquement.</p></>
          : <><p style={{margin:'0 0 10px'}}>At the top of the right panel, you see two tabs:</p>
              <ul style={{margin:'0 0 10px',paddingLeft:20,lineHeight:1.8}}>
                <li><strong>Experimental design</strong> — for studies with groups or conditions (ANOVA, t-test, LMM...)</li>
                <li><strong>Variables & relations</strong> — for studies looking for links between variables (correlation, regression, chi-square)</li>
              </ul>
              <p style={{margin:0}}>Not sure? Use the <strong>Sentence template</strong> (yellow button) — describe your study in plain language and the form auto-fills.</p></>
        }
        mockup={
          <div>
            <div style={{ display: 'flex', borderBottom: '2px solid #E7ECF2', marginBottom: 12 }}>
              <MockTab label="Experimental design" active={true} />
              <MockTab label="Variables & relations" active={false} />
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <MockButton label="Sentence template" color="#B4880A" bg="#fff6da" border="#FBC02D" />
              <span style={{ fontSize: 12, color: '#8A93B2' }}>← {fr ? "Cliquez ici si vous ne savez pas quoi remplir" : "Click here if you don't know what to fill"}</span>
            </div>
          </div>
        }
      />

      {/* Step 2 */}
      <Step number={2}
        title={fr ? "Renseignez votre design expérimental" : "Fill in your experimental design"}
        body={fr
          ? <><p style={{margin:'0 0 10px'}}>Dans l'onglet <strong>Experimental design</strong>, définissez vos facteurs :</p>
              <ul style={{margin:0,paddingLeft:20,lineHeight:1.9}}>
                <li><strong>Between-subject factor</strong> : groupes différents (ex. Groupe Médicament / Groupe Placebo)</li>
                <li><strong>Within-subject factor</strong> : mêmes participants à plusieurs moments (ex. Temps 1 / Temps 2 / Temps 3)</li>
                <li>Nommez le facteur et ajoutez les groupes/niveaux avec Entrée</li>
                <li>Vous pouvez avoir jusqu'à 2 facteurs entre, 1 facteur intra (ou 3 facteurs au total)</li>
              </ul></>
          : <><p style={{margin:'0 0 10px'}}>In the <strong>Experimental design</strong> tab, define your factors:</p>
              <ul style={{margin:0,paddingLeft:20,lineHeight:1.9}}>
                <li><strong>Between-subject factor</strong>: different groups (e.g. Drug group / Placebo group)</li>
                <li><strong>Within-subject factor</strong>: same participants at multiple time points (e.g. Time 1 / Time 2 / Time 3)</li>
                <li>Name the factor and add groups/levels by pressing Enter</li>
                <li>You can have up to 2 between-factors, 1 within-factor (max 3 total)</li>
              </ul></>
        }
        mockup={
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <MockPanel title="Between-subject factor 1" width="200px">
              <MockInput label="Factor name" value="Treatment" />
              <div style={{ fontSize: 12, color: '#8A93B2', marginBottom: 6 }}>Groups</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {["Drug", "Placebo"].map(l => (
                  <span key={l} style={{ background: '#e6f9fc', color: '#1a8fa8', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>{l} ✕</span>
                ))}
              </div>
            </MockPanel>
            <MockPanel title="Within-subject factor 1" width="200px">
              <MockInput label="Factor name" value="Time" />
              <div style={{ fontSize: 12, color: '#8A93B2', marginBottom: 6 }}>Levels</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {["Pre", "Post"].map(l => (
                  <span key={l} style={{ background: '#fff5e6', color: '#c47a00', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>{l} ✕</span>
                ))}
              </div>
            </MockPanel>
          </div>
        }
      />

      {/* Step 3 */}
      <Step number={3}
        title={fr ? "Regardez les tests proposés" : "Look at the proposed tests"}
        body={fr
          ? <p style={{margin:0}}>Dans le panneau gauche, SimpleSize affiche automatiquement les tests statistiques compatibles avec votre design. Cliquez sur un test pour le sélectionner — le design se visualise immédiatement dans le panneau central.</p>
          : <p style={{margin:0}}>In the left panel, SimpleSize automatically shows the statistical tests compatible with your design. Click a test to select it — the design is visualized immediately in the center panel.</p>
        }
        mockup={
          <div style={{ maxWidth: 220 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A93B2', marginBottom: 10 }}>Proposed tests</div>
            <MockTestButton label="Mixed ANOVA" active={true} />
            <MockTestButton label="Linear Mixed Model (LMM)" active={false} />
          </div>
        }
      />

      {/* Step 4 */}
      <Step number={4}
        title={fr ? "Ajustez les paramètres et lancez l'analyse" : "Adjust parameters and run the analysis"}
        body={fr
          ? <><p style={{margin:'0 0 10px'}}>En bas du panneau droit, réglez :</p>
              <ul style={{margin:'0 0 10px',paddingLeft:20,lineHeight:1.9}}>
                <li><strong>Alpha</strong> : seuil de significativité (standard : 0,05)</li>
                <li><strong>Power</strong> : puissance désirée (standard : 0,80)</li>
                <li><strong>Effect size</strong> : l'amplitude de l'effet attendu (consultez la littérature ou utilisez 0,25 = moyen pour f)</li>
              </ul>
              <p style={{margin:0}}>Puis cliquez sur <strong>Run analysis</strong>. Si vous changez un paramètre, recliquez sur Run analysis pour recalculer.</p></>
          : <><p style={{margin:'0 0 10px'}}>At the bottom of the right panel, set:</p>
              <ul style={{margin:'0 0 10px',paddingLeft:20,lineHeight:1.9}}>
                <li><strong>Alpha</strong>: significance threshold (standard: 0.05)</li>
                <li><strong>Power</strong>: desired power (standard: 0.80)</li>
                <li><strong>Effect size</strong>: expected effect magnitude (check the literature, or use 0.25 = medium for f)</li>
              </ul>
              <p style={{margin:0}}>Then click <strong>Run analysis</strong>. If you change a parameter, click Run analysis again to recalculate.</p></>
        }
        mockup={
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <MockInput label="Alpha (α)" value="0.05" />
              <MockInput label="Power (1−β)" value="0.80" />
              <MockInput label="Effect size f" value="0.25" />
            </div>
            <MockButton label="Run analysis" color="#fff" bg="linear-gradient(90deg,#55D1E3,#4fc6e1)" border="#55D1E3" />
          </div>
        }
      />

      {/* Step 5 */}
      <Step number={5}
        title={fr ? "Lisez votre résultat" : "Read your result"}
        body={fr
          ? <><p style={{margin:'0 0 10px'}}>Le panneau central affiche votre design et le N calculé :</p>
              <ul style={{margin:'0 0 10px',paddingLeft:20,lineHeight:1.9}}>
                <li><strong>N per group</strong> = nombre de participants nécessaires dans chaque groupe/condition</li>
                <li><strong>Total N</strong> = N par groupe × nombre de groupes</li>
                <li>Ajoutez 10–20% de participants pour compenser les abandons</li>
              </ul>
              <p style={{margin:0}}>Cliquez sur <strong>Export</strong> pour télécharger le visuel du design (JPEG).</p></>
          : <><p style={{margin:'0 0 10px'}}>The center panel shows your design and the calculated N:</p>
              <ul style={{margin:'0 0 10px',paddingLeft:20,lineHeight:1.9}}>
                <li><strong>N per group</strong> = number of participants needed in each group/condition</li>
                <li><strong>Total N</strong> = N per group × number of groups</li>
                <li>Add 10–20% extra participants to account for dropouts</li>
              </ul>
              <p style={{margin:0}}>Click <strong>Export</strong> to download the design visualization (JPEG).</p></>
        }
        mockup={
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#276b7b', marginBottom: 4 }}>
              N = 52 {fr ? 'par groupe' : 'per group'}
            </div>
            <div style={{ fontSize: 14, color: '#8A93B2' }}>
              Total = 104 · Power = 80% · α = 0.05
            </div>
            <div style={{ marginTop: 12 }}>
              <MockButton label="Export" color="#2F344A" bg="#F4F6F8" border="#d8e0ef" />
            </div>
          </div>
        }
      />

      {/* Step 6 — Sentence template */}
      <Step number={6}
        title={fr ? "Astuce : la Sentence template" : "Tip: the Sentence template"}
        body={fr
          ? <p style={{margin:0}}>Si vous ne savez pas comment remplir le formulaire, cliquez sur le bouton <strong>Sentence template</strong> (en jaune, en haut du panneau de design). Décrivez votre étude avec des mots simples — l'application remplit le formulaire et sélectionne le test automatiquement. Idéal pour les débutants.</p>
          : <p style={{margin:0}}>If you don't know how to fill the form, click the <strong>Sentence template</strong> button (in yellow, at the top of the design panel). Describe your study in plain words — the app fills the form and selects the test automatically. Ideal for beginners.</p>
        }
        mockup={
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <MockButton label="Sentence template" color="#B4880A" bg="#fff6da" border="#FBC02D" />
            <span style={{ fontSize: 13, color: '#5a6080' }}>
              {fr ? '"Je veux comparer 2 groupes sur un score de mémoire"' : '"I want to compare 2 groups on a memory score"'}
            </span>
            <span style={{ fontSize: 16, color: '#55D1E3' }}>→</span>
            <span style={{ fontSize: 13, color: '#1a8fa8', fontWeight: 700 }}>
              {fr ? 'Formulaire pré-rempli !' : 'Form auto-filled!'}
            </span>
          </div>
        }
        video_placeholder={true}
      />

      {/* Examples link */}
      <div style={{
        background: 'linear-gradient(135deg,#f0fbfd,#fff)',
        borderRadius: 16, padding: '22px 26px',
        border: '1.5px solid #b3e8f0', marginBottom: 32,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#2F344A', marginBottom: 4 }}>
            {fr ? 'Voir des exemples concrets' : 'See concrete examples'}
          </div>
          <div style={{ fontSize: 13, color: '#5a6080' }}>
            {fr ? '6 designs types prêts à charger dans le calculateur.' : '6 typical designs ready to load in the calculator.'}
          </div>
        </div>
        <Link to="/gallery" style={{
          background: '#2F344A', color: '#55D1E3', borderRadius: 10,
          padding: '9px 20px', fontSize: 13, fontWeight: 700, textDecoration: 'none',
        }}>
          {fr ? 'Galerie d\'exemples' : 'Example gallery'} →
        </Link>
      </div>

      {/* FAQ */}
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#2F344A', marginBottom: 16 }}>FAQ</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {faq.map(({ q, a }, i) => (
          <div key={i} style={{
            background: '#fff', borderRadius: 12,
            border: faqOpen === i ? '1.5px solid #55D1E3' : '1.5px solid #e8edf4',
          }}>
            <button onClick={() => setFaqOpen(faqOpen === i ? null : i)}
              style={{
                width: '100%', textAlign: 'left', background: 'none', border: 'none',
                padding: '14px 18px', cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: '#2F344A', fontFamily: 'Nunito, Arial, sans-serif' }}>{q}</span>
              <span style={{ color: '#55D1E3', fontSize: 18, flexShrink: 0 }}>{faqOpen === i ? '−' : '+'}</span>
            </button>
            {faqOpen === i && (
              <div style={{ padding: '0 18px 16px', fontSize: 13, color: '#3a3f5c', lineHeight: 1.7, borderTop: '1px solid #f0f3f8', paddingTop: 12 }}>
                {a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
