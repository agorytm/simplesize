# SimpleSize v2 — Guide de déploiement

## Architecture
```
GitHub ──► Vercel (frontend React)
       └──► Railway (backend Flask)
```

---

## 1. Pousser sur GitHub

```bash
cd C:\Users\lesur\Desktop\SimpleSize_v2
git init
git add .
git commit -m "SimpleSize v2 — initial commit"
git remote add origin https://github.com/TON_USERNAME/simplesize.git
git push -u origin main
```

---

## 2. Déployer le backend sur Railway

1. Aller sur [railway.app](https://railway.app) → **New Project → Deploy from GitHub**
2. Sélectionner le dépôt `simplesize`
3. Choisir le **dossier `backend`** comme root directory
4. Railway détecte `Procfile` automatiquement
5. Ajouter les variables d'environnement dans Railway :
   ```
   CORS_ORIGINS=https://simplesize.vercel.app
   FLASK_DEBUG=false
   RATE_LIMIT=60
   ```
6. Copier l'URL générée par Railway (ex: `https://simplesize-api.up.railway.app`)

---

## 3. Configurer l'URL API dans le frontend

Éditer `.env.production` :
```
REACT_APP_API_URL=https://simplesize-api.up.railway.app
```
Puis committer + pusher ce changement.

---

## 4. Déployer le frontend sur Vercel

1. Aller sur [vercel.com](https://vercel.com) → **New Project → Import Git Repository**
2. Sélectionner le dépôt `simplesize`
3. **Root Directory** : `frontend`
4. **Build Command** : `npm run build`
5. **Output Directory** : `build`
6. Cliquer **Deploy**

Vercel génère une URL comme `https://simplesize.vercel.app`.

---

## 5. Mettre à jour CORS

Dans Railway, mettre à jour la variable `CORS_ORIGINS` avec l'URL Vercel finale.

---

## Déploiement continu

À chaque `git push` sur `main` :
- Vercel rebuild et redéploie le frontend automatiquement
- Railway rebuild et redéploie le backend automatiquement

---

## Sécurité en place

| Mesure | Description |
|--------|-------------|
| CORS strict | Seul le domaine Vercel est autorisé |
| Rate limiting | 60 req/min/IP (configurable) |
| Validation inputs | Tous les paramètres sont vérifiés |
| Headers HTTP | X-Frame-Options, CSP, XSS-Protection, etc. |
| HTTPS | Automatique sur Vercel + Railway |
| No secrets in code | Variables d'env Railway, jamais dans le code |

---

## Développement local

```bash
# Backend
cd backend
pip install -r requirements.txt
python app.py

# Frontend (autre terminal)
cd frontend
npm install
npm start
```
