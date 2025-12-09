# 🚀 DÉMARRAGE RAPIDE - 2 Minutes Chrono !

## ⚡ Installation Express (copier-coller dans le terminal)

### Terminal 1 - Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

✅ **Le backend devrait tourner sur http://localhost:3001**

---

### Terminal 2 - Frontend (ouvrir un NOUVEAU terminal)

```bash
cd frontend
npm install
npm run dev
```

✅ **Le frontend devrait tourner sur http://localhost:5173**

---

## 🎯 Accéder à l'Application

1. Ouvrir votre navigateur
2. Aller sur **http://localhost:5173**
3. Mot de passe par défaut : **admin123**

---

## ⚠️ Si Erreur PostgreSQL

```bash
# 1. Vérifier que PostgreSQL tourne
brew services start postgresql@15  # macOS
sudo systemctl start postgresql    # Linux

# 2. Créer la base de données
psql postgres -c "CREATE DATABASE ovb_ranklist;"

# 3. Vérifier le fichier backend/.env
cat backend/.env
# DATABASE_URL doit pointer vers votre PostgreSQL
```

---

## 📁 Tester avec un Fichier

Créez un fichier Excel avec la feuille nommée **"Ranklist"** contenant :

- Prénom / Nom
- Rang
- Unités brutes (perso)
- Unités brutes (global)
- Unités brutes (parallèles)
- Prénom du coach / Nom du coach

Uploadez-le dans l'application et laissez la magie opérer ! ✨

---

## 🔥 Commandes Utiles

```bash
# Voir la base de données en interface graphique
cd backend
npx prisma studio

# Redémarrer le backend
# Ctrl+C puis npm run dev

# Build pour production
cd backend && npm run build
cd frontend && npm run build
```

---

## 📚 Documentation Complète

- **README.md** → Documentation principale
- **QUICKSTART.md** → Guide détaillé
- **TODO_UTILISATEUR.md** → Checklist complète
- **STRUCTURE.md** → Architecture du code
- **DEPLOYMENT.md** → Mise en production

---

**C'est parti ! 🎉**

