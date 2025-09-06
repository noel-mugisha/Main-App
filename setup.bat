@echo off
echo 🚀 Setting up Main App - Project Management System
echo ==================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo ✅ Node.js detected
node --version

REM Setup Backend
echo.
echo 📦 Setting up Backend...
cd backend

if not exist "package.json" (
    echo ❌ Backend package.json not found. Make sure you're in the correct directory.
    pause
    exit /b 1
)

echo Installing backend dependencies...
call npm install

if not exist ".env" (
    echo 📝 Creating backend .env file...
    copy env.example .env
    echo ⚠️  Please update backend/.env with your database and IdP configuration
) else (
    echo ✅ Backend .env file already exists
)

echo ✅ Backend setup complete

REM Setup Frontend
echo.
echo 📦 Setting up Frontend...
cd ..\frontend

if not exist "package.json" (
    echo ❌ Frontend package.json not found. Make sure you're in the correct directory.
    pause
    exit /b 1
)

echo Installing frontend dependencies...
call npm install

if not exist ".env.local" (
    echo 📝 Creating frontend .env.local file...
    copy env.local.example .env.local
    echo ⚠️  Please update frontend/.env.local with your configuration
) else (
    echo ✅ Frontend .env.local file already exists
)

echo ✅ Frontend setup complete

REM Setup Database
echo.
echo 🗄️  Setting up Database...
cd ..\backend

echo Generating Prisma client...
call npx prisma generate

echo ⚠️  Please make sure your PostgreSQL database is running and update the DATABASE_URL in backend/.env
echo ⚠️  Then run: npx prisma db push

echo.
echo 🎉 Setup complete!
echo.
echo Next steps:
echo 1. Update backend/.env with your database and IdP configuration
echo 2. Update frontend/.env.local with your configuration
echo 3. Run 'npx prisma db push' in the backend directory to set up the database
echo 4. Start the backend: cd backend ^&^& npm run dev
echo 5. Start the frontend: cd frontend ^&^& npm run dev
echo.
echo Backend will run on http://localhost:3001
echo Frontend will run on http://localhost:3000
echo.
echo Make sure your Spring Boot IdP is running on http://localhost:8080
pause
