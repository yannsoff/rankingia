# Test Rapide - Correction Persistance Indicateurs

## ⚡ Test Express (5 minutes)

### Prérequis
```bash
# Terminal 1 - Backend
cd /Users/yannsoff/Documents/Website/Airtable/backend
npm run dev

# Terminal 2 - Frontend  
cd /Users/yannsoff/Documents/Website/Airtable/frontend
npm run dev
```

### Test 1 : Créer et Réutiliser un Indicateur Multi-Rangs (2 min)

1. **Ouvrir l'application** : http://localhost:5173
2. **Connexion** avec le mot de passe
3. **Upload** un fichier Excel (ou utiliser un dataset existant)
4. **Étape 2** : Valider le mapping
5. **Étape 3** : Cliquer sur "Ranking multi-rangs"
6. **Configurer** :
   - Nom : "Test Persistance"
   - Sélectionner 2 rangs (ex: CN, CD)
   - Laisser tous les collaborateurs sélectionnés
   - Cliquer "Calculer le ranking"
7. ✅ **Vérifier** : Le ranking s'affiche

8. **Rafraîchir la page** (F5)
9. **Retourner à l'étape 3**
10. ✅ **Vérifier** : 
    - L'indicateur "Test Persistance" est visible
    - Badge bleu "Multi-rangs" affiché
    - AUCUN badge orange "⚠️ Incomplet"

11. **Cliquer "Exécuter"** sur l'indicateur sauvegardé
12. ✅ **Vérifier** : Le ranking se recalcule sans erreur

### Test 2 : Dupliquer un Indicateur (1 min)

1. Sur l'indicateur "Test Persistance"
2. **Cliquer** sur l'icône de duplication 📋
3. ✅ **Vérifier** :
   - Nouvel indicateur "Test Persistance (copie)" apparaît
   - Badge "Multi-rangs" présent
   - Pas de badge "⚠️ Incomplet"
4. **Cliquer "Exécuter"** sur la copie
5. ✅ **Vérifier** : Fonctionne correctement

### Test 3 : Vérifier les Indicateurs Standard (1 min)

1. Dans la liste "Indicateurs prédéfinis"
2. **Cliquer "Exécuter"** sur n'importe quel indicateur standard
3. ✅ **Vérifier** : Fonctionne normalement (pas d'impact)

### Test 4 : Mode Sélection Manuelle (1 min)

1. **Cliquer** sur "Sélection manuelle"
2. **Configurer** :
   - Nom : "Test Manuel"
   - Sélectionner un rang (ex: FA)
   - Ajouter 3-5 collaborateurs
   - Cliquer "Calculer le ranking"
3. ✅ **Vérifier** : Ranking correct
4. **Rafraîchir la page**
5. **Étape 3** : Cliquer "Exécuter" sur "Test Manuel"
6. ✅ **Vérifier** : Fonctionne après refresh

## ✅ Résultat Attendu

Si TOUS les tests passent :
- ✅ Les indicateurs personnalisés sont bien persistés
- ✅ Ils sont réutilisables après refresh
- ✅ La duplication conserve toute la configuration
- ✅ Les indicateurs standards fonctionnent toujours

## 🐛 Si un test échoue

### Symptôme : Badge "⚠️ Incomplet" sur un nouvel indicateur

**Cause** : Configuration non sauvegardée
**Solution** : 
1. Vérifier les logs backend (terminal 1)
2. Chercher les messages avec 💾 ou ❌
3. Vérifier que tous les champs sont envoyés dans la requête POST

### Symptôme : Erreur au clic sur "Exécuter"

**Cause** : Validation backend échoue
**Solution** :
1. Regarder le message d'erreur affiché (il doit être clair)
2. Vérifier les logs backend : `❌ Indicator validation failed`
3. Si "Configuration incomplète", dupliquer l'indicateur

### Symptôme : Indicateur disparaît après refresh

**Cause** : Problème de sauvegarde en DB
**Solution** :
1. Vérifier la base de données Prisma
2. Vérifier que `DATABASE_URL` est configuré
3. Relancer `npx prisma generate` si besoin

## 📊 Logs à Observer

### Backend (logs importants)

```
💾 Creating indicator with data: { name, rankingMode, selectedRanks, ... }
✅ Indicator created with ID: xxx-xxx-xxx

📊 MODE A - Parsed indicator config:
  - Selected ranks: [...] length: 2
  - Special operations: [...]
  - Metric field: totalUnits

✅ Mixed Ranks Ranking - Output: Total ranking rows: XX
```

### Frontend (console navigateur)

```
📤 Envoi de l'indicateur au backend:
  - Selected ranks: [...]
  - Special operations: [...]
  - Included collaborators: XX
```

## 🎯 Critères de Succès

- [x] Backend compile sans erreur ✅
- [x] Frontend compile sans erreur ✅
- [ ] Test 1 : Indicateur multi-rangs réutilisable après refresh
- [ ] Test 2 : Duplication préserve la configuration
- [ ] Test 3 : Indicateurs standard inchangés
- [ ] Test 4 : Mode sélection manuelle fonctionne

**Temps total** : ~5 minutes

