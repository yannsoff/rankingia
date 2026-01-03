# ⚡ Test Rapide - Bouton "Exécuter" Indicateur Enregistré

## 🎯 Objectif

Vérifier que le bouton "Exécuter" d'un indicateur enregistré fonctionne correctement sur un nouveau fichier, avec feedback clair en cas de problème.

## ⏱️ Temps Estimé : 5 minutes

---

## 🧪 Test 1 : Scénario Nominal (2 min)

### Setup

1. **Démarrer** l'application :
   ```bash
   # Terminal 1
   cd backend && npm run dev
   
   # Terminal 2
   cd frontend && npm run dev
   ```

2. **Ouvrir** http://localhost:5173
3. **Se connecter** avec `admin123`

### Étapes

1. **Upload Fichier A** contenant les rangs JFA4 et JFAC3
2. **Step 2** : Valider le mapping
3. **Step 3** : Cliquer "Ranking multi-rangs"
4. **Configurer** :
   - Nom : `Test Execute Button`
   - Sélectionner : JFA4 + JFAC3
   - Cliquer "Calculer le ranking"
5. ✅ **Vérifier** : Résultat s'affiche

6. **Nouvelle analyse** (bouton en haut à droite)
7. **Upload le MÊME Fichier A** (ou fichier B avec JFA4 et JFAC3)
8. **Step 2** : Valider le mapping
9. **Step 3** : Trouver "Test Execute Button" dans la liste

### Vérifications

✅ **Bouton bleu** (pas orange)  
✅ **Pas de badge "⚠️ Incomplet"**  
✅ **Cliquer "Exécuter"** → Résultat s'affiche immédiatement  
✅ **Console (F12)** affiche :
```
🎯 handleRunIndicator called
📤 Sending ranking computation request
✅ Ranking computed successfully
```

---

## 🧪 Test 2 : Fichier Incompatible (2 min)

### Étapes

1. **Reprendre** depuis l'état ci-dessus (indicateur "Test Execute Button" enregistré)
2. **Nouvelle analyse**
3. **Upload Fichier C** qui contient SEULEMENT CN, CD, FC (sans JFA4/JFAC3)
4. **Step 2** : Valider le mapping
5. **Step 3** : Trouver "Test Execute Button"

### Vérifications

🟠 **Bouton ORANGE** (si config incomp reste incomp) ou **BLEU**  
✅ **Cliquer "Exécuter"** → **Message d'erreur s'affiche** :

```
Rangs incompatibles avec ce fichier : JFA4, JFAC3

💡 Ce fichier ne contient pas les rangs requis (JFA4, JFAC3).
Rangs disponibles : CN, CD, FC, FA, AG
```

✅ **Console affiche** :
```
🎯 handleRunIndicator called
📤 Sending ranking computation request
❌ Error computing ranking
Error details: { status: 400, ... }
```

✅ **Network (F12 → Network)** :
- Request : `POST /api/rankings/compute`
- Status : `400`
- Response body contient `error` et `hint`

---

## 🧪 Test 3 : Bouton Désactivé Silencieux (1 min)

### Setup

Si un indicateur a une config vide/corrompue (pour simuler, vous pouvez éditer manuellement en DB).

### Étapes

1. **Cliquer** sur bouton orange "Exécuter"

### Vérifications

⚠️ **Alerte JavaScript apparaît** :
```
⚠️ Configuration incomplète

Cet indicateur ne peut pas être exécuté car sa configuration est incomplète.

Veuillez le dupliquer pour le reconfigurer avec le fichier actuel.
```

✅ **Console affiche** :
```
🖱️ Execute button clicked { isConfigComplete: false }
⚠️ Indicator configuration incomplete
```

✅ **PAS de requête** envoyée (vérifier Network)

---

## ✅ Critères de Succès

### Test 1 : Fichier Compatible
- [x] Bouton bleu, pas de badge warning
- [x] Clic → résultat affiché immédiatement
- [x] Logs console avec 🎯 📤 ✅
- [x] Aucune erreur

### Test 2 : Fichier Incompatible
- [x] Clic → message d'erreur clair affiché
- [x] Message indique les rangs manquants
- [x] Message indique les rangs disponibles
- [x] Logs console avec 🎯 📤 ❌
- [x] Status 400 dans Network

### Test 3 : Config Incomplète
- [x] Alerte JavaScript au clic
- [x] Message clair et actionnable
- [x] Logs console avec 🖱️ ⚠️
- [x] Pas de requête envoyée

## 🐛 Si un Test Échoue

### Symptôme : Clic ne fait RIEN (pas d'alerte, pas d'erreur)

**Causes possibles** :
1. `handleExecuteClick` non attaché au bouton
2. `isComputing` reste à `true`
3. JavaScript crashé (vérifier Console pour erreurs rouges)

**Actions** :
1. Rafraîchir la page (F5)
2. Vérifier Console pour stack trace
3. Vérifier que le build frontend est à jour

### Symptôme : Message d'erreur générique

**Cause** : Backend ne renvoie pas `hint`

**Actions** :
1. Vérifier logs backend (terminal 1)
2. Chercher `❌ Indicator validation failed`
3. Vérifier que validation retourne bien `{ error, hint }`

### Symptôme : Bouton reste bleu au lieu d'orange

**Cause** : `isConfigurationComplete()` retourne `true` à tort

**Actions** :
1. Console → Chercher `⚠️ Indicator configuration incomplete`
2. Vérifier `selectedRanks` et `includedCollaboratorIds` dans l'objet indicator
3. Si les champs sont présents → c'est normal que le bouton soit bleu

---

## 📊 Logs Attendus - Référence

### Scénario Succès

```
🎯 handleRunIndicator called {
  indicatorId: "xxx-xxx-xxx",
  indicatorName: "Test Execute Button",
  datasetId: "yyy-yyy-yyy",
  rankingMode: "mixedRanks",
  hasSelectedRanks: true,
  hasIncludedCollaborators: true
}
📤 Sending ranking computation request: {
  indicatorId: "xxx-xxx-xxx",
  datasetId: "yyy-yyy-yyy"
}
✅ Ranking computed successfully: { totalRows: 25 }
```

### Scénario Erreur (Rangs Manquants)

```
🎯 handleRunIndicator called { ... }
📤 Sending ranking computation request...
❌ Error computing ranking: Error: Request failed with status code 400
Error details: {
  status: 400,
  data: {
    error: "Rangs incompatibles avec ce fichier : JFA4, JFAC3",
    hint: "Ce fichier ne contient pas les rangs requis..."
  }
}
```

### Scénario Config Incomplète

```
🖱️ Execute button clicked {
  indicatorId: "xxx-xxx-xxx",
  name: "Test Execute Button",
  isConfigComplete: false,
  isComputing: false
}
⚠️ Indicator configuration incomplete: {
  indicatorId: "xxx-xxx-xxx",
  name: "Test Execute Button",
  mode: "mixedRanks",
  hasSelectedRanks: false,
  hasCollaborators: true,
  selectedRanks: null,
  includedCollaboratorIds: [...]
}
```

---

## 🎯 Résultat Final

Si **TOUS** les tests passent :

✅ **Le problème est résolu !**

L'utilisateur peut maintenant :
- Créer un indicateur avec fichier A
- L'exécuter sur fichier B sans reconfigurer
- Recevoir un message clair si fichier incompatible
- Ne JAMAIS avoir un clic qui "ne fait rien"

---

**Guide complet** : `FIX_EXECUTE_BUTTON_SILENT_FAIL.md`  
**Durée** : ~5 minutes  
**Difficulté** : Facile

