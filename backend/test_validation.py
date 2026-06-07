"""
Tests de validation SimpleSize vs valeurs G*Power de référence.
Lance avec : python test_validation.py
"""
import sys
sys.path.insert(0, '.')
from simulate import choose_statistical_method

# Cas de référence G*Power (valeurs obtenues avec G*Power 3.1)
CASES = [
    # ── T-TEST INDÉPENDANT ─────────────────────────────────────────────────
    {"label": "T-test  d=0.2  80%",  "data": {"selected_test":"ttest","f":0.2,"alpha":0.05,"power":0.80}, "gpower": 394},
    {"label": "T-test  d=0.5  80%",  "data": {"selected_test":"ttest","f":0.5,"alpha":0.05,"power":0.80}, "gpower": 64},
    {"label": "T-test  d=0.8  80%",  "data": {"selected_test":"ttest","f":0.8,"alpha":0.05,"power":0.80}, "gpower": 26},
    {"label": "T-test  d=0.5  90%",  "data": {"selected_test":"ttest","f":0.5,"alpha":0.05,"power":0.90}, "gpower": 85},
    # ── T-TEST APPARIÉ ────────────────────────────────────────────────────
    {"label": "T-paired d=0.5 80%",  "data": {"selected_test":"ttest_paired","f":0.5,"alpha":0.05,"power":0.80}, "gpower": 34},
    {"label": "T-paired d=0.5 90%",  "data": {"selected_test":"ttest_paired","f":0.5,"alpha":0.05,"power":0.90}, "gpower": 44},
    # ── ANOVA BETWEEN ────────────────────────────────────────────────────
    {"label": "ANOVA 3gr f=0.25 80%","data": {"selected_test":"anova","f":0.25,"alpha":0.05,"power":0.80,"group_levels":["A","B","C"]}, "gpower": 52},
    {"label": "ANOVA 4gr f=0.25 80%","data": {"selected_test":"anova","f":0.25,"alpha":0.05,"power":0.80,"group_levels":["A","B","C","D"]}, "gpower": 45},
    {"label": "ANOVA 2gr f=0.40 80%","data": {"selected_test":"anova","f":0.40,"alpha":0.05,"power":0.80,"group_levels":["A","B"]}, "gpower": 26},
    # ── ANOVA RM ────────────────────────────────────────────────────────
    {"label": "ANOVA-RM k=3 f=0.25 80%","data": {"selected_test":"anova_rm","f":0.25,"alpha":0.05,"power":0.80,"level_levels":["T1","T2","T3"]}, "gpower": 28},
    {"label": "ANOVA-RM k=4 f=0.25 80%","data": {"selected_test":"anova_rm","f":0.25,"alpha":0.05,"power":0.80,"level_levels":["T1","T2","T3","T4"]}, "gpower": 22},
    # ── CORRÉLATION ──────────────────────────────────────────────────────
    {"label": "Corrél  r=0.1  80%",  "data": {"selected_test":"correlation","r":0.1,"alpha":0.05,"power":0.80}, "gpower": 782},
    {"label": "Corrél  r=0.3  80%",  "data": {"selected_test":"correlation","r":0.3,"alpha":0.05,"power":0.80}, "gpower": 84},
    {"label": "Corrél  r=0.5  80%",  "data": {"selected_test":"correlation","r":0.5,"alpha":0.05,"power":0.80}, "gpower": 29},
    # ── CHI² ─────────────────────────────────────────────────────────────
    {"label": "Chi2 df=1 w=0.3 80%", "data": {"selected_test":"chi2","f":0.3,"alpha":0.05,"power":0.80,"chi2_df":1}, "gpower": 88},
    {"label": "Chi2 df=2 w=0.3 80%", "data": {"selected_test":"chi2","f":0.3,"alpha":0.05,"power":0.80,"chi2_df":2}, "gpower": 107},
    # ── RÉGRESSION ──────────────────────────────────────────────────────
    {"label": "Reg 2pred f2=0.15 80%","data": {"selected_test":"regression","f2":0.15,"alpha":0.05,"power":0.80,"n_predictors":2}, "gpower": 68},
    {"label": "Reg 5pred f2=0.15 80%","data": {"selected_test":"regression","f2":0.15,"alpha":0.05,"power":0.80,"n_predictors":5}, "gpower": 92},
]

TOLERANCE = 3  # différence max acceptable (±N)

passed = 0
failed = 0
warnings_ = 0

print("\n" + "="*74)
print("  VALIDATION SIMPLESIZE vs G*POWER 3.1")
print("="*74)
print(f"  {'Test':<30} {'SimpleSize':>11} {'G*Power':>9} {'Δ':>6}  {'Résultat'}")
print("-"*74)

for case in CASES:
    r = choose_statistical_method(case["data"])
    n = r.get("n_per_group")
    gp = case["gpower"]

    if n is None:
        print(f"  {case['label']:<30} {'ERREUR':>11} {gp:>9}  {'?':>6}  ❌ {r.get('error','')}")
        failed += 1
        continue

    delta = n - gp
    pct   = abs(delta) / gp * 100

    if abs(delta) <= TOLERANCE:
        status = "✅ OK"
        passed += 1
    elif pct <= 5:
        status = "🟡 ~OK"
        warnings_ += 1
    else:
        status = "❌ ÉCART"
        failed += 1

    print(f"  {case['label']:<30} {n:>11} {gp:>9} {delta:>+6}  {status}")

print("-"*74)
total = passed + warnings_ + failed
print(f"\n  Résultats : {passed}/{total} OK, {warnings_} proches, {failed} écarts")
print(f"  Taux de réussite : {(passed+warnings_)/total*100:.0f}%\n")
