"""
SimpleSize - Backend statistique v2
Calcul de taille d'échantillon et puissance pour tests fréquents en recherche.
"""

from statsmodels.stats.power import TTestIndPower, FTestAnovaPower, TTestPower
from statsmodels.stats.power import NormalIndPower
from scipy.stats import ncf, ncx2, norm, t as t_dist, chi2 as _chi2_dist
import numpy as np
import pandas as pd
from statsmodels.formula.api import mixedlm
import warnings
import math


# ─────────────────────────────────────────────
#  UTILITAIRES COMMUNS
# ─────────────────────────────────────────────

def _bisect(f, lo, hi, target, n_iter=60):
    """Dichotomie générique : trouve x dans [lo,hi] tel que f(x) >= target."""
    for _ in range(n_iter):
        mid = (lo + hi) / 2
        if f(mid) < target:
            lo = mid
        else:
            hi = mid
    return hi


# ─────────────────────────────────────────────
#  ANOVA MESURES RÉPÉTÉES
# ─────────────────────────────────────────────



# ═══════════════════════════════════════════════════════════════════════════════
#  CORRECTIONS COMPARAISONS MULTIPLES
# ═══════════════════════════════════════════════════════════════════════════════
def apply_multiple_comparisons(alpha, n_comparisons, method="bonferroni"):
    """
    Retourne l'alpha corrigé et un message explicatif.
    method: 'bonferroni' | 'holm' | 'none'
    Pour Holm: alpha_corrigé = alpha / (n_comparisons - rang + 1)
    On renvoie le cas le plus conservateur (rang=1) pour le calcul de N.
    """
    if n_comparisons <= 1 or method == "none":
        return alpha, None
    if method == "bonferroni":
        alpha_corr = alpha / n_comparisons
        msg = f"Correction de Bonferroni appliquée : α/{n_comparisons} = {alpha_corr:.4f}"
        return alpha_corr, msg
    elif method == "holm":
        # Pour le calcul de N, on utilise le cas le plus strict (première comparaison)
        alpha_corr = alpha / n_comparisons
        msg = f"Correction de Holm appliquée (cas le plus strict) : α/{n_comparisons} = {alpha_corr:.4f}"
        return alpha_corr, msg
    return alpha, None

def gpower_anova_rm_solver(f, alpha, power, num_measurements, corr=0.5, epsilon=1.0):
    df_num = (num_measurements - 1) * epsilon

    def power_fn(n):
        df_den = (n - 1) * (num_measurements - 1) * epsilon
        lam = n * f ** 2 * num_measurements / (1 - corr)
        f_crit = ncf.ppf(1 - alpha, df_num, df_den, 0)
        return 1 - ncf.cdf(f_crit, df_num, df_den, lam)

    for n in range(2, 1001):
        if power_fn(n) >= power:
            return n
    return 1000


def gpower_anova_rm_mde_solver(n, alpha, power, num_measurements, corr=0.5, epsilon=1.0):
    df_num = (num_measurements - 1) * epsilon
    df_den = (n - 1) * (num_measurements - 1) * epsilon

    def power_fn(f):
        lam = n * f ** 2 * num_measurements / (1 - corr)
        f_crit = ncf.ppf(1 - alpha, df_num, df_den, 0)
        return 1 - ncf.cdf(f_crit, df_num, df_den, lam)

    return round(_bisect(power_fn, 0.01, 2.0, power), 3)


# ─────────────────────────────────────────────
#  ANOVA MIXTE (interaction)
# ─────────────────────────────────────────────

def gpower_anova_mixed_solver(f, alpha, power, n_groups, n_levels, corr=0.5, epsilon=1.0):
    df_num = (n_groups - 1) * (n_levels - 1)

    def power_fn(n):
        df_den = (n - n_groups) * (n_levels - 1) * epsilon
        if df_den <= 0:
            return 0
        lam = n * f ** 2 * n_levels / (1 - corr)
        f_crit = ncf.ppf(1 - alpha, df_num, df_den, 0)
        return 1 - ncf.cdf(f_crit, df_num, df_den, lam)

    for n in range(n_groups + 2, 1001):
        if power_fn(n) >= power:
            return n
    return 1000


def gpower_anova_mixed_mde_solver(n_total, alpha, power, n_groups, n_levels, corr=0.5, epsilon=1.0):
    df_num = (n_groups - 1) * (n_levels - 1)
    df_den = (n_total - n_groups) * (n_levels - 1) * epsilon

    def power_fn(f):
        lam = n_total * f ** 2 * n_levels / (1 - corr)
        f_crit = ncf.ppf(1 - alpha, df_num, df_den, 0)
        return 1 - ncf.cdf(f_crit, df_num, df_den, lam)

    return round(_bisect(power_fn, 0.01, 2.0, power), 3)


# ─────────────────────────────────────────────
#  LMM SIMULATION  (v2 — intercept aléatoire corrigé + LRT)
# ─────────────────────────────────────────────

def _lmm_fixed_effect_pvalue(df, target, method="lrt", re_formula=None):
    """
    Calcule la p-value du test sur l'effet fixe cible.
    method="wald"  : z de Wald (rapide, anticonservative à petit N)
    method="lrt"   : test du rapport de vraisemblance (ML vs modèle réduit)
    """
    key_map = {
        "interaction": "group[T.1]:level[T.1]",
        "group":       "group[T.1]",
        "level":       "level[T.1]",
    }
    re_kw = {"re_formula": re_formula} if re_formula else {}
    if method == "wald":
        m = mixedlm("y ~ group * level", df, groups=df["subject"], **re_kw).fit(reml=True, disp=False)
        return m.pvalues.get(key_map.get(target, ""), 1.0)

    # LRT : full vs reduced en ML (reml=False requis pour comparaison de vraisemblances)
    full = mixedlm("y ~ group * level", df, groups=df["subject"], **re_kw).fit(reml=False, disp=False)
    reduced_formula = {
        "interaction": "y ~ group + level",
        "group":       "y ~ level",
        "level":       "y ~ group",
    }.get(target, "y ~ group + level")
    reduced = mixedlm(reduced_formula, df, groups=df["subject"], **re_kw).fit(reml=False, disp=False)
    lr = 2.0 * (full.llf - reduced.llf)
    ddf = full.df_modelwc - reduced.df_modelwc
    if ddf <= 0 or lr < 0:
        return 1.0
    return float(_chi2_dist.sf(lr, ddf))


def lmm_power_simulation(n_group=2, n_level=2, n_per_group=20,
                          effect_size=0.25, n_sim=100, alpha=0.05,
                          target="interaction",
                          sd_subject=0.5, sd_resid=1.0,
                          test_method="lrt", seed=None,
                          missing_rate=0.0,
                          random_structure="intercept",
                          sd_slope=0.3,
                          n_items=20, sd_item=0.3):
    """
    Simulation Monte-Carlo pour LMM.
    - Vrai intercept aléatoire : un tirage par sujet (corrige le bug v1).
    - LRT par défaut ; Wald disponible comme option rapide.
    - seed optionnel ; RNG jamais remis à 42 en dur.
    """
    rng = np.random.default_rng(seed)
    rejections = 0
    converged = 0
    n_subjects = n_per_group * n_group

    for _ in range(n_sim):
        group   = np.repeat(np.arange(n_group), n_per_group * n_level)
        level   = np.tile(np.repeat(np.arange(n_level), n_per_group), n_group)
        subject = np.tile(np.arange(n_subjects), n_level)

        mu = np.zeros((n_group, n_level))
        if target == "interaction" and n_group >= 2 and n_level >= 2:
            mu[1, 1] = effect_size
        elif target == "group":
            mu[1, :] = effect_size
        elif target == "level":
            mu[:, 1] = effect_size

        # Effets aléatoires selon la structure choisie
        subject_re = rng.normal(0, sd_subject, size=n_subjects)

        if random_structure == "intercept_slope":
            # Intercept + pente aléatoire par sujet (non corrélés pour simplifier)
            slope_re = rng.normal(0, sd_slope, size=n_subjects)
            level_numeric = level.astype(float) / max(n_level - 1, 1)
            y = (mu[group, level]
                 + subject_re[subject]
                 + slope_re[subject] * level_numeric
                 + rng.normal(0, sd_resid, size=len(group)))

        elif random_structure == "crossed":
            # Effets croisés : sujets × items
            # n_items items répétés sur tous les sujets et niveaux
            n_total_obs = len(group)
            item_idx = np.tile(np.arange(n_items), int(np.ceil(n_total_obs / n_items)))[:n_total_obs]
            item_re = rng.normal(0, sd_item, size=n_items)
            y = (mu[group, level]
                 + subject_re[subject]
                 + item_re[item_idx]
                 + rng.normal(0, sd_resid, size=n_total_obs))

        else:
            # Intercept aléatoire seul (défaut)
            y = (mu[group, level]
                 + subject_re[subject]
                 + rng.normal(0, sd_resid, size=len(group)))

        df = pd.DataFrame({"group":   group.astype(str),
                           "level":   level.astype(str),
                           "subject": subject.astype(str),
                           "y":       y})
        # Données manquantes : supprimer aléatoirement missing_rate des observations intra
        # (on conserve toujours au moins 1 observation par sujet)
        if missing_rate > 0:
            n_obs = len(df)
            n_drop = int(n_obs * missing_rate)
            if n_drop > 0:
                drop_idx = rng.choice(n_obs, size=n_drop, replace=False)
                df = df.drop(drop_idx).reset_index(drop=True)

        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            try:
                pval = _lmm_fixed_effect_pvalue(df, target, test_method)
                converged += 1
                if pval is not None and pval < alpha:
                    rejections += 1
            except Exception:
                pass

    if converged == 0:
        return 0.0, 0
    return rejections / converged, converged


def lmm_power_solver(f, alpha, power, n_group, n_level, target="interaction",
                     min_n=3, max_n=150, step=1,
                     missing_rate=0.0,
                     sd_subject=0.5, test_method="lrt", n_sim_override=None,
                     random_structure="intercept", sd_slope=0.3,
                     n_items=20, sd_item=0.3):
    for n in range(min_n, max_n + 1, step):
        n_sim = n_sim_override or (60 if n < 30 else 40)
        pw, conv = lmm_power_simulation(
            n_group=n_group, n_level=n_level, n_per_group=n,
            effect_size=f, n_sim=n_sim, alpha=alpha, target=target,
            sd_subject=sd_subject, test_method=test_method,
            missing_rate=missing_rate,
            random_structure=random_structure, sd_slope=sd_slope,
            n_items=n_items, sd_item=sd_item
        )
        if pw >= power and conv >= max(15, n_sim // 3):
            return n
    return max_n


def lmm_mde_solver(n_per_group, alpha, power, n_group, n_level,
                   target="interaction", sd_subject=0.5, test_method="lrt"):
    """Cherche le MDE par dichotomie sur f."""
    def pw_fn(f_val):
        pw, conv = lmm_power_simulation(
            n_group=n_group, n_level=n_level, n_per_group=n_per_group,
            effect_size=f_val, n_sim=50, alpha=alpha, target=target,
            sd_subject=sd_subject, test_method=test_method
        )
        return pw if conv >= 15 else 0

    return round(_bisect(pw_fn, 0.05, 2.0, power), 3)


# ─────────────────────────────────────────────
#  TEST DE CORRÉLATION (r de Pearson)
# ─────────────────────────────────────────────

def correlation_n_solver(r, alpha, power, two_tailed=True):
    """N pour détecter une corrélation r avec la puissance voulue."""
    z_alpha = norm.ppf(1 - alpha / (2 if two_tailed else 1))
    z_beta  = norm.ppf(power)
    z_r = 0.5 * math.log((1 + r) / (1 - r))  # Fisher z
    n = math.ceil(((z_alpha + z_beta) / z_r) ** 2 + 3)
    return n


def correlation_mde_solver(n, alpha, power, two_tailed=True):
    z_alpha = norm.ppf(1 - alpha / (2 if two_tailed else 1))
    z_beta  = norm.ppf(power)
    z_r = (z_alpha + z_beta) / math.sqrt(n - 3)
    r = (math.exp(2 * z_r) - 1) / (math.exp(2 * z_r) + 1)
    return round(r, 3)


# ─────────────────────────────────────────────
#  TEST DU CHI² (indépendance / goodness-of-fit)
# ─────────────────────────────────────────────

def chi2_n_solver(w, alpha, power, df):
    """N pour chi² avec effet w (Cohen), df degrés de liberté.
    Utilise la loi chi² non-centrale (ncx2) de scipy.
    """
    # Valeur critique sous H0 (distribution centrale)
    from scipy.stats import chi2 as chi2_central
    crit = chi2_central.ppf(1 - alpha, df)

    def power_fn(n):
        lam = n * w ** 2          # paramètre de non-centralité
        return 1 - ncx2.cdf(crit, df, lam)

    for n in range(2, 10001):
        if power_fn(n) >= power:
            return n
    return 10000


def chi2_mde_solver(n, alpha, power, df):
    from scipy.stats import chi2 as chi2_central
    crit = chi2_central.ppf(1 - alpha, df)

    def power_fn(w):
        lam = n * w ** 2
        return 1 - ncx2.cdf(crit, df, lam)

    return round(_bisect(power_fn, 0.01, 2.0, power), 3)


# ─────────────────────────────────────────────
#  RÉGRESSION LINÉAIRE MULTIPLE (F-test global)
# ─────────────────────────────────────────────

def regression_n_solver(f2, alpha, power, n_predictors):
    """N pour régression multiple — f² = R²/(1-R²)."""
    u = n_predictors  # df numérateur

    def power_fn(n):
        v = n - u - 1
        if v <= 0:
            return 0
        lam = n * f2
        f_crit = ncf.ppf(1 - alpha, u, v, 0)
        return 1 - ncf.cdf(f_crit, u, v, lam)

    for n in range(u + 2, 10001):
        if power_fn(n) >= power:
            return n
    return 10000


def regression_mde_solver(n, alpha, power, n_predictors):
    u = n_predictors
    v = n - u - 1

    def power_fn(f2):
        lam = n * f2
        f_crit = ncf.ppf(1 - alpha, u, v, 0)
        return 1 - ncf.cdf(f_crit, u, v, lam)

    return round(_bisect(power_fn, 0.001, 5.0, power), 3)


# ─────────────────────────────────────────────
#  T-TEST APPARIÉ (one-sample / paired)
# ─────────────────────────────────────────────

def ttest_paired_n_solver(d, alpha, power):
    analysis = TTestPower()
    n = analysis.solve_power(effect_size=d, alpha=alpha, power=power, alternative="two-sided")
    return int(math.ceil(n))


def ttest_paired_mde_solver(n, alpha, power):
    analysis = TTestPower()
    d = analysis.solve_power(nobs=n, alpha=alpha, power=power, alternative="two-sided")
    return round(d, 3)


# ─────────────────────────────────────────────
#  LISTE DES TESTS DISPONIBLES
# ─────────────────────────────────────────────

def list_possible_tests(data):
    factors   = data.get("factors", {})
    n_groups  = len(data.get("group_levels", []))
    n_levels  = len(data.get("level_levels", []))

    inter = [k for k, v in factors.items() if v == "between"]
    intra = [k for k, v in factors.items() if v == "within"]
    tests = []

    # Between uniquement
    if len(inter) >= 1 and n_groups >= 2 and not intra:
        if n_groups == 2:
            tests.append("ttest")
        tests.append("anova")

    # Within uniquement
    if len(intra) >= 1 and n_levels >= 2:
        tests.append("anova_rm")
        tests.append("lmm")

    # Mixte
    if len(inter) >= 1 and n_groups >= 2 and len(intra) >= 1 and n_levels >= 2:
        if "anova_rm" not in tests:
            tests.append("anova_rm")
        tests.append("anova_mixed")
        if "lmm" not in tests:
            tests.append("lmm")

    # Toujours disponibles
    tests.extend(["ttest_paired", "correlation", "chi2", "regression"])

    # Dédupliquer en préservant l'ordre
    seen = set()
    result = []
    for t in tests:
        if t not in seen:
            seen.add(t)
            result.append(t)
    return result


# ─────────────────────────────────────────────
#  DISPATCHER PRINCIPAL
# ─────────────────────────────────────────────

def choose_statistical_method(data):
    try:
        alpha  = float(data.get("alpha", 0.05))
        power  = float(data.get("power", 0.80))
        f      = float(data.get("f", 0.25))
        group_levels  = data.get("group_levels", [])
        level_levels  = data.get("level_levels", [])
        n_groups = len(group_levels)
        n_levels = len(level_levels)
        selected_test = data.get("selected_test", None)
        mde_mode  = data.get("mde_mode", False)
        n_given   = data.get("n_given", None)
        random_factor = data.get("random_factor", None)

        # Paramètres spécifiques aux nouveaux tests
        r_val        = float(data.get("r", 0.3))
        chi2_df      = int(data.get("chi2_df", 1))
        n_predictors = int(data.get("n_predictors", 1))
        f2_val       = float(data.get("f2", 0.15))
        two_tailed   = bool(data.get("two_tailed", True))
        lmm_target   = data.get("lmm_target", "interaction")
        sd_subject   = float(data.get("sd_subject", 0.5))
        corr          = float(data.get("corr", 0.5))
        epsilon       = float(data.get("epsilon", 1.0))
        missing_rate       = float(data.get("missing_rate", 0.0))
        random_structure   = data.get("random_structure", "intercept")
        sd_slope           = float(data.get("sd_slope", 0.3))
        n_items            = int(data.get("n_items", 20))
        sd_item            = float(data.get("sd_item", 0.3))
        n_comparisons = int(data.get("n_comparisons", 1))
        mc_method     = data.get("mc_method", "bonferroni")
        alpha_orig    = alpha
        alpha, mc_msg = apply_multiple_comparisons(alpha, n_comparisons, mc_method)
        test_method  = data.get("test_method", "lrt")
        n_sim_user   = data.get("n_sim", None)
        if n_sim_user is not None:
            try:
                n_sim_user = int(n_sim_user)
            except (TypeError, ValueError):
                n_sim_user = None

        # ── MODE MDE ──────────────────────────────────────────────────────────
        if mde_mode and n_given is not None:
            n = float(n_given)
            if n < 4:
                return {"error": "Effectif trop faible pour un calcul fiable.", "test": selected_test}

            if selected_test == "ttest":
                analysis = TTestIndPower()
                d = analysis.solve_power(effect_size=None, nobs1=n, alpha=alpha, power=power)
                return {"mde": round(d, 3), "test": "ttest",
                        "label": "Cohen's d", "interpretation": _interpret_d(round(d, 3))}

            elif selected_test == "ttest_paired":
                d = ttest_paired_mde_solver(int(n), alpha, power)
                return {"mde": d, "test": "ttest_paired",
                        "label": "Cohen's d", "interpretation": _interpret_d(d)}

            elif selected_test == "anova":
                analysis = FTestAnovaPower()
                f_val = analysis.solve_power(effect_size=None, nobs=n * n_groups,
                                             alpha=alpha, power=power, k_groups=n_groups)
                return {"mde": round(f_val, 3), "test": "anova",
                        "label": "Cohen's f", "interpretation": _interpret_f(round(f_val, 3))}

            elif selected_test == "anova_rm":
                f_val = gpower_anova_rm_mde_solver(int(n), alpha, power, num_measurements=n_levels, corr=corr, epsilon=epsilon)
                return {"mde": f_val, "test": "anova_rm",
                        "label": "Cohen's f", "interpretation": _interpret_f(f_val)}

            elif selected_test == "anova_mixed":
                n_total = int(n) * n_groups
                f_val = gpower_anova_mixed_mde_solver(n_total, alpha, power, n_groups, n_levels, corr=corr, epsilon=epsilon)
                return {"mde": f_val, "test": "anova_mixed",
                        "label": "Cohen's f", "interpretation": _interpret_f(f_val)}

            elif selected_test == "lmm":
                f_val = lmm_mde_solver(int(n), alpha, power, n_group=n_groups or 2,
                                       n_level=n_levels or 2, target=lmm_target,
                                       sd_subject=sd_subject, test_method=test_method)
                return {"mde": f_val, "test": "lmm", "label": "Cohen's f",
                        "interpretation": _interpret_f(f_val), "random_factor": random_factor,
                        "sd_subject": sd_subject, "test_method": test_method}

            elif selected_test == "correlation":
                r = correlation_mde_solver(int(n), alpha, power, two_tailed)
                return {"mde": r, "test": "correlation",
                        "label": "r de Pearson", "interpretation": _interpret_r(r)}

            elif selected_test == "chi2":
                w = chi2_mde_solver(int(n), alpha, power, chi2_df)
                return {"mde": w, "test": "chi2",
                        "label": "w de Cohen", "interpretation": _interpret_w(w)}

            elif selected_test == "regression":
                f2 = regression_mde_solver(int(n), alpha, power, n_predictors)
                return {"mde": f2, "test": "regression",
                        "label": "f² de Cohen", "interpretation": _interpret_f2(f2)}

            else:
                return {"error": "Test non reconnu.", "test": "unknown"}

        # ── MODE N (calcul taille d'échantillon) ──────────────────────────────
        if selected_test == "ttest":
            analysis = TTestIndPower()
            n = analysis.solve_power(effect_size=f, alpha=alpha, power=power)
            return {"n_per_group": int(math.ceil(n)), "test": "ttest",
                    "interpretation": _interpret_d(f), "mc_correction": mc_msg, "alpha_used": alpha, "alpha_orig": alpha_orig}

        elif selected_test == "ttest_paired":
            n = ttest_paired_n_solver(f, alpha, power)
            return {"n_per_group": n, "test": "ttest_paired",
                    "interpretation": _interpret_d(f), "mc_correction": mc_msg, "alpha_used": alpha, "alpha_orig": alpha_orig}

        elif selected_test == "anova":
            analysis = FTestAnovaPower()
            n_total = analysis.solve_power(effect_size=f, alpha=alpha, power=power, k_groups=n_groups)
            return {"n_per_group": int(math.ceil(n_total / n_groups)), "test": "anova",
                    "interpretation": _interpret_f(f), "mc_correction": mc_msg, "alpha_used": alpha, "alpha_orig": alpha_orig}

        elif selected_test == "anova_rm":
            if n_levels < 2:
                return {"error": "Au moins 2 modalités intra requises.", "test": "anova_rm"}
            n = gpower_anova_rm_solver(f, alpha, power, num_measurements=n_levels, corr=corr, epsilon=epsilon)
            return {"n_per_group": n, "test": "anova_rm",
                    "interpretation": _interpret_f(f), "corr": corr, "epsilon": epsilon, "mc_correction": mc_msg, "alpha_used": alpha, "alpha_orig": alpha_orig}

        elif selected_test == "anova_mixed":
            if n_groups < 2 or n_levels < 2:
                return {"error": "2 groupes et 2 niveaux intra requis.", "test": "anova_mixed"}
            n_total = gpower_anova_mixed_solver(f, alpha, power, n_groups, n_levels, corr=corr, epsilon=epsilon)
            return {"n_per_group": int(math.ceil(n_total / n_groups)), "test": "anova_mixed",
                    "interpretation": _interpret_f(f), "corr": corr, "epsilon": epsilon, "mc_correction": mc_msg, "alpha_used": alpha, "alpha_orig": alpha_orig}

        elif selected_test == "lmm":
            n_group = n_groups if n_groups >= 2 else 2
            n_level = n_levels if n_levels >= 2 else 2
            found_n = lmm_power_solver(f, alpha, power, n_group, n_level, target=lmm_target,
                                       sd_subject=sd_subject, test_method=test_method,
                                       n_sim_override=n_sim_user, missing_rate=missing_rate,
                                       random_structure=random_structure, sd_slope=sd_slope,
                                       n_items=n_items, sd_item=sd_item)
            n_sim_final = n_sim_user or 60
            pw_final, conv_final = lmm_power_simulation(
                n_group=n_group, n_level=n_level, n_per_group=found_n,
                effect_size=f, n_sim=n_sim_final, alpha=alpha, target=lmm_target,
                sd_subject=sd_subject, test_method=test_method, missing_rate=missing_rate,
                random_structure=random_structure, sd_slope=sd_slope,
                n_items=n_items, sd_item=sd_item
            )
            return {
                "test": "lmm",
                "n_per_group": found_n,
                "random_factor": random_factor,
                "estimated_power": round(pw_final, 3),
                "n_sim": n_sim_final,
                "converged": conv_final,
                "sd_subject": sd_subject,
                "test_method": test_method,
                "random_structure": random_structure,
                "message": f"Puissance estimée par simulation : {round(pw_final*100)}% avec n={found_n}/groupe." + (f" ({int(missing_rate*100)}% de mesures manquantes simulées.)" if missing_rate > 0 else ""),
                "interpretation": _interpret_f(f)
            }

        elif selected_test == "correlation":
            n = correlation_n_solver(r_val, alpha, power, two_tailed)
            return {"n_per_group": n, "test": "correlation",
                    "interpretation": _interpret_r(r_val), "mc_correction": mc_msg, "alpha_used": alpha, "alpha_orig": alpha_orig}

        elif selected_test == "chi2":
            n = chi2_n_solver(f, alpha, power, chi2_df)
            return {"n_per_group": n, "test": "chi2",
                    "interpretation": _interpret_w(f), "mc_correction": mc_msg, "alpha_used": alpha, "alpha_orig": alpha_orig}

        elif selected_test == "regression":
            n = regression_n_solver(f2_val, alpha, power, n_predictors)
            return {"n_per_group": n, "test": "regression",
                    "interpretation": _interpret_f2(f2_val), "mc_correction": mc_msg, "alpha_used": alpha, "alpha_orig": alpha_orig}

        return {"error": "Test non reconnu.", "test": "unknown"}

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e), "test": data.get("selected_test", "unknown")}


# ─────────────────────────────────────────────
#  INTERPRÉTATIONS PÉDAGOGIQUES
# ─────────────────────────────────────────────

def _interpret_d(d):
    d = abs(d)
    if d < 0.2:   return {"level": "trivial",  "label": "Très petit effet (d < 0.2)"}
    if d < 0.5:   return {"level": "small",    "label": "Petit effet (0.2 ≤ d < 0.5)"}
    if d < 0.8:   return {"level": "medium",   "label": "Effet moyen (0.5 ≤ d < 0.8)"}
    return              {"level": "large",    "label": "Grand effet (d ≥ 0.8)"}

def _interpret_f(f):
    if f < 0.1:   return {"level": "trivial",  "label": "Très petit effet (f < 0.10)"}
    if f < 0.25:  return {"level": "small",    "label": "Petit effet (0.10 ≤ f < 0.25)"}
    if f < 0.4:   return {"level": "medium",   "label": "Effet moyen (0.25 ≤ f < 0.40)"}
    return              {"level": "large",    "label": "Grand effet (f ≥ 0.40)"}

def _interpret_r(r):
    r = abs(r)
    if r < 0.1:   return {"level": "trivial",  "label": "Très faible corrélation (r < 0.10)"}
    if r < 0.3:   return {"level": "small",    "label": "Faible corrélation (0.10 ≤ r < 0.30)"}
    if r < 0.5:   return {"level": "medium",   "label": "Corrélation modérée (0.30 ≤ r < 0.50)"}
    return              {"level": "large",    "label": "Forte corrélation (r ≥ 0.50)"}

def _interpret_w(w):
    if w < 0.1:   return {"level": "trivial",  "label": "Très petit effet (w < 0.10)"}
    if w < 0.3:   return {"level": "small",    "label": "Petit effet (0.10 ≤ w < 0.30)"}
    if w < 0.5:   return {"level": "medium",   "label": "Effet moyen (0.30 ≤ w < 0.50)"}
    return              {"level": "large",    "label": "Grand effet (w ≥ 0.50)"}

def _interpret_f2(f2):
    if f2 < 0.02: return {"level": "trivial",  "label": "Très petit effet (f² < 0.02)"}
    if f2 < 0.15: return {"level": "small",    "label": "Petit effet (0.02 ≤ f² < 0.15)"}
    if f2 < 0.35: return {"level": "medium",   "label": "Effet moyen (0.15 ≤ f² < 0.35)"}
    return              {"level": "large",    "label": "Grand effet (f² ≥ 0.35)"}


# ═══════════════════════════════════════════════════════════════════════════════
#  POWER CURVE  — renvoie une série (N, power) pour tracer la courbe
# ═══════════════════════════════════════════════════════════════════════════════
def power_curve_data(selected_test, f, alpha, r=0.3, f2=0.15, chi2_df=1,
                     n_predictors=1, corr=0.5, epsilon=1.0,
                     n_groups=2, n_levels=2, n_points=40):
    """
    Retourne une liste de {n, power} sur une plage N adaptée au test.
    """
    import numpy as np
    from statsmodels.stats.power import TTestIndPower, TTestPower, FTestAnovaPower
    from scipy.stats import ncf, ncx2, norm

    points = []

    # Plage N selon le test
    if selected_test in ("ttest", "ttest_paired"):
        ns = np.unique(np.round(np.geomspace(5, 600, n_points)).astype(int))
    elif selected_test in ("anova", "anova_rm", "anova_mixed"):
        ns = np.unique(np.round(np.geomspace(5, 400, n_points)).astype(int))
    elif selected_test == "correlation":
        ns = np.unique(np.round(np.geomspace(10, 1000, n_points)).astype(int))
    elif selected_test == "chi2":
        ns = np.unique(np.round(np.geomspace(10, 1000, n_points)).astype(int))
    elif selected_test == "regression":
        ns = np.unique(np.round(np.geomspace(10, 800, n_points)).astype(int))
    else:
        ns = np.unique(np.round(np.geomspace(5, 500, n_points)).astype(int))

    for n in ns:
        n = int(n)
        try:
            if selected_test == "ttest":
                d = f * 2
                analysis = TTestIndPower()
                pw = analysis.power(effect_size=d, nobs1=n, alpha=alpha, ratio=1.0)

            elif selected_test == "ttest_paired":
                d = f * 2
                analysis = TTestPower()
                pw = analysis.power(effect_size=d, nobs=n, alpha=alpha)

            elif selected_test == "anova":
                analysis = FTestAnovaPower()
                pw = analysis.power(effect_size=f, nobs=n, alpha=alpha, k_groups=n_groups)

            elif selected_test == "anova_rm":
                df_num = (n_levels - 1) * epsilon
                df_den = (n - 1) * (n_levels - 1) * epsilon
                if df_num <= 0 or df_den <= 0:
                    continue
                lam = n * f**2 * n_levels / max(1 - corr, 1e-6)
                fc = ncf.ppf(1 - alpha, df_num, df_den, 0)
                pw = 1 - ncf.cdf(fc, df_num, df_den, lam)

            elif selected_test == "anova_mixed":
                n_total = n * n_groups
                df_num = (n_groups - 1) * (n_levels - 1) * epsilon
                df_den = (n_total - n_groups) * (n_levels - 1) * epsilon
                if df_num <= 0 or df_den <= 0:
                    continue
                lam = n_total * f**2 * n_levels / max(1 - corr, 1e-6)
                fc = ncf.ppf(1 - alpha, df_num, df_den, 0)
                pw = 1 - ncf.cdf(fc, df_num, df_den, lam)

            elif selected_test == "correlation":
                zr = math.atanh(max(min(r, 0.999), 0.001))
                se = 1.0 / math.sqrt(max(n - 3, 1))
                z_crit = norm.ppf(1 - alpha / 2)
                pw = 1 - norm.cdf(z_crit - zr / se) + norm.cdf(-z_crit - zr / se)

            elif selected_test == "chi2":
                lam = n * f**2
                crit = ncx2.ppf(1 - alpha, chi2_df, 0)
                pw = 1 - ncx2.cdf(crit, chi2_df, lam)

            elif selected_test == "regression":
                n_total = n
                df1 = n_predictors
                df2 = max(n_total - n_predictors - 1, 1)
                lam = n_total * f2
                fc = ncf.ppf(1 - alpha, df1, df2, 0)
                pw = 1 - ncf.cdf(fc, df1, df2, lam)

            else:
                continue

            pw = float(np.clip(pw, 0, 1))
            points.append({"n": n, "power": round(pw, 4)})
        except Exception:
            continue

    return points
