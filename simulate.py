"""
SimpleSize - Backend statistique v2
Calcul de taille d'échantillon et puissance pour tests fréquents en recherche.
"""

from statsmodels.stats.power import TTestIndPower, FTestAnovaPower, TTestPower
from statsmodels.stats.power import NormalIndPower
from scipy.stats import ncf, ncx2, norm, t as t_dist
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

def gpower_anova_rm_solver(f, alpha, power, num_measurements, corr=0.5, epsilon=1.0):
    df_num = num_measurements - 1

    def power_fn(n):
        df_den = (n - 1) * df_num * epsilon
        lam = n * f ** 2 * num_measurements / (1 - corr)
        f_crit = ncf.ppf(1 - alpha, df_num, df_den, 0)
        return 1 - ncf.cdf(f_crit, df_num, df_den, lam)

    for n in range(2, 1001):
        if power_fn(n) >= power:
            return n
    return 1000


def gpower_anova_rm_mde_solver(n, alpha, power, num_measurements, corr=0.5, epsilon=1.0):
    df_num = num_measurements - 1
    df_den = (n - 1) * df_num * epsilon

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
#  LMM SIMULATION
# ─────────────────────────────────────────────

def lmm_power_simulation(n_group=2, n_level=2, n_per_group=20,
                          effect_size=0.25, n_sim=100,
                          alpha=0.05, target="interaction"):
    np.random.seed(42)
    rejections = 0
    converged = 0

    for _ in range(n_sim):
        group  = np.repeat(np.arange(n_group), n_per_group * n_level)
        level  = np.tile(np.repeat(np.arange(n_level), n_per_group), n_group)
        subject = np.tile(np.arange(n_per_group * n_group), n_level)

        mu = np.zeros((n_group, n_level))
        if target == "interaction" and n_group >= 2 and n_level >= 2:
            mu[1, 1] = effect_size
        elif target == "group":
            mu[1, :] = effect_size
        elif target == "level":
            mu[:, 1] = effect_size

        y = (mu[group, level]
             + np.random.normal(0, 1, size=len(group))
             + np.random.normal(0, 0.5, size=len(group)))  # random subject effect

        df = pd.DataFrame({"group": group.astype(str),
                           "level": level.astype(str),
                           "subject": subject.astype(str),
                           "y": y})

        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            try:
                mdf = mixedlm("y ~ group * level", df, groups=df["subject"]).fit(reml=True)
                converged += 1
                key_map = {"interaction": "group[T.1]:level[T.1]",
                           "group": "group[T.1]",
                           "level": "level[T.1]"}
                pval = mdf.pvalues.get(key_map.get(target, ""), 1.0)
                if pval < alpha:
                    rejections += 1
            except Exception:
                pass

    if converged == 0:
        return 0.0, 0
    return rejections / converged, converged


def lmm_power_solver(f, alpha, power, n_group, n_level, target="interaction",
                     min_n=3, max_n=500, step=1):
    """Fast analytical LMM power via mixed ANOVA approximation (same hypothesis, similar power)."""
    n_groups = max(n_group, 2)
    n_levels = max(n_level, 2)
    result = gpower_anova_mixed_solver(f, alpha, power, n_groups, n_levels)
    return max(min_n, min(result, max_n))


def lmm_mde_solver(n_per_group, alpha, power, n_group, n_level, target="interaction"):
    """Fast analytical LMM MDE via mixed ANOVA approximation."""
    n_groups = max(n_group, 2)
    n_levels = max(n_level, 2)
    return gpower_anova_mixed_mde_solver(n_per_group, alpha, power, n_groups, n_levels)


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
    """N pour chi² avec effet w (Cohen), df degrés de liberté."""
    from scipy.stats import chi2 as chi2_central
    crit = chi2_central.ppf(1 - alpha, df)

    def power_fn(n):
        lam = n * w ** 2
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
    u = n_predictors

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
#  ANOVA FACTORIELLE (between-subjects multi-facteurs)
# ─────────────────────────────────────────────

def anova_factorial_n_solver(f, alpha, power, n_cells):
    """N par cellule pour une ANOVA factorielle entre-sujets à n_cells cellules."""
    analysis = FTestAnovaPower()
    n_total = analysis.solve_power(effect_size=f, alpha=alpha, power=power, k_groups=n_cells)
    return int(math.ceil(n_total / n_cells))


def anova_factorial_mde_solver(n_per_cell, alpha, power, n_cells):
    """MDE pour une ANOVA factorielle avec n_per_cell participants par cellule."""
    analysis = FTestAnovaPower()
    f_val = analysis.solve_power(effect_size=None,
                                  nobs=n_per_cell * n_cells,
                                  alpha=alpha, power=power, k_groups=n_cells)
    return round(f_val, 3)


# ─────────────────────────────────────────────
#  LISTE DES TESTS DISPONIBLES
# ─────────────────────────────────────────────

def _extract_design_counts(data):
    """Extrait (n_groups, n_levels, n_cells, n_inter, n_intra) depuis le payload.
    Supporte le format nouveau (interFactors/intraFactors) et l'ancien (group_levels/level_levels).
    """
    interFactors = data.get("interFactors", [])
    intraFactors = data.get("intraFactors", [])

    if interFactors or intraFactors:
        valid_inter = [f for f in interFactors if len(f.get("levels", [])) >= 2]
        valid_intra = [f for f in intraFactors if len(f.get("levels", [])) >= 2]
        n_inter = len(valid_inter)
        n_intra = len(valid_intra)
        n_groups = len(valid_inter[0]["levels"]) if valid_inter else 0
        n_levels = len(valid_intra[0]["levels"]) if valid_intra else 0
        n_cells  = 1
        for fac in valid_inter:
            n_cells *= len(fac["levels"])
    else:
        # Ancien format
        n_groups = len(data.get("group_levels", []))
        n_levels = len(data.get("level_levels", []))
        n_inter  = 1 if n_groups >= 2 else 0
        n_intra  = 1 if n_levels >= 2 else 0
        n_cells  = n_groups

    return n_groups, n_levels, n_cells, n_inter, n_intra


def list_possible_tests(data):
    n_groups, n_levels, n_cells, n_inter, n_intra = _extract_design_counts(data)
    tests = []

    # Between-subjects uniquement
    if n_inter >= 1 and n_intra == 0:
        if n_cells == 2:
            tests.append("ttest")
        if n_inter == 1:
            tests.append("anova")
        else:
            tests.append("anova_factorial")

    # Within-subjects uniquement
    if n_intra >= 1 and n_inter == 0:
        tests.append("anova_rm")
        tests.append("lmm")

    # Mixte
    if n_inter >= 1 and n_intra >= 1:
        tests.append("anova_mixed")
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
        selected_test = data.get("selected_test", None)
        mde_mode  = data.get("mde_mode", False)
        n_given   = data.get("n_given", None)
        random_factor = data.get("random_factor", None)

        # Support nouveau format et ancien format
        n_groups, n_levels, n_cells, n_inter, n_intra = _extract_design_counts(data)

        # Paramètres spécifiques aux nouveaux tests
        r_val        = float(data.get("r", 0.3))
        chi2_df      = int(data.get("chi2_df", 1))
        n_predictors = int(data.get("n_predictors", 1))
        f2_val       = float(data.get("f2", 0.15))
        two_tailed   = bool(data.get("two_tailed", True))
        lmm_target   = data.get("lmm_target", "interaction")

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
                f_val = analysis.solve_power(effect_size=None, nobs=n * max(n_groups, 2),
                                             alpha=alpha, power=power, k_groups=max(n_groups, 2))
                return {"mde": round(f_val, 3), "test": "anova",
                        "label": "Cohen's f", "interpretation": _interpret_f(round(f_val, 3))}

            elif selected_test == "anova_factorial":
                cells = max(n_cells, 4)
                f_val = anova_factorial_mde_solver(int(n), alpha, power, cells)
                return {"mde": f_val, "test": "anova_factorial",
                        "label": "Cohen's f", "interpretation": _interpret_f(f_val)}

            elif selected_test == "anova_rm":
                f_val = gpower_anova_rm_mde_solver(int(n), alpha, power, num_measurements=max(n_levels, 2))
                return {"mde": f_val, "test": "anova_rm",
                        "label": "Cohen's f", "interpretation": _interpret_f(f_val)}

            elif selected_test == "anova_mixed":
                n_total = int(n) * max(n_groups, 2)
                f_val = gpower_anova_mixed_mde_solver(n_total, alpha, power, max(n_groups, 2), max(n_levels, 2))
                return {"mde": f_val, "test": "anova_mixed",
                        "label": "Cohen's f", "interpretation": _interpret_f(f_val)}

            elif selected_test == "lmm":
                f_val = lmm_mde_solver(int(n), alpha, power, n_group=max(n_groups, 2),
                                       n_level=max(n_levels, 2), target=lmm_target)
                return {"mde": f_val, "test": "lmm", "label": "Cohen's f",
                        "interpretation": _interpret_f(f_val), "random_factor": random_factor}

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
                    "interpretation": _interpret_d(f)}

        elif selected_test == "ttest_paired":
            n = ttest_paired_n_solver(f, alpha, power)
            return {"n_per_group": n, "test": "ttest_paired",
                    "interpretation": _interpret_d(f)}

        elif selected_test == "anova":
            analysis = FTestAnovaPower()
            k = max(n_groups, 2)
            n_total = analysis.solve_power(effect_size=f, alpha=alpha, power=power, k_groups=k)
            return {"n_per_group": int(math.ceil(n_total / k)), "test": "anova",
                    "interpretation": _interpret_f(f)}

        elif selected_test == "anova_factorial":
            cells = max(n_cells, 4)
            n_per_cell = anova_factorial_n_solver(f, alpha, power, cells)
            n_total = n_per_cell * cells
            return {"n_per_group": n_per_cell, "n_total": n_total, "test": "anova_factorial",
                    "n_cells": cells, "interpretation": _interpret_f(f)}

        elif selected_test == "anova_rm":
            if n_levels < 2:
                return {"error": "Au moins 2 modalités intra requises.", "test": "anova_rm"}
            n = gpower_anova_rm_solver(f, alpha, power, num_measurements=n_levels)
            return {"n_per_group": n, "test": "anova_rm",
                    "interpretation": _interpret_f(f)}

        elif selected_test == "anova_mixed":
            if n_groups < 2 or n_levels < 2:
                return {"error": "2 groupes et 2 niveaux intra requis.", "test": "anova_mixed"}
            n_total = gpower_anova_mixed_solver(f, alpha, power, n_groups, n_levels)
            return {"n_per_group": int(math.ceil(n_total / n_groups)), "test": "anova_mixed",
                    "interpretation": _interpret_f(f)}

        elif selected_test == "lmm":
            n_group = max(n_groups, 2)
            n_level = max(n_levels, 2)
            found_n = lmm_power_solver(f, alpha, power, n_group, n_level, target=lmm_target)
            return {
                "test": "lmm",
                "n_per_group": found_n,
                "random_factor": random_factor,
                "estimated_power": power,
                "message": f"N={found_n}/groupe pour {round(power*100)}% de puissance (approximation analytique).",
                "interpretation": _interpret_f(f)
            }

        elif selected_test == "correlation":
            n = correlation_n_solver(r_val, alpha, power, two_tailed)
            return {"n_per_group": n, "test": "correlation",
                    "interpretation": _interpret_r(r_val)}

        elif selected_test == "chi2":
            n = chi2_n_solver(f, alpha, power, chi2_df)
            return {"n_per_group": n, "test": "chi2",
                    "interpretation": _interpret_w(f)}

        elif selected_test == "regression":
            n = regression_n_solver(f2_val, alpha, power, n_predictors)
            return {"n_per_group": n, "test": "regression",
                    "interpretation": _interpret_f2(f2_val)}

        return {"error": "Test non reconnu.", "test": "unknown"}

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e), "test": data.get("selected_test", "unknown")}


def _interpret_d(d):
    d = abs(d)
    if d < 0.2:   return {"level": "trivial",  "label": "d < 0.2"}
    if d < 0.5:   return {"level": "small",    "label": "0.2 <= d < 0.5"}
    if d < 0.8:   return {"level": "medium",   "label": "0.5 <= d < 0.8"}
    return              {"level": "large",    "label": "d >= 0.8"}

def _interpret_f(f):
    if f < 0.1:   return {"level": "trivial",  "label": "f < 0.10"}
    if f < 0.25:  return {"level": "small",    "label": "0.10 <= f < 0.25"}
    if f < 0.4:   return {"level": "medium",   "label": "0.25 <= f < 0.40"}
    return              {"level": "large",    "label": "f >= 0.40"}

def _interpret_r(r):
    r = abs(r)
    if r < 0.1:   return {"level": "trivial",  "label": "r < 0.10"}
    if r < 0.3:   return {"level": "small",    "label": "0.10 <= r < 0.30"}
    if r < 0.5:   return {"level": "medium",   "label": "0.30 <= r < 0.50"}
    return              {"level": "large",    "label": "r >= 0.50"}

def _interpret_w(w):
    if w < 0.1:   return {"level": "trivial",  "label": "w < 0.10"}
    if w < 0.3:   return {"level": "small",    "label": "0.10 <= w < 0.30"}
    if w < 0.5:   return {"level": "medium",   "label": "0.30 <= w < 0.50"}
    return              {"level": "large",    "label": "w >= 0.50"}

def _interpret_f2(f2):
    if f2 < 0.02: return {"level": "trivial",  "label": "f2 < 0.02"}
    if f2 < 0.15: return {"level": "small",    "label": "0.02 <= f2 < 0.15"}
    if f2 < 0.35: return {"level": "medium",   "label": "0.15 <= f2 < 0.35"}
    return              {"level": "large",    "label": "f2 >= 0.35"}
