#!/bin/bash
# Vercel build script

echo "🔧 Installing dependencies..."
npm install

echo "🗄️ Generating Prisma client..."
npx prisma generate

echo "🏗️ Building Next.js application..."
npm run build