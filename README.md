# 🎓 AI Smart Scholarship and Exam Manager

An industry-level full-stack web application for AI-powered scholarship eligibility prediction, exam management, and career guidance. Built with React, Flask, Machine Learning (Scikit-learn), SQLite, and the Gemini API.

---

## 🚀 Core Features

### Scholarship Recommendation Engine
- ML-powered eligibility prediction (Random Forest Classifier)
- Hybrid ranking: ML score + rule-based field matching per scholarship/exam
- Profile-based form prefill from `/api/auth/profile`
- Top scholarship & exam matches returned with every prediction

### Real-Time Dashboard Metrics
- Platform-wide stats fetched from `/api/stats` (guest landing page)
- Per-user dashboard via `/api/recommend/dashboard/<user_id>`
- Key Metrics panel via `/api/dashboard/stats` — total students, applications submitted, success rate, active scholarships
- Zero hardcoded numbers — all counts are DB-driven

### Exam Management
- 16 seeded competitive exams (JEE, NEET, CAT, SSC, UPSC, NDA, etc.)
- Eligibility filtering by education, stream, age
- Schedule, deadline, and difficulty metadata

### AI Chatbot (Gemini 2.0 Flash)
- Backend-proxied Gemini API calls (key never exposed to client)
- System prompt tuned for scholarship/exam/career guidance
- Conversation context support

### User Management & Auth
- Registration with profile fields (age, category, income, education, stream)
- Login with password hashing (Werkzeug)
- Profile view/update endpoints
- Session-based auth (sessionStorage, cleared on refresh)

### Application Tracking
- Apply for scholarships with auto-scored eligibility
- Track application status (pending → submitted → approved/rejected)
- Per-user application history with pagination

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, React Router, Axios, Recharts, Framer Motion, Lucide Icons |
| **Backend** | Flask, Flask-CORS, SQLAlchemy ORM, python-dotenv |
| **Database** | SQLite (file-based, auto-created) |
| **ML/AI** | Scikit-learn (RandomForestClassifier), StandardScaler, Joblib, NumPy, Pandas |
| **Chatbot** | Google Gemini 2.0 Flash via REST API |
| **DevOps** | Docker, Docker Compose, Vite dev proxy |

---

## 📁 Project Structure

```
Edudashboard/
├── docker-compose.yml
├── package.json
├── startup.bat / startup.sh
├── README.md
│
├── backend/
│   ├── app.py                          # Flask app factory + seed data
│   ├── config.py                       # Env-based configuration
│   ├── requirements.txt
│   ├── train_model.py                  # CLI script to train ML model
│   ├── Dockerfile
│   │
│   ├── models/
│   │   ├── db_models.py               # User, Scholarship, Exam, Application, ExamAttempt
│   │   ├── scholarship_model.pkl      # Trained model (generated)
│   │   └── feature_scaler.pkl         # Feature scaler (generated)
│   │
│   ├── services/
│   │   ├── prediction_service.py      # ML prediction + hybrid recommendation engine
│   │   └── preprocessing.py           # Feature encoding & scaling
│   │
│   ├── routes/
│   │   ├── auth_routes.py             # /api/auth/*
│   │   ├── recommendation_routes.py   # /api/recommend/*
│   │   ├── chatbot_routes.py          # /api/chat/*
│   │   └── data_routes.py             # /api/stats, /api/dashboard/stats,
│   │                                  # /api/exams, /api/scholarships
│   └── database/
│       └── database.db                # SQLite database (auto-generated)
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── Dockerfile
    │
    └── src/
        ├── App.jsx                    # Router, auth state, protected routes
        ├── main.jsx                   # React entry point
        ├── services/
        │   └── api.js                 # Centralized Axios API layer
        ├── components/
        │   ├── Layout.jsx             # Shell: Header + Sidebar + content
        │   ├── Header.jsx
        │   ├── Sidebar.jsx
        │   ├── DashboardCards.jsx     # Animated stat cards (CountUp)
        │   ├── Charts.jsx             # Recharts + dynamic Key Metrics
        │   ├── RecommendationForm.jsx # Eligibility form (profile prefill)
        │   ├── Chatbot.jsx
        │   ├── Card.jsx
        │   ├── FormInput.jsx
        │   ├── EditProfileModal.jsx
        │   ├── ProfileDropdown.jsx
        │   └── Footer.jsx
        ├── pages/
        │   ├── Home.jsx               # Guest landing + logged-in dashboard
        │   ├── Scholarships.jsx
        │   ├── Exams.jsx
        │   ├── Recommendation.jsx
        │   ├── ChatbotPage.jsx
        │   ├── LoginPage.jsx
        │   └── RegisterPage.jsx
        └── styles/
            ├── theme.css              # CSS variables & design tokens
            ├── layout.css
            ├── Pages.css
            ├── forms.css
            ├── micro.css
            └── (component CSS files)
```

---

## 🔧 Installation & Setup

### Prerequisites
- **Node.js** >= 16, **npm** >= 8
- **Python** >= 3.8, **pip**
- **Gemini API key** from [Google AI Studio](https://ai.google.dev/)

### 1. Clone & Enter
```bash
git clone https://github.com/yourusername/Edudashboard.git
cd Edudashboard
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create `backend/.env`:
```env
FLASK_ENV=development
SECRET_KEY=your-secret-key
GEMINI_API_KEY=your-gemini-api-key
```

Train the ML model (one-time):
```bash
python train_model.py
# → models/scholarship_model.pkl
# → models/feature_scaler.pkl
```

Start the backend:
```bash
python app.py
# → http://localhost:5000
```
The database and seed data (16 exams, 18 scholarships) are created automatically on first run.

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
# → http://localhost:5173
```

### 4. Docker (alternative)
```bash
docker-compose up --build
# Backend → :5000   Frontend → :5173
```

---

## 🎯 API Endpoints

### Authentication — `/api/auth`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns user object |
| GET | `/api/auth/profile/<user_id>` | Get user profile |
| PUT | `/api/auth/profile/<user_id>` | Update user profile |
| POST | `/api/auth/change-password/<user_id>` | Change password |

### Recommendations — `/api/recommend`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/recommend/predict` | ML eligibility prediction + ranked matches |
| GET | `/api/recommend/scholarships` | Paginated scholarship list |
| GET | `/api/recommend/scholarship/<id>` | Scholarship detail |
| POST | `/api/recommend/apply` | Apply for scholarship |
| GET | `/api/recommend/applications/<user_id>` | User's applications |
| GET | `/api/recommend/dashboard/<user_id>` | Per-user dashboard stats |

### Platform Stats — `/api`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/stats` | Total users + active scholarships |
| GET | `/api/exams` | Active exams (card fields) |
| GET | `/api/scholarships` | Active scholarships (card fields) |

### Chatbot — `/api/chat`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/chat/message` | Send message to Gemini |
| GET | `/api/chat/suggestions` | Quick-start prompts |
| GET | `/api/chat/health` | Chatbot service status |
| POST | `/api/chat/context` | Set conversation context |

### Utility
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | API health check |

---

## 📊 Database Models

| Model | Table | Key Fields |
|-------|-------|-----------|
| **User** | `users` | id, name, email, password_hash, age, category, income, education_level, stream |
| **Scholarship** | `scholarships` | id, name, organization, amount, eligibility fields, portal_type, is_active |
| **Exam** | `exams` | id, name, exam_type, eligibility fields, difficulty_level, career_field, is_active |
| **Application** | `applications` | id, user_id → users, scholarship_id → scholarships, status, eligibility_score |
| **ExamAttempt** | `exam_attempts` | id, user_id → users, exam_id → exams, status, score, percentile |

---

## 🤖 ML Model Details

| Aspect | Detail |
|--------|--------|
| Algorithm | Random Forest Classifier (100 estimators) |
| Features | age, category, income, education_level, stream |
| Preprocessing | Label encoding + StandardScaler |
| Training data | 500 synthetic samples (`train_model.py`) |
| Output | Binary classification + probability score (0–1) |
| Persistence | Joblib (`.pkl` files) |

The prediction service also performs **hybrid recommendation**: matches the user profile against every active scholarship and exam using field-level rules (income range, age range, category, education, stream, difficulty) and returns top-ranked results.

---

## 🔐 Security

- Gemini API key stored on backend only, proxied via `/api/chat/message`
- CORS restricted to localhost / LAN origins (regex-based)
- Passwords hashed with Werkzeug (`generate_password_hash`)
- Input validation on all endpoints
- Environment variables for all secrets

---

## 🔄 Environment Variables

### Backend (`backend/.env`)
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FLASK_ENV` | No | `development` | `development` / `production` |
| `SECRET_KEY` | Yes (prod) | `dev-secret-key-...` | Flask session secret |
| `GEMINI_API_KEY` | Yes | — | Google Gemini API key |
| `DATABASE_URL` | No | `sqlite:///database/database.db` | Database URI |
| `PORT` | No | `5000` | Server port |

### Frontend (`frontend/.env`)
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | No | `http://localhost:5000/api` | Backend API base URL |

---

## 🔮 Future Improvements

- [ ] JWT-based authentication (replace session-based)
- [ ] Email notifications for application status changes
- [ ] Payment gateway integration for premium scholarships
- [ ] Mobile app (React Native)
- [ ] Multi-language (i18n) support
- [ ] Advanced analytics dashboard with real-time charts
- [ ] Admin panel for scholarship/exam CRUD
- [ ] Migrate chart data (Pie/Bar) from static samples to live database queries

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

**Made with ❤️ by the AI Smart Scholarship Team**
