#!/bin/bash

# Script pour pusher sur GitHub - Ultra simplifié
# Pour Yann - OVB Ranklist Analyzer

echo "🚀 Push vers GitHub - OVB Ranklist Analyzer"
echo "==========================================="
echo ""

# Aller dans le bon dossier
cd /Users/yannsoff/Documents/Website/Airtable

# Vérifier si gh est installé
if ! command -v gh &> /dev/null; then
    echo "⚠️  GitHub CLI (gh) n'est pas installé."
    echo ""
    echo "📥 Installation de GitHub CLI..."
    
    # Essayer avec brew
    if command -v brew &> /dev/null; then
        brew install gh
    else
        echo "❌ Homebrew n'est pas installé."
        echo ""
        echo "👉 Ouvre ce lien dans ton navigateur pour installer GitHub CLI :"
        echo "   https://cli.github.com/"
        echo ""
        echo "Ou installe Homebrew d'abord avec cette commande :"
        echo '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
        exit 1
    fi
fi

echo ""
echo "✅ GitHub CLI est installé !"
echo ""

# Vérifier si déjà authentifié
if ! gh auth status &> /dev/null; then
    echo "🔐 Authentification GitHub requise..."
    echo ""
    echo "👉 Une fenêtre de navigateur va s'ouvrir."
    echo "   Connecte-toi à GitHub et autorise l'application."
    echo ""
    read -p "Appuie sur ENTRÉE pour continuer..."
    
    gh auth login -h github.com -p https -w
    
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ Authentification échouée."
        echo "   Essaie à nouveau ou contacte le support."
        exit 1
    fi
fi

echo ""
echo "✅ Authentification réussie !"
echo ""

# Push vers GitHub
echo "📤 Push du code vers GitHub..."
echo ""

git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 ✅ SUCCESS ! Code pushé sur GitHub !"
    echo ""
    echo "🔗 Voir ton code : https://github.com/yannsoff/rankingia"
    echo ""
    echo "📋 Prochaines étapes :"
    echo "   1. Va sur https://railway.app"
    echo "   2. Connecte-toi avec GitHub"
    echo "   3. Crée un nouveau projet depuis ton repo 'rankingia'"
    echo "   4. Railway déploiera automatiquement !"
    echo ""
else
    echo ""
    echo "❌ Erreur lors du push."
    echo "   Vérifie ta connexion internet et réessaie."
    exit 1
fi

read -p "Appuie sur ENTRÉE pour fermer..."
