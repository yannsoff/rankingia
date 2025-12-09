# OVB Ranklist Analyzer

Application web interne pour analyser les fichiers Excel de production et générer des rankings flexibles.

## 🚀 Stack Technique

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Base de données**: PostgreSQL + Prisma ORM
- **Parsing**: xlsx (SheetJS)
- **Export**: jsPDF pour les exports PDF

## 📁 Structure du Projet

```
/Airtable
├── backend/          # API Node.js + Express
├── frontend/         # Application React
└── README.md
```

## 🛠️ Installation

### Prérequis

- Node.js 18+ installé
- PostgreSQL installé et en cours d'exécution
- npm ou yarn

### 1. Installation des dépendances

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Configuration de la base de données

Créez un fichier `.env` dans le dossier `backend/` avec le contenu suivant:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ovb_ranklist?schema=public"

# Admin password for simple auth
ADMIN_PASSWORD="votre_mot_de_passe_admin"

# Server
PORT=3001
NODE_ENV=development
```

**Remplacez** `user`, `password`, et le nom de la base de données par vos propres valeurs.

### 3. Initialisation de la base de données

Dans le dossier `backend/`, exécutez:

```bash
# Génère le client Prisma
npx prisma generate

# Crée les tables dans la base de données
npx prisma migrate dev --name init
```

### 4. Lancement de l'application

**Backend** (dans le dossier `backend/`):
```bash
npm run dev
```
Le serveur démarre sur `http://localhost:3001`

**Frontend** (dans un autre terminal, dans le dossier `frontend/`):
```bash
npm run dev
```
L'application démarre sur `http://localhost:5173`

## 📊 Utilisation

1. **Connexion**: Utilisez le mot de passe défini dans `ADMIN_PASSWORD`
2. **Upload**: Uploadez votre fichier Excel "Ranklist"
3. **Mapping**: Vérifiez/ajustez le mapping des colonnes
4. **Indicateurs**: Choisissez un indicateur prédéfini ou créez-en un personnalisé
5. **Rankings**: Visualisez les résultats et exportez en PDF

## 🔧 Commandes Utiles

### Backend
- `npm run dev` - Lance le serveur en mode développement
- `npm run build` - Compile TypeScript
- `npm start` - Lance le serveur en production
- `npx prisma studio` - Interface graphique pour la base de données

### Frontend
- `npm run dev` - Lance le dev server
- `npm run build` - Build de production
- `npm run preview` - Prévisualise le build de production

## 📝 Structure des Données Excel

Le fichier Excel attendu contient une feuille "Ranklist" avec les colonnes suivantes:

- Classement
- Prénom / Nom
- Rang
- Nbre d'affaires (perso/global)
- Unités brutes (perso/global/parallèles)
- Rang coach / Prénom du coach / Nom du coach

Les lignes contenant "Ordre de classement: XX" sont automatiquement ignorées.

## 🎯 Fonctionnalités Principales

- ✅ Upload et parsing automatique de fichiers Excel/CSV
- ✅ Normalisation intelligente des données
- ✅ Mapping flexible des colonnes
- ✅ Indicateurs prédéfinis (Top collaborateurs, Top coachs, etc.)
- ✅ Création d'indicateurs personnalisés
- ✅ Affichage de rankings avec tri et filtres
- ✅ Export PDF des rankings
- ✅ Système de correction et d'ajustement
- ✅ Interface moderne et responsive

## 🔐 Sécurité

L'application utilise une authentification simple par mot de passe pour un usage interne. Pour un usage en production externe, implémentez un système d'authentification plus robuste.

## 📧 Support

Pour toute question ou problème, contactez l'équipe technique.

