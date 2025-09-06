#!/bin/bash

echo "🚀 Setting up Main App - Project Management System"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Setup Backend
echo ""
echo "📦 Setting up Backend..."
cd backend

if [ ! -f "package.json" ]; then
    echo "❌ Backend package.json not found. Make sure you're in the correct directory."
    exit 1
fi

echo "Installing backend dependencies..."
npm install

if [ ! -f ".env" ]; then
    echo "📝 Creating backend .env file..."
    cp env.example .env
    echo "⚠️  Please update backend/.env with your database and IdP configuration"
else
    echo "✅ Backend .env file already exists"
fi

echo "✅ Backend setup complete"

# Setup Frontend
echo ""
echo "📦 Setting up Frontend..."
cd ../frontend

if [ ! -f "package.json" ]; then
    echo "❌ Frontend package.json not found. Make sure you're in the correct directory."
    exit 1
fi

echo "Installing frontend dependencies..."
npm install

if [ ! -f ".env.local" ]; then
    echo "📝 Creating frontend .env.local file..."
    cp env.local.example .env.local
    echo "⚠️  Please update frontend/.env.local with your configuration"
else
    echo "✅ Frontend .env.local file already exists"
fi

echo "✅ Frontend setup complete"

# Setup Database
echo ""
echo "🗄️  Setting up Database..."
cd ../backend

echo "Generating Prisma client..."
npx prisma generate

echo "⚠️  Please make sure your PostgreSQL database is running and update the DATABASE_URL in backend/.env"
echo "⚠️  Then run: npx prisma db push"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update backend/.env with your database and IdP configuration"
echo "2. Update frontend/.env.local with your configuration"
echo "3. Run 'npx prisma db push' in the backend directory to set up the database"
echo "4. Start the backend: cd backend && npm run dev"
echo "5. Start the frontend: cd frontend && npm run dev"
echo ""
echo "Backend will run on http://localhost:3001"
echo "Frontend will run on http://localhost:3000"
echo ""
echo "Make sure your Spring Boot IdP is running on http://localhost:8080"
