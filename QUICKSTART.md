# 🚀 Guide de Démarrage Rapide - OVB Ranklist Analyzer

## ⚡ Installation en 5 minutes

### 1. Prérequis

Assurez-vous d'avoir installé :
- **Node.js 18+** : [Télécharger ici](https://nodejs.org/)
- **PostgreSQL** : [Télécharger ici](https://www.postgresql.org/download/)

### 2. Créer la base de données PostgreSQL

Ouvrez un terminal et connectez-vous à PostgreSQL :

```bash
# macOS/Linux
psql postgres

# Ou si vous avez un utilisateur postgres
psql -U postgres
```

Créez la base de données :

```sql
CREATE DATABASE ovb_ranklist;
\q
```

### 3. Configuration du Backend

```bash
# Aller dans le dossier backend
cd backend

# Installer les dépendances
npm install

# Créer le fichier .env (si pas déjà fait)
# Éditez backend/.env et mettez vos identifiants PostgreSQL

# Générer Prisma Client
npx prisma generate

# Créer les tables dans la base de données
npx prisma migrate dev --name init

# Démarrer le serveur backend
npm run dev
```

Le backend devrait maintenant tourner sur **http://localhost:3001** ✅

### 4. Configuration du Frontend

Ouvrez un **nouveau terminal** :

```bash
# Aller dans le dossier frontend
cd frontend

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

Le frontend devrait maintenant tourner sur **http://localhost:5173** ✅

### 5. Connexion à l'Application

1. Ouvrez votre navigateur sur **http://localhost:5173**
2. Utilisez le mot de passe par défaut : **admin123**
   (Vous pouvez le changer dans `backend/.env` → `ADMIN_PASSWORD`)

## 📁 Tester avec un fichier Excel

1. **Créez un fichier Excel** avec les colonnes suivantes :
   - Classement
   - Prénom
   - Nom
   - Rang
   - Nbre d'affaires (perso)
   - Nbre d'affaires (global)
   - Unités brutes (perso)
   - Unités brutes (global)
   - Unités brutes (parallèles)
   - Rang coach
   - Prénom du coach
   - Nom du coach

2. **Nommez la feuille** : `Ranklist`

3. **Uploadez le fichier** dans l'application

## 🛠️ Commandes Utiles

### Backend

```bash
# Démarrage en dev
npm run dev

# Build pour production
npm run build

# Démarrage en production
npm start

# Voir la base de données
npx prisma studio
```

### Frontend

```bash
# Démarrage en dev
npm run dev

# Build pour production
npm run build

# Prévisualiser le build
npm run preview
```

## 🔧 Troubleshooting

### Erreur de connexion à la base de données

Vérifiez que :
- PostgreSQL est bien démarré
- Les identifiants dans `backend/.env` sont corrects
- La base de données `ovb_ranklist` existe

### Le frontend ne se connecte pas au backend

Vérifiez que :
- Le backend tourne bien sur le port 3001
- Aucun firewall ne bloque la connexion
- Les deux serveurs tournent en même temps

### Erreur lors de l'upload de fichier

Vérifiez que :
- Le fichier est au format .xlsx ou .csv
- La feuille s'appelle bien "Ranklist"
- Les colonnes correspondent au format attendu

## 📧 Support

Pour toute question, référez-vous au fichier `README.md` principal.

---

**Bon développement ! 🎉**

