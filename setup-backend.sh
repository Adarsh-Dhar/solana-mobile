#!/bin/bash

echo "🚀 Setting up Dine Time Backend..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Navigate to backend directory
cd backend

echo "📦 Installing backend dependencies..."
npm install

echo "🐳 Starting PostgreSQL with Docker..."
cd docker
docker-compose up -d

echo "⏳ Waiting for database to be ready..."
sleep 10

echo "🔧 Setting up database..."
cd ..
cp env.example .env

echo "📊 Generating Prisma client..."
npm run db:generate

echo "🗄️ Pushing database schema..."
npm run db:push

echo "✅ Backend setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Start the backend server: cd backend && npm run dev"
echo "2. The API will be available at: http://localhost:3001"
echo "3. Health check: http://localhost:3001/health"
echo "4. Prisma Studio: cd backend && npm run db:studio"
echo ""
echo "📱 Your React Native app is ready to connect to the backend!"
echo "   Use the utils/api.js and utils/auth.js files for API calls." 