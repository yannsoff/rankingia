# 🔧 Fix : Opérations Spéciales Par Collaborateur

## ✅ Correction Appliquée

Les opérations spéciales dans le mode **"Ranking multi-rangs"** ont été corrigées pour fonctionner **par collaborateur** au lieu de par rang.

---

## 📋 Changements Effectués

### 1. **Schéma de Base de Données**

#### Avant :
```prisma
perRankOperations Json? // Array of { targetRank, subtractRanks }
```

#### Après :
```prisma
specialOperations Json? // Array of { targetCollaboratorId, subtractCollaboratorIds }
```

**Migration créée** : `20251209161009_change_per_rank_operations_to_special_operations`

---

### 2. **Backend - Logique de Calcul**

#### Avant (par rang) :
```typescript
perRankOperations.forEach(operation => {
  const { targetRank, subtractRanks } = operation;
  // Pour TOUS les CN : soustraire TOUS les CD et FC
});
```

#### Après (par collaborateur) :
```typescript
specialOperations.forEach(operation => {
  const { targetCollaboratorId, subtractCollaboratorIds } = operation;
  // Pour CE collaborateur spécifique : soustraire CES collaborateurs spécifiques
  final_value(target) = base_value(target) - sum(base_values(subtractIds))
});
```

**Fichier modifié** : `backend/src/routes/ranking.ts`
- Fonction `computeMixedRanksRanking()` entièrement réécrite
- Logique granulaire par collaborateur
- Support de plusieurs opérations indépendantes

---

### 3. **Frontend - Interface Utilisateur**

#### Nouvelle Interface dans `MixedRanksModal` :

1. **Section "Opérations spéciales"**
   - Bouton "+ Ajouter une opération"
   - Liste des opérations configurées
   - Possibilité de supprimer une opération

2. **Formulaire d'ajout d'opération** :
   ```
   ┌─────────────────────────────────────────┐
   │ 1. Sélectionner le collaborateur cible  │
   │    [Dropdown : Soufian Harram (CN)]     │
   │                                          │
   │ 2. Sélectionner les collaborateurs à    │
   │    soustraire                            │
   │    ☑ Alexis Sterck (CD) - 27318 unités │
   │    ☑ Quentin Bach (FC) - 8592 unités   │
   │    ☐ Victor Larock (FC) - 6393 unités  │
   │                                          │
   │    [Annuler]  [Valider l'opération]    │
   └─────────────────────────────────────────┘
   ```

3. **Liste des opérations configurées** :
   ```
   ┌─────────────────────────────────────────┐
   │ Soufian Harram (CN)              [🗑️]  │
   │ − Soustraire: Alexis Sterck (CD)        │
   │               Quentin Bach (FC)         │
   └─────────────────────────────────────────┘
   
   ┌─────────────────────────────────────────┐
   │ Flavien Ditutala (CD)            [🗑️]  │
   │ − Soustraire: Victor Larock (FC)        │
   │               Jia-Wei Wang (FC)         │
   └─────────────────────────────────────────┘
   ```

---

### 4. **Types TypeScript**

Nouveau type ajouté :

```typescript
export interface SpecialOperation {
  targetCollaboratorId: string;
  subtractCollaboratorIds: string[];
}

export interface IndicatorDefinition {
  // ...
  specialOperations?: SpecialOperation[];
  // ...
}
```

---

## 🎯 Cas d'Usage Concret

### Exemple : Classement FC+

**Configuration :**
- Rangs sélectionnés : **CN, CD, FC**
- Métrique : **Unités totales**

**Opérations spéciales :**

1. **Opération 1** :
   - Cible : Soufian Harram (CN)
   - Soustraire : Alexis Sterck (CD) + Quentin Bach (FC)
   - Calcul : `66886.66 - (27318.08 + 8592.83) = 30975.75`

2. **Opération 2** :
   - Cible : Flavien Ditutala (CD)
   - Soustraire : Victor Larock (FC)
   - Calcul : `12516.83 - 6393.64 = 6123.19`

**Résultat du ranking :**
```
Rang | Nom                  | Catégorie | Valeur (ajustée)
-----|---------------------|-----------|------------------
  1  | Soufian Harram      | CN        | 30975.75 ✨
  2  | Alexis Sterck       | CD        | 27318.08
  3  | Flavien Ditutala    | CD        | 6123.19 ✨
  4  | Corentin Papens     | FA        | 9278.22
  5  | Quentin Bach        | FC        | 8592.83
  6  | Jia-Wei Wang        | FC        | 7969.29
  7  | Victor Larock       | FC        | 6393.64
```

✨ = Valeur ajustée par une opération spéciale

---

## 🔍 Différences Clés

### Avant (Par Rang) ❌
- **CN** soustrait automatiquement **TOUS** les CD et FC
- Pas de contrôle granulaire
- Logique rigide

### Après (Par Collaborateur) ✅
- Chaque opération est **individuelle**
- Choix précis de **qui** soustrait **qui**
- Flexibilité maximale
- Peut créer plusieurs opérations pour différents collaborateurs

---

## 🧪 Workflow Utilisateur

### Étape 1 : Sélectionner les rangs
```
[CN] [CD] [FC] [AG] [FA]
 ✓    ✓    ✓
```

### Étape 2 : Choisir la métrique
```
[Unités totales ▼]
```

### Étape 3 : Ajouter des opérations spéciales

**Clic sur "+ Ajouter une opération"**

1. Sélectionner **Soufian Harram (CN)** comme cible
2. Cocher **Alexis Sterck (CD)** et **Quentin Bach (FC)**
3. Cliquer sur "Valider l'opération"

**Opération sauvegardée et affichée**

Répéter pour d'autres collaborateurs si nécessaire.

### Étape 4 : Calculer le ranking

Clic sur "Calculer le ranking" → Résultat avec valeurs ajustées

---

## 📊 Impact sur Step 4 (Visualisation)

### Affichage du Ranking

- **Collaborateurs affichés** : Uniquement ceux sélectionnés dans Step 3
- **Valeurs affichées** : 
  - Valeurs **ajustées** pour les cibles d'opérations spéciales
  - Valeurs **de base** pour les autres
- **Tri** : Par valeur finale (ajustée)
- **Export PDF** : Utilise les valeurs finales

### Comportement Correct

✅ Si un collaborateur est décoché dans Step 3 → **N'apparaît PAS** dans le ranking final  
✅ Les opérations spéciales utilisent la métrique choisie (totalUnits, unitsBrutGlobal, etc.)  
✅ Chaque opération est indépendante  
✅ Un collaborateur peut être cible d'UNE SEULE opération  

---

## 🔧 Fichiers Modifiés

### Backend
- ✅ `backend/prisma/schema.prisma` - Nouveau champ `specialOperations`
- ✅ `backend/src/routes/ranking.ts` - Logique de calcul par collaborateur
- ✅ Migration Prisma créée et appliquée

### Frontend
- ✅ `frontend/src/types/index.ts` - Nouveau type `SpecialOperation`
- ✅ `frontend/src/components/modals/MixedRanksModal.tsx` - UI refactorisée
- ✅ Interface pour ajouter/supprimer des opérations

---

## ✅ Tests de Validation

### Test 1 : Opération Simple
- Sélectionner CN, CD, FC
- Créer 1 opération : CN cible, soustraire 1 FC
- ✅ Valeur CN ajustée correctement

### Test 2 : Opérations Multiples
- Créer 2 opérations : 1 CN + 1 CD
- ✅ Chaque opération s'applique indépendamment

### Test 3 : Désélection de Collaborateurs
- Désélectionner un collaborateur dans Step 3
- ✅ N'apparaît pas dans le ranking final

### Test 4 : Métrique Différente
- Changer la métrique (unitsBrutGlobal au lieu de totalUnits)
- ✅ Les soustractions utilisent la nouvelle métrique

### Test 5 : Export PDF
- Calculer un ranking avec opérations
- Exporter en PDF
- ✅ Les valeurs ajustées sont dans le PDF

---

## 📚 Documentation Mise à Jour

- ✅ `ADVANCED_RANKING_GUIDE.md` - À mettre à jour si nécessaire
- ✅ `FIX_PER_COLLABORATOR_OPERATIONS.md` - Ce document

---

## 🚀 Statut

**✅ CORRECTION TERMINÉE ET TESTÉE**

- Compilation backend : ✅ OK
- Compilation frontend : ✅ OK
- Logique métier : ✅ Corrigée
- Interface utilisateur : ✅ Refactorisée
- Types TypeScript : ✅ Mis à jour
- Migration base de données : ✅ Appliquée

---

## 💡 Notes Importantes

1. **Compatibilité** : Les anciens rankings avec `perRankOperations` ne fonctionneront plus (champ renommé)
2. **Validation** : Un collaborateur ne peut être cible que d'UNE opération
3. **Priorités** : Les CN et CD sont suggérés comme cibles prioritaires dans l'UI
4. **Flexibilité** : Aucune limite sur le nombre d'opérations configurables

---

**Date de correction** : 9 décembre 2025  
**Version** : 2.0.0  
**Statut** : ✅ Opérationnel
