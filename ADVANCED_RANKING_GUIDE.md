# Guide des Rankings Avancés

## Vue d'ensemble

Deux nouveaux modes de ranking avancés ont été implémentés pour offrir une flexibilité maximale dans l'analyse des données de production :

### 🎯 MODE A : Ranking Multi-Rangs avec Opérations
Permet de combiner plusieurs catégories de rang (max 3) avec des opérations arithmétiques spéciales pour CN et CD.

### 👤 MODE B : Ranking avec Sélection Manuelle
Permet de créer un ranking dans un seul rang avec une sélection manuelle et précise des collaborateurs.

---

## MODE A : Ranking Multi-Rangs avec Opérations

### Fonctionnalités

#### 1. Sélection de Rangs (Max 3)
- Sélectionnez jusqu'à **3 catégories de rang** (CN, CD, FC, AG, FA, etc.)
- Interface à boutons cliquables avec limite visuelle
- Message d'avertissement si tentative de dépasser 3 rangs

#### 2. Opérations Spéciales pour CN et CD
Pour les rangs **CN** et **CD**, vous pouvez définir des **soustractions** :

**Exemple :**
- Rangs sélectionnés : CN, CD, FC
- Pour CN : soustraire CD et FC
- Pour CD : soustraire FC

**Calcul :**
```
Métrique finale CN = Métrique brute CN - (Métrique CD + Métrique FC)
Métrique finale CD = Métrique brute CD - Métrique FC
Métrique finale FC = Métrique brute FC (pas de soustraction)
```

**Interface :**
- Checkboxes pour sélectionner les rangs à soustraire
- Configuration par rang cible (CN/CD)
- Validation automatique des opérations

#### 3. Sélection des Collaborateurs
- **Par défaut** : tous les collaborateurs des rangs sélectionnés sont inclus
- **Personnalisation** : 
  - Désélectionner des collaborateurs spécifiques
  - Boutons "Tout sélectionner" / "Tout désélectionner"
  - Vue en liste avec nom, rang et unités totales

#### 4. Choix de la Métrique
Sélectionnez la métrique à utiliser pour le calcul :
- Unités totales (perso + global + parallèles)
- Unités brutes personnelles
- Unités brutes globales
- Unités brutes parallèles
- Nombre d'affaires perso
- Nombre d'affaires global

### Cas d'usage

**Exemple 1 : Ranking CN pur**
- Sélectionner uniquement CN
- Soustraction CN - (CD + FC)
- Permet de voir les CN qui ne viennent pas de promotions internes

**Exemple 2 : Comparaison multi-niveaux**
- Sélectionner CN + CD + FC
- Configurer les soustractions appropriées
- Comparer les performances ajustées de chaque niveau

---

## MODE B : Ranking avec Sélection Manuelle

### Fonctionnalités

#### 1. Sélection du Rang
- Dropdown avec tous les rangs disponibles dans le dataset
- Un seul rang sélectionnable

#### 2. Recherche et Ajout de Collaborateurs

**Interface double panneau :**

**Panneau gauche : Collaborateurs disponibles**
- Barre de recherche (recherche par prénom/nom)
- Liste filtrée des collaborateurs du rang sélectionné
- Bouton "+" pour ajouter à la sélection

**Panneau droit : Collaborateurs sélectionnés**
- Liste des collaborateurs choisis
- Compteur du nombre de sélections
- Bouton "🗑️" pour retirer de la sélection

#### 3. Choix de la Métrique
Identique au MODE A :
- Unités totales
- Unités personnelles
- Unités globales
- Unités parallèles
- Nombre d'affaires

### Cas d'usage

**Exemple 1 : Top performers FA**
- Rang : FA
- Rechercher et sélectionner les 10 meilleurs FA
- Métrique : Unités totales
- Créer un ranking personnalisé pour une présentation

**Exemple 2 : Suivi d'une équipe spécifique**
- Rang : AG
- Sélectionner tous les AG d'une région
- Métrique : Nombre d'affaires perso
- Analyser la performance d'une équipe ciblée

---

## Accès aux Modes Avancés

### Dans l'interface

1. **Étape 3 : Indicateurs**
2. Section **"Options de ranking avancées"** (encadré bleu)
3. Deux boutons :
   - 🔷 **Ranking multi-rangs** (MODE A)
   - 🔵 **Sélection manuelle** (MODE B)

### Workflow

```
1. Cliquer sur le mode souhaité
   ↓
2. Configurer les paramètres dans le modal
   ↓
3. Donner un nom au ranking
   ↓
4. Cliquer sur "Calculer le ranking"
   ↓
5. Visualiser le résultat dans l'étape 4
   ↓
6. Exporter en PDF si nécessaire
```

---

## Architecture Technique

### Backend

#### Nouvelles Routes
- `GET /api/collaborators` : Rechercher des collaborateurs
  - Paramètres : `datasetId`, `rankCategory`, `search`
- `GET /api/collaborators/ranks` : Obtenir les rangs disponibles

#### Schéma Prisma Étendu
Nouveaux champs dans `IndicatorDefinition` :
- `rankingMode` : "standard" | "mixedRanks" | "singleRankSelection"
- `selectedRanks` : Array de rangs sélectionnés
- `perRankOperations` : Array d'opérations de soustraction
- `includedCollaboratorIds` : IDs des collaborateurs inclus
- `excludedCollaboratorIds` : IDs des collaborateurs exclus

#### Logique de Calcul

**MODE A : `computeMixedRanksRanking()`**
1. Filtrer par rangs sélectionnés
2. Appliquer filtres collaborateurs
3. Calculer métriques de base par collaborateur
4. Appliquer opérations de soustraction (CN/CD)
5. Trier et assigner rangs

**MODE B : `computeSingleRankRanking()`**
1. Filtrer par rang unique
2. Filtrer par collaborateurs sélectionnés
3. Calculer métrique choisie
4. Trier et assigner rangs

### Frontend

#### Nouveaux Composants
- `MixedRanksModal.tsx` : Modal pour MODE A
- `SingleRankModal.tsx` : Modal pour MODE B

#### Intégration
- Ajout dans `IndicatorStep.tsx`
- Nouveaux types dans `types/index.ts`
- API dans `services/api.ts`

---

## Export PDF

Les rankings créés avec les modes avancés sont **entièrement compatibles** avec l'export PDF existant :

- Même format de tableau
- Métadonnées incluses (nom, description, date)
- Colonnes : Rang, Nom, Catégorie, Valeur
- Pagination automatique

---

## Exemples Concrets

### Exemple 1 : Ranking CN Ajusté

**Configuration :**
- Mode : Multi-rangs
- Rangs : CN, CD, FC
- Opération CN : soustraire CD + FC
- Métrique : Unités totales
- Collaborateurs : Tous sélectionnés

**Résultat :**
Un ranking des CN montrant leur contribution "nette" après ajustement des promotions internes.

### Exemple 2 : Top 20 FA de la région Est

**Configuration :**
- Mode : Sélection manuelle
- Rang : FA
- Recherche : "Martin", "Dupont", "Bernard"... (20 personnes)
- Métrique : Unités brutes personnelles

**Résultat :**
Un ranking personnalisé des 20 FA sélectionnés, idéal pour une réunion d'équipe.

---

## Notes Importantes

### Limites
- **MODE A** : Maximum 3 rangs simultanés
- **Opérations** : Soustractions uniquement pour CN et CD
- **Performance** : Optimisé pour datasets jusqu'à 10 000 lignes

### Bonnes Pratiques
1. Donner des noms descriptifs aux rankings
2. Ajouter une description pour expliquer la configuration
3. Vérifier le nombre de collaborateurs sélectionnés avant calcul
4. Exporter les rankings importants en PDF pour archivage

### Compatibilité
- Compatible avec tous les datasets existants
- Pas d'impact sur les indicateurs prédéfinis
- Les rankings créés sont sauvegardés comme indicateurs personnalisés

---

## Support

Pour toute question ou problème :
1. Vérifier que le dataset est bien chargé (Étape 1)
2. Vérifier le mapping des colonnes (Étape 2)
3. S'assurer que les rangs existent dans le dataset
4. Consulter la console du navigateur en cas d'erreur

---

**Version :** 1.0  
**Date :** Décembre 2025  
**Statut :** ✅ Opérationnel
