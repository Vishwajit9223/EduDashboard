@echo off
REM Windows Startup Script for AI Smart Scholarship Manager
REM This script sets up and starts both frontend and backend

echo.
echo ===================================================
echo   AI Smart Scholarship and Exam Manager
echo   Startup Script (Windows)
echo ===================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js first.
    exit /b 1
)

REM Check if Python is installed
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed. Please install Python 3.8+ first.
    exit /b 1
)

echo [OK] Node.js and Python found.
echo.

REM Backend Setup
echo ===================================================
echo [1/4] Setting up Backend...
echo ===================================================
cd backend

REM Check if virtual environment exists
if not exist "venv" (
    echo [INFO] Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
echo [INFO] Installing Python dependencies...
pip install -q -r requirements.txt

REM Check if .env exists
if not exist ".env" (
    echo [INFO] Creating .env file from example...
    copy .env.example .env
    echo [WARNING] Please edit backend\.env and add your GEMINI_API_KEY
)

REM Check if ML model exists
if not exist "models\scholarship_model.pkl" (
    echo [INFO] Training ML model (this may take a moment)...
    python train_model.py
)

cd ..
echo [OK] Backend setup complete.
echo.

REM Frontend Setup
echo ===================================================
echo [2/4] Setting up Frontend...
echo ===================================================
cd frontend

REM Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installing Node dependencies...
    call npm install
)

REM Check if .env exists
if not exist ".env" (
    echo [INFO] Creating .env file from example...
    copy .env.example .env
)

cd ..
echo [OK] Frontend setup complete.
echo.

REM Start Services
echo ===================================================
echo [3/4] Starting Services...
echo ===================================================

REM Option to start backend
set /p start_backend="Start Backend server? (y/n) [y]: "
if "%start_backend%"=="" set start_backend=y

if /i "%start_backend%"=="y" (
    echo [INFO] Starting Backend (Flask)...
    start "Backend - AI Scholarship Manager" cmd /k "cd backend && venv\Scripts\activate.bat && python app.py"
    timeout /t 3 /nobreak
) else (
    echo [INFO] Skipping Backend startup
)

REM Option to start frontend
set /p start_frontend="Start Frontend server? (y/n) [y]: "
if "%start_frontend%"=="" set start_frontend=y

if /i "%start_frontend%"=="y" (
    echo [INFO] Starting Frontend (React)...
    start "Frontend - AI Scholarship Manager" cmd /k "cd frontend && npm run dev"
) else (
    echo [INFO] Skipping Frontend startup
)

echo.
echo ===================================================
echo [4/4] Setup Complete!
echo ===================================================
echo.
echo Access the application:
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5000/api
echo   Health:   http://localhost:5000/api/health
echo.
echo [IMPORTANT]
echo 1. Edit backend\.env and add your GEMINI_API_KEY
echo 2. Create an account and login to the application
echo 3. Check eligibility and apply for scholarships
echo.
pause
