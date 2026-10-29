# Backend API - Flask REST Server

Professional REST API server for AI Smart Scholarship and Exam Manager.

## 🚀 Quick Start

### Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Train ML model
python train_model.py

# Run server
python app.py
```

Server runs on `http://localhost:5000`

## 📁 Project Structure

```
backend/
├── app.py                   # Main Flask application
├── config.py               # Configuration management
├── train_model.py          # ML model training script
├── requirements.txt        # Python dependencies
├── .env.example            # Environment variables template
│
├── models/
│   ├── db_models.py       # SQLAlchemy ORM models
│   ├── scholarship_model.pkl  # Trained ML model
│   └── feature_scaler.pkl    # Feature scaling model
│
├── services/
│   ├── prediction_service.py  # ML predictions
│   └── preprocessing.py       # Data preprocessing
│
├── routes/
│   ├── auth_routes.py         # Authentication APIs
│   ├── recommendation_routes.py # Scholarship APIs
│   └── chatbot_routes.py       # Chatbot APIs
│
└── database/
    └── database.db        # SQLite database
```

## 🔌 API Endpoints

### Authentication
- **POST** `/api/auth/register` - Register new user
- **POST** `/api/auth/login` - Login user
- **GET** `/api/auth/profile/<user_id>` - Get profile
- **PUT** `/api/auth/profile/<user_id>` - Update profile
- **POST** `/api/auth/change-password/<user_id>` - Change password

### Recommendations
- **POST** `/api/recommend/predict` - Predict eligibility
- **GET** `/api/recommend/scholarships` - List scholarships
- **POST** `/api/recommend/apply` - Apply for scholarship
- **GET** `/api/recommend/applications/<user_id>` - User applications
- **GET** `/api/recommend/dashboard/<user_id>` - Dashboard stats

### Chatbot
- **POST** `/api/chat/message` - Send message
- **GET** `/api/chat/suggestions` - Get suggestions

## 🧠 ML Model

### Training
```bash
python train_model.py
```

Generates:
- `models/scholarship_model.pkl` (Random Forest Classifier)
- `models/feature_scaler.pkl` (StandardScaler)

### Features
1. Age
2. Category (General, OBC, SC, ST)
3. Annual Income
4. Education Level (10th-PhD)
5. Stream (Arts, Commerce, Science, Engineering)

### Output
Binary classification with confidence score (0-1)

## 🔐 Security

✅ Password hashing with Werkzeug
✅ CORS configuration
✅ API key protection for Gemini
✅ Input validation on all endpoints
✅ Error handling with user-friendly messages

## 🗄️ Database

SQLite database with 5 tables:
- Users
- Scholarships
- Exams
- Applications
- ExamAttempts

Auto-initialized on first run.

## 🌐 Environment Variables

```env
FLASK_ENV=development
DATABASE_URL=sqlite:///database/database.db
GEMINI_API_KEY=your_api_key_here
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

## 📊 Sample Request

```bash
curl -X POST http://localhost:5000/api/recommend/predict \
  -H "Content-Type: application/json" \
  -d '{
    "age": 20,
    "category": "General",
    "income": 500000,
    "education_level": "12th",
    "stream": "Science"
  }'
```

## 🚀 Deployment

### Production Settings
```bash
export FLASK_ENV=production
export DATABASE_URL=mysql://user:pass@host/dbname
python app.py
```

### Using Gunicorn
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## 🆘 Troubleshooting

**Port 5000 in use:**
```bash
PORT=3001 python app.py
```

**Database errors:**
```bash
rm database/database.db  # Reset database
python app.py            # Reinitialize
```

**ML Model not found:**
```bash
python train_model.py    # Retrain model
```

---

Built with ❤️ using Flask
