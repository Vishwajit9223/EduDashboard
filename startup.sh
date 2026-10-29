#!/bin/bash

# Startup script for AI Smart Scholarship Manager (Linux/macOS)

echo ""
echo "==================================================="
echo "  AI Smart Scholarship and Exam Manager"
echo "  Startup Script (Linux/macOS)"
echo "==================================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

echo "[OK] Node.js and Python found."
echo ""

# Backend Setup
echo "==================================================="
echo "[1/4] Setting up Backend..."
echo "==================================================="
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "[INFO] Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "[INFO] Installing Python dependencies..."
pip install -q -r requirements.txt

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "[INFO] Creating .env file from example..."
    cp .env.example .env
    echo "[WARNING] Please edit backend/.env and add your GEMINI_API_KEY"
fi

# Train model if it doesn't exist
if [ ! -f "models/scholarship_model.pkl" ]; then
    echo "[INFO] Training ML model (this may take a moment)..."
    python train_model.py
fi

cd ..
echo "[OK] Backend setup complete."
echo ""

# Frontend Setup
echo "==================================================="
echo "[2/4] Setting up Frontend..."
echo "==================================================="
cd frontend

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "[INFO] Installing Node dependencies..."
    npm install
fi

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "[INFO] Creating .env file from example..."
    cp .env.example .env
fi

cd ..
echo "[OK] Frontend setup complete."
echo ""

# Start Services
echo "==================================================="
echo "[3/4] Starting Services..."
echo "==================================================="

# Start backend
echo "[INFO] Starting Backend (Flask) on http://localhost:5000..."
cd backend
source venv/bin/activate
python app.py &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Start frontend
echo "[INFO] Starting Frontend (React) on http://localhost:5173..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "==================================================="
echo "[4/4] Setup Complete!"
echo "==================================================="
echo ""
echo "Access the application:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:5000/api"
echo "  Health:   http://localhost:5000/api/health"
echo ""
echo "[IMPORTANT]"
echo "1. Edit backend/.env and add your GEMINI_API_KEY"
echo "2. Create an account and login to the application"
echo "3. Check eligibility and apply for scholarships"
echo ""
echo "Processes running:"
echo "  Backend PID:  $BACKEND_PID"
echo "  Frontend PID: $FRONTEND_PID"
echo ""
echo "To stop servers:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo ""

wait
