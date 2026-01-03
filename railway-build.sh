#!/bin/bash
set -e

echo "🏗️  Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "🏗️  Building backend..."
cd backend
npm install
npx prisma generate
npm run build
cd ..

echo "✅ Build complete!"

