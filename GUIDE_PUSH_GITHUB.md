# 🚀 Guide Simple : Push sur GitHub

## ✨ Ce que tu dois faire (5 minutes max)

### **Option 1 : La Plus Simple (Recommandée)**

#### 1️⃣ **Ouvre le Terminal**
- Appuie sur `Cmd + Espace`
- Tape "Terminal"
- Appuie sur `Entrée`

#### 2️⃣ **Copie-colle cette commande**
```bash
/bin/bash -c "$(curl -fsSL https://cli.github.com/install.sh)" && cd /Users/yannsoff/Documents/Website/Airtable && gh auth login && git push -u origin main
```

#### 3️⃣ **Suis les instructions**
Le terminal va :
1. Installer GitHub CLI
2. Te demander de te connecter (une page web s'ouvrira)
3. Pusher ton code automatiquement

---

### **Option 2 : Étape par Étape (Si Option 1 ne marche pas)**

#### **Étape A : Installer GitHub CLI**

**Dans le terminal, copie-colle :**
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
⏳ Attends 2-3 minutes que ça s'installe

Puis :
```bash
brew install gh
```

#### **Étape B : Aller dans le dossier**
```bash
cd /Users/yannsoff/Documents/Website/Airtable
```

#### **Étape C : Se connecter à GitHub**
```bash
gh auth login
```

**Réponds aux questions :**
- Protocol ? → `HTTPS` (Entrée)
- Authenticate Git ? → `Y` (Entrée)  
- How to authenticate ? → `Login with a web browser` (Entrée)

👉 **Un code s'affiche** (ex: A1B2-C3D4)

Une page web s'ouvre :
1. Entre le code affiché
2. Clique "Authorize"
3. Reviens au terminal

✅ Tu verras "Authentication complete"

#### **Étape D : Push le code**
```bash
git push -u origin main
```

⏳ Attends 10-20 secondes...

✅ **Tu verras :**
```
Writing objects: 100% ...
To https://github.com/yannsoff/rankingia.git
 * [new branch]      main -> main
```

🎉 **C'EST BON !**

---

## 🔗 Après le Push

1. **Vérifie sur GitHub :**
   👉 https://github.com/yannsoff/rankingia
   
   Tu devrais voir tous tes fichiers !

2. **Déploie sur Railway :**
   - Va sur https://railway.app
   - Connecte-toi avec GitHub
   - Clique "New Project" → "Deploy from GitHub repo"
   - Sélectionne `yannsoff/rankingia`
   - Railway déploiera automatiquement !

---

## ❓ Problèmes Courants

### "command not found: brew"
👉 Installe Homebrew d'abord :
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### "Authentication failed"
👉 Assure-toi d'être connecté à GitHub dans ton navigateur

### "Permission denied"
👉 Vérifie que tu as bien les droits sur le repo `rankingia`

---

## 💬 Besoin d'aide ?

Copie-colle le message d'erreur exact et je t'aiderai !

---

**Créé le :** 9 décembre 2025  
**Projet :** OVB Ranklist Analyzer
