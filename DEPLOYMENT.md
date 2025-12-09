# 🚀 Guide de Déploiement - OVB Ranklist Analyzer

## Déploiement sur un Serveur de Production

### Option 1: VPS Linux (Ubuntu/Debian)

#### 1. Prérequis Serveur

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Installer PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Installer nginx (pour servir le frontend et reverse proxy)
sudo apt install -y nginx

# Installer PM2 (gestionnaire de processus Node.js)
sudo npm install -g pm2
```

#### 2. Configurer PostgreSQL

```bash
# Se connecter à PostgreSQL
sudo -u postgres psql

# Créer un utilisateur et une base de données
CREATE USER ovb_user WITH PASSWORD 'votre_mot_de_passe_securise';
CREATE DATABASE ovb_ranklist OWNER ovb_user;
GRANT ALL PRIVILEGES ON DATABASE ovb_ranklist TO ovb_user;
\q
```

#### 3. Cloner et Configurer le Projet

```bash
# Cloner le projet (ou transférer via FTP/SCP)
cd /var/www/
git clone <votre-repo> ovb-ranklist
cd ovb-ranklist

# Backend
cd backend
npm install --production
cp .env.template .env
nano .env  # Éditer avec vos vraies valeurs

# Générer Prisma et migrer
npx prisma generate
npx prisma migrate deploy

# Build
npm run build

# Frontend
cd ../frontend
npm install
nano .env  # Si nécessaire, configurer l'URL de l'API
npm run build
```

#### 4. Configuration Nginx

Créez `/etc/nginx/sites-available/ovb-ranklist` :

```nginx
server {
    listen 80;
    server_name votre-domaine.com;  # Changez ceci

    # Frontend (fichiers statiques)
    location / {
        root /var/www/ovb-ranklist/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API Backend (reverse proxy)
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Activer le site :

```bash
sudo ln -s /etc/nginx/sites-available/ovb-ranklist /etc/nginx/sites-enabled/
sudo nginx -t  # Tester la configuration
sudo systemctl reload nginx
```

#### 5. Démarrer le Backend avec PM2

```bash
cd /var/www/ovb-ranklist/backend

# Démarrer avec PM2
pm2 start dist/index.js --name ovb-backend

# Sauvegarder la configuration PM2
pm2 save

# Configurer PM2 pour démarrer au boot
pm2 startup
# Suivre les instructions affichées

# Vérifier que ça tourne
pm2 status
pm2 logs ovb-backend
```

#### 6. Sécuriser avec HTTPS (Let's Encrypt)

```bash
# Installer Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtenir un certificat SSL
sudo certbot --nginx -d votre-domaine.com

# Le renouvellement automatique est configuré par défaut
```

### Option 2: Hébergement Cloud (Heroku, Railway, Render, etc.)

#### Backend (par exemple sur Railway)

1. Créer un nouveau projet sur Railway
2. Ajouter un service PostgreSQL
3. Déployer le dossier `backend/`
4. Configurer les variables d'environnement :
   - `DATABASE_URL` (fourni automatiquement par Railway)
   - `ADMIN_PASSWORD`
   - `SESSION_SECRET`
   - `NODE_ENV=production`
5. Railway détecte automatiquement le `package.json` et build

#### Frontend (par exemple sur Vercel ou Netlify)

1. Build local : `cd frontend && npm run build`
2. Uploader le dossier `dist/` sur Netlify/Vercel
3. Configurer les redirects pour SPA :
   - Netlify : créer `frontend/dist/_redirects` avec `/* /index.html 200`
   - Vercel : créer `vercel.json` avec rewrite rules

### Option 3: Docker (pour faciliter le déploiement)

#### Dockerfile Backend

Créer `backend/Dockerfile` :

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

#### Docker Compose

Créer `docker-compose.yml` à la racine :

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ovb_user
      POSTGRES_PASSWORD: votre_password
      POSTGRES_DB: ovb_ranklist
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: "postgresql://ovb_user:votre_password@postgres:5432/ovb_ranklist?schema=public"
      ADMIN_PASSWORD: "admin123"
      SESSION_SECRET: "change-in-production"
      NODE_ENV: production
    depends_on:
      - postgres

  frontend:
    image: nginx:alpine
    volumes:
      - ./frontend/dist:/usr/share/nginx/html
    ports:
      - "80:80"

volumes:
  postgres_data:
```

Déployer :

```bash
docker-compose up -d
```

## 🔒 Checklist de Sécurité pour Production

- [ ] **Changer `ADMIN_PASSWORD`** dans `.env`
- [ ] **Générer un `SESSION_SECRET` fort** (au moins 32 caractères aléatoires)
- [ ] **Configurer HTTPS** (Let's Encrypt ou certificat SSL)
- [ ] **Limiter les CORS** : mettre la vraie URL du frontend dans `FRONTEND_URL`
- [ ] **Configurer le firewall** : autoriser uniquement ports 80, 443, 22
- [ ] **Backups réguliers** de la base de données PostgreSQL
- [ ] **Mettre à jour les dépendances** régulièrement (`npm audit`)
- [ ] **Logs**: Configurer PM2 logs ou un système de logging
- [ ] **Rate limiting**: Ajouter un rate limiter sur les routes d'upload

## 📊 Monitoring

### Avec PM2

```bash
# Voir les logs
pm2 logs ovb-backend

# Monitorer en temps réel
pm2 monit

# Redémarrer si nécessaire
pm2 restart ovb-backend

# Voir les métriques
pm2 show ovb-backend
```

### Backup PostgreSQL

```bash
# Backup manuel
pg_dump -U ovb_user ovb_ranklist > backup_$(date +%Y%m%d).sql

# Restauration
psql -U ovb_user ovb_ranklist < backup_20240101.sql

# Automatiser avec cron
crontab -e
# Ajouter : 0 2 * * * /usr/bin/pg_dump -U ovb_user ovb_ranklist > /backups/ovb_$(date +\%Y\%m\%d).sql
```

## 🔧 Maintenance

### Mise à jour de l'application

```bash
# Backend
cd /var/www/ovb-ranklist/backend
git pull
npm install
npm run build
pm2 restart ovb-backend

# Frontend
cd ../frontend
npm install
npm run build
# Les fichiers sont automatiquement servis par nginx
```

### Migrations Prisma

```bash
cd backend

# Créer une nouvelle migration (développement)
npx prisma migrate dev --name nom_migration

# Appliquer en production
npx prisma migrate deploy
```

## 📈 Scaling

Pour gérer plus de charge :

1. **Load Balancer** : Utiliser nginx comme load balancer pour plusieurs instances backend
2. **PM2 Cluster Mode** : `pm2 start dist/index.js -i max`
3. **CDN** : Servir le frontend via un CDN (Cloudflare, etc.)
4. **PostgreSQL Replicas** : Configuration master-slave pour répartir les lectures

---

**Bon déploiement ! 🎉**

