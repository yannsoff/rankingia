# 📂 Structure du Projet - OVB Ranklist Analyzer

## Vue d'ensemble

```
/Airtable/
│
├── backend/                    # API Backend (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── routes/            # Routes API
│   │   │   ├── auth.ts        # Authentification
│   │   │   ├── dataset.ts     # Gestion des datasets (upload, parsing)
│   │   │   ├── indicator.ts   # Gestion des indicateurs
│   │   │   ├── mapping.ts     # Gestion du mapping colonnes
│   │   │   └── ranking.ts     # Calcul et export des rankings
│   │   │
│   │   ├── middleware/
│   │   │   └── auth.ts        # Middleware d'authentification
│   │   │
│   │   ├── utils/
│   │   │   └── excelParser.ts # Parsing et normalisation Excel
│   │   │
│   │   ├── types/
│   │   │   └── express.d.ts   # Types TypeScript pour Express
│   │   │
│   │   └── index.ts           # Point d'entrée du serveur
│   │
│   ├── prisma/
│   │   └── schema.prisma      # Schéma de base de données Prisma
│   │
│   ├── uploads/               # Dossier pour les fichiers uploadés (créé automatiquement)
│   ├── package.json
│   ├── tsconfig.json
│   ├── nodemon.json
│   └── .env                   # Variables d'environnement (à créer)
│
├── frontend/                  # Application React (TypeScript + Vite)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx      # Page de connexion
│   │   │   └── Dashboard.tsx      # Dashboard principal avec stepper
│   │   │
│   │   ├── components/
│   │   │   ├── Stepper.tsx        # Composant stepper de navigation
│   │   │   │
│   │   │   └── steps/             # Composants pour chaque étape
│   │   │       ├── UploadStep.tsx    # Étape 1: Upload fichier
│   │   │       ├── MappingStep.tsx   # Étape 2: Vérification mapping
│   │   │       ├── IndicatorStep.tsx # Étape 3: Choix indicateur
│   │   │       └── RankingStep.tsx   # Étape 4: Affichage ranking
│   │   │
│   │   ├── services/
│   │   │   └── api.ts             # Appels API vers le backend
│   │   │
│   │   ├── types/
│   │   │   └── index.ts           # Types TypeScript partagés
│   │   │
│   │   ├── App.tsx                # Composant principal avec routing
│   │   ├── main.tsx               # Point d'entrée React
│   │   └── index.css              # Styles globaux + Tailwind
│   │
│   ├── public/                    # Assets statiques
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── README.md                  # Documentation principale
├── QUICKSTART.md             # Guide de démarrage rapide
└── STRUCTURE.md              # Ce fichier (structure du projet)
```

## 🔄 Flux de l'Application

### 1. Authentification
- L'utilisateur se connecte avec un mot de passe simple
- Session maintenue via express-session
- Middleware `requireAuth` protège toutes les routes API

### 2. Upload & Parsing (Étape 1)
- Upload fichier Excel/CSV via multer
- Parsing avec xlsx (SheetJS)
- Normalisation des colonnes et filtrage des lignes d'en-tête
- Stockage dans la base de données PostgreSQL

### 3. Mapping (Étape 2)
- Affichage des statistiques du dataset
- Vérification du mapping automatique des colonnes
- Possibilité d'ajuster si nécessaire

### 4. Indicateurs (Étape 3)
- Liste des indicateurs prédéfinis (5 par défaut)
- Création d'indicateurs personnalisés
- Duplication et suppression d'indicateurs
- Sélection et exécution d'un indicateur

### 5. Ranking (Étape 4)
- Affichage du ranking avec podium pour le top 3
- Tri par rang, nom ou valeur
- Pagination (20 résultats par page)
- Export PDF du ranking complet

## 🗄️ Modèle de Données

### Dataset
Représente un fichier Excel uploadé
- `id`, `filename`, `originalName`, `sheetName`
- `uploadDate`, `rowCount`

### DataRow
Représente une ligne de collaborateur
- Informations personnelles: `firstName`, `lastName`, `fullName`
- Catégorie: `rankCategory`
- Métriques: `nbDealsPersonal`, `nbDealsGlobal`, `unitsBrutPersonal`, `unitsBrutGlobal`, `unitsBrutParallel`, `totalUnits`
- Coach: `coachRank`, `coachFirstName`, `coachLastName`, `coachFullName`

### ColumnMapping
Mapping entre colonnes Excel et champs internes
- `excelColumnName` ↔ `internalFieldName`

### IndicatorDefinition
Définition d'un indicateur (prédéfini ou custom)
- `name`, `description`, `type`
- `groupBy` (collaborator / coach / rank_category)
- `metricField` (quelle colonne agréger)
- `aggregation` (sum / avg / count / min / max)
- `filters` (JSON), `sortOrder`, `topN`

### RankingResult
Résultat de calcul d'un ranking (cache optionnel)
- `indicatorId`, `datasetId`
- `results` (JSON array), `computedAt`

## 🎨 Design & UX

### Principes de Design
- **Minimaliste et propre**: Pas de surcharge visuelle
- **Responsive**: Fonctionne sur desktop, tablette et mobile
- **Icônes uniquement**: Lucide React (pas d'emojis)
- **Couleurs**: Palette primary (bleu) avec accents

### Navigation
- **Stepper**: Navigation claire en 4 étapes
- **Boutons Retour**: Toujours possibilité de revenir en arrière
- **Bouton "Nouvelle analyse"**: Reset complet du workflow

### Feedback Utilisateur
- **Loading states**: Spinners pendant les opérations
- **Messages de succès**: Alertes vertes avec icônes
- **Messages d'erreur**: Alertes rouges explicites
- **Preview immédiat**: Aperçu des données après upload

## 🔒 Sécurité

- **Authentification simple**: Mot de passe unique pour usage interne
- **Sessions**: Gestion via express-session
- **Validation**: Validation des fichiers (type, taille)
- **Sanitization**: Données nettoyées avant insertion en DB
- **CORS**: Configuration restrictive

## 📊 Indicateurs Prédéfinis

1. **Top collaborateurs – Unités perso**
2. **Top collaborateurs – Unités globales**
3. **Top collaborateurs – Unités totales**
4. **Top coachs – Unités totales**
5. **Top catégories de rang – Unités totales**

## 🚀 Déploiement

### Développement
- Backend: `npm run dev` (port 3001)
- Frontend: `npm run dev` (port 5173)

### Production
- Backend: `npm run build` puis `npm start`
- Frontend: `npm run build` puis servir le dossier `dist/`
- PostgreSQL: Base de données distante avec DATABASE_URL
- Variables d'environnement: Configurer `.env` pour production

## 📝 Notes Techniques

- **TypeScript**: Utilisé partout (backend + frontend)
- **Prisma ORM**: Migrations automatiques, type-safety
- **Vite**: Build ultra-rapide pour le frontend
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icônes SVG modernes
- **PDFKit**: Génération de PDF côté serveur
- **xlsx (SheetJS)**: Parsing de fichiers Excel

---

Cette structure permet une **maintenance facile**, une **évolutivité** et une **clarté** maximale du code.

