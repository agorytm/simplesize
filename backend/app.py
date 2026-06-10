"""
SimpleSize - API Flask v2
Sécurité : rate limiting, headers HTTP, CORS strict, validation des inputs.
"""

import os
import sys
import time
import logging
from functools import wraps
from collections import defaultdict
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from simulate import choose_statistical_method, list_possible_tests, power_curve_data

# ── Logging ────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

# ── Détection contexte dev / .exe ──────────────────────────────────────────
if getattr(sys, 'frozen', False):
    base_path = sys._MEIPASS
else:
    base_path = os.path.abspath(os.path.dirname(__file__))

frontend_build = os.path.abspath(os.path.join(base_path, '..', 'frontend', 'build'))

# ── Flask ──────────────────────────────────────────────────────────────────
app = Flask(__name__, static_folder=frontend_build)

# CORS strict : origines autorisées via variable d'environnement
ALLOWED_ORIGINS = os.environ.get(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")
CORS(app, origins=[o.strip() for o in ALLOWED_ORIGINS],
     methods=["GET", "POST", "OPTIONS"],
     allow_headers=["Content-Type"])

# ── Sécurité : headers HTTP ────────────────────────────────────────────────
@app.after_request
def security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"]         = "DENY"
    response.headers["X-XSS-Protection"]        = "1; mode=block"
    response.headers["Referrer-Policy"]          = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"]  = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline';"
    )
    return response

# ── Rate limiting simple (en mémoire) ─────────────────────────────────────
RATE_LIMIT     = int(os.environ.get("RATE_LIMIT", 60))     # requêtes max / minute
RATE_WINDOW    = 60                                          # fenêtre en secondes
_rate_store    = defaultdict(list)

def rate_limit(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        ip = request.headers.get("X-Forwarded-For", request.remote_addr or "unknown").split(",")[0].strip()
        now = time.time()
        window_start = now - RATE_WINDOW
        _rate_store[ip] = [t for t in _rate_store[ip] if t > window_start]
        if len(_rate_store[ip]) >= RATE_LIMIT:
            logger.warning("Rate limit dépassé pour %s", ip)
            return jsonify({"error": "Trop de requêtes. Réessayez dans une minute."}), 429
        _rate_store[ip].append(now)
        return f(*args, **kwargs)
    return decorated

# ── Validation des inputs ─────────────────────────────────────────────────
VALID_TESTS = {
    "ttest", "ttest_paired", "anova", "anova_rm",
    "anova_mixed", "lmm", "correlation", "chi2", "regression"
}

def validate_simplesize_input(data):
    """Retourne (True, None) ou (False, message_erreur)."""
    if not isinstance(data, dict):
        return False, "Payload JSON invalide."
    test = data.get("selected_test")
    if test not in VALID_TESTS:
        return False, f"Test '{test}' non reconnu."
    alpha = data.get("alpha", 0.05)
    power = data.get("power", 0.80)
    try:
        alpha = float(alpha)
        power = float(power)
    except (TypeError, ValueError):
        return False, "alpha et power doivent être des nombres."
    if not (0.001 <= alpha <= 0.2):
        return False, "alpha doit être entre 0.001 et 0.2."
    if not (0.5 <= power <= 0.999):
        return False, "power doit être entre 0.5 et 0.999."
    f = data.get("f", 0.25)
    try:
        f = float(f)
        if not (0.001 <= f <= 5.0):
            return False, "Taille d'effet hors limites (0.001 – 5.0)."
    except (TypeError, ValueError):
        return False, "Taille d'effet invalide."
    # Vérifier que les listes de groupes/niveaux sont bien des listes de strings
    for key in ("group_levels", "level_levels"):
        val = data.get(key, [])
        if not isinstance(val, list):
            return False, f"{key} doit être une liste."
        if len(val) > 10:
            return False, f"Trop de modalités pour {key} (max 10)."
    return True, None

# ── Servir le build React ──────────────────────────────────────────────────
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path.startswith('api/'):
        return jsonify({"error": "Not found"}), 404
    full = os.path.join(app.static_folder, path)
    if path and os.path.exists(full):
        return send_from_directory(app.static_folder, path)
    idx = os.path.join(app.static_folder, 'index.html')
    if os.path.exists(idx):
        return send_from_directory(app.static_folder, 'index.html')
    return jsonify({"status": "SimpleSize API v2.0 — frontend non bundlé"}), 200

# ── API : calcul principal ─────────────────────────────────────────────────
@app.route('/api/simplesize', methods=['POST'])
@rate_limit
def simplesize():
    data = request.get_json(force=True, silent=True)
    if data is None:
        return jsonify({"error": "JSON invalide ou vide."}), 400

    ok, msg = validate_simplesize_input(data)
    if not ok:
        return jsonify({"error": msg}), 400

    try:
        result = choose_statistical_method(data)
        logger.info("Calcul OK — test=%s n=%s mde=%s",
                    data.get("selected_test"),
                    result.get("n_per_group"),
                    result.get("mde"))
        return jsonify(result)
    except Exception as e:
        logger.error("Erreur calcul : %s", e, exc_info=True)
        return jsonify({"error": "Erreur interne de calcul."}), 500

# ── API : liste des tests ─────────────────────────────────────────────────
@app.route('/api/list_tests', methods=['POST'])
@rate_limit
def list_tests():
    data = request.get_json(force=True, silent=True) or {}
    tests = list_possible_tests(data)
    return jsonify({"possible_tests": tests})

# ── API : healthcheck ──────────────────────────────────────────────────────
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "version": "2.0.0"})

# ── Lancement ──────────────────────────────────────────────────────────────
if __name__ == '__main__':
    port  = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    logger.info("SimpleSize API démarré sur port %d (debug=%s)", port, debug)
    app.run(host="0.0.0.0", port=port, debug=debug)

@app.route('/api/power_curve', methods=['POST'])
def power_curve():
    try:
        data = request.get_json(force=True)
        points = power_curve_data(
            selected_test = data.get("selected_test", "ttest"),
            f             = float(data.get("f", 0.25)),
            alpha         = float(data.get("alpha", 0.05)),
            r             = float(data.get("r", 0.3)),
            f2            = float(data.get("f2", 0.15)),
            chi2_df       = int(data.get("chi2_df", 1)),
            n_predictors  = int(data.get("n_predictors", 1)),
            corr          = float(data.get("corr", 0.5)),
            epsilon       = float(data.get("epsilon", 1.0)),
            n_groups      = int(data.get("n_groups", 2)),
            n_levels      = int(data.get("n_levels", 2)),
            n_points      = int(data.get("n_points", 40)),
        )
        return jsonify({"points": points})
    except Exception as e:
        return jsonify({"error": str(e)}), 400
