# ✅ TO-DO Liste pour Démarrer l'Application

## 📋 Checklist de Démarrage

### 1. ✅ Installer les Prérequis

- [ ] **Node.js 18+** installé
  - Vérifier : `node --version`
  - Si non installé : https://nodejs.org/

- [ ] **PostgreSQL** installé et démarré
  - Vérifier : `psql --version`
  - Si non installé : https://www.postgresql.org/download/
  - macOS: `brew install postgresql@15` puis `brew services start postgresql@15`

### 2. 🗄️ Configurer PostgreSQL

```bash
# Se connecter à PostgreSQL
psql postgres

# Créer la base de données
CREATE DATABASE ovb_ranklist;

# Quitter
\q
```

### 3. ⚙️ Configuration Backend

```bash
# Aller dans le dossier backend
cd backend

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# IMPORTANT: Éditer le fichier .env
# Ouvrir avec votre éditeur et modifier:
# - DATABASE_URL (mettre vos identifiants PostgreSQL)
# - ADMIN_PASSWORD (choisir un mot de passe sécurisé)

# Générer Prisma Client
npx prisma generate

# Créer les tables dans la base de données
npx prisma migrate dev --name init

# Vérifier que tout fonctionne
npm run dev
```

✅ Si tout va bien, vous devriez voir : **"🚀 Server running on http://localhost:3001"**

### 4. 🎨 Configuration Frontend

Ouvrir un **NOUVEAU TERMINAL** :

```bash
# Aller dans le dossier frontend
cd frontend

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

✅ Si tout va bien, vous devriez voir : **"Local: http://localhost:5173/"**

### 5. 🌐 Tester l'Application

1. Ouvrir le navigateur sur **http://localhost:5173**
2. Vous devriez voir la page de connexion
3. Entrer le mot de passe défini dans `.env` (par défaut: `admin123`)
4. Vous êtes connecté ! 🎉

### 6. 📁 Préparer un Fichier Excel de Test

Créez un fichier Excel avec les colonnes suivantes (exactement ces noms) :

| Colonne | Type | Description |
|---------|------|-------------|
| Classement | Nombre | Ordre de classement |
| Prénom | Texte | Prénom du collaborateur |
| Nom | Texte | Nom du collaborateur |
| Rang | Texte | Catégorie (CN, CD, FC, AG, FA, etc.) |
| Nbre d'affaires<br>(perso) | Nombre | Nombre d'affaires personnelles |
| Nbre d'affaires<br>(global) | Nombre | Nombre d'affaires globales |
| Unités brutes<br>(perso) | Nombre | Unités brutes personnelles |
| Unités brutes<br>(global) | Nombre | Unités brutes globales |
| Unités brutes<br>(parallèles) | Nombre | Unités brutes parallèles |
| Rang coach | Texte | Rang du coach |
| Prénom du coach | Texte | Prénom du coach |
| Nom du coach | Texte | Nom du coach |

**IMPORTANT** :
- Nommez la feuille : **"Ranklist"**
- Les lignes contenant "Ordre de classement: XX" seront automatiquement ignorées

### 7. 🧪 Tester le Workflow Complet

1. **Étape 1 - Upload** :
   - Uploadez votre fichier Excel
   - Vérifiez que les statistiques s'affichent correctement

2. **Étape 2 - Mapping** :
   - Vérifiez que toutes les colonnes sont bien mappées
   - Cliquez sur "Continuer"

3. **Étape 3 - Indicateurs** :
   - Vous devriez voir 5 indicateurs prédéfinis
   - Cliquez sur "Exécuter" pour l'un d'eux

4. **Étape 4 - Ranking** :
   - Visualisez le ranking
   - Testez le tri par colonne
   - Testez la pagination
   - Cliquez sur "Exporter PDF"

## 🔧 Dépannage Rapide

### Le backend ne démarre pas

**Erreur de connexion PostgreSQL ?**
```bash
# Vérifier que PostgreSQL tourne
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# Vérifier que la base existe
psql postgres -c "\l"
```

**Erreur Prisma ?**
```bash
cd backend
npx prisma generate
npx prisma migrate reset  # ⚠️ Supprime toutes les données
```

### Le frontend ne se connecte pas au backend

1. Vérifier que le backend tourne bien (http://localhost:3001/api/health)
2. Vérifier que les deux serveurs tournent en même temps
3. Vider le cache du navigateur (Cmd+Shift+R ou Ctrl+Shift+R)

### Erreur lors de l'upload

1. Vérifier que le fichier est bien au format .xlsx
2. Vérifier que la feuille s'appelle "Ranklist"
3. Vérifier que les colonnes correspondent exactement

### Port déjà utilisé

```bash
# Trouver le processus qui utilise le port 3001
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows

# Tuer le processus
kill -9 <PID>
```

## 📚 Documentation Disponible

- **README.md** : Documentation complète
- **QUICKSTART.md** : Guide de démarrage rapide
- **STRUCTURE.md** : Architecture du projet
- **DEPLOYMENT.md** : Guide de déploiement en production

## 🎯 Fonctionnalités Principales

✅ Upload de fichiers Excel/CSV
✅ Parsing et normalisation automatique
✅ Mapping flexible des colonnes
✅ 5 indicateurs prédéfinis
✅ Création d'indicateurs personnalisés
✅ Affichage de rankings avec tri et pagination
✅ Export PDF des rankings
✅ Interface moderne et responsive
✅ Authentification simple

## 📧 Besoin d'Aide ?

Si vous rencontrez des problèmes :

1. Vérifiez les logs du backend (dans le terminal où tourne `npm run dev`)
2. Ouvrez la console du navigateur (F12) pour voir les erreurs frontend
3. Vérifiez que tous les prérequis sont bien installés
4. Relisez le QUICKSTART.md étape par étape

## 🚀 Prochaines Étapes

Une fois que tout fonctionne en local :

1. Testez avec vos vrais fichiers Excel
2. Créez des indicateurs personnalisés selon vos besoins
3. Ajustez les mappings si nécessaire
4. Consultez DEPLOYMENT.md pour mettre en production

---

**Bon développement ! 💪**

