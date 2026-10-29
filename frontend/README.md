# Frontend - React Application

Modern React application for AI Smart Scholarship and Exam Manager.

## 🚀 Quick Start

### Setup
```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start development server
npm run dev
```

Application runs on `http://localhost:5173`

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx           # Top navigation
│   │   ├── Sidebar.jsx          # Side navigation
│   │   ├── DashboardCards.jsx   # Statistics cards
│   │   ├── Charts.jsx           # Data visualization
│   │   ├── RecommendationForm.jsx # Eligibility form
│   │   └── Chatbot.jsx          # AI chat interface
│   │
│   ├── pages/
│   │   ├── Home.jsx             # Landing page
│   │   ├── Scholarships.jsx     # Scholarships list
│   │   ├── Exams.jsx            # Exams page
│   │   ├── Recommendation.jsx   # Recommendation page
│   │   ├── ChatbotPage.jsx      # Chatbot page
│   │   ├── LoginPage.jsx        # Login form
│   │   └── RegisterPage.jsx     # Registration form
│   │
│   ├── services/
│   │   └── api.js               # API client
│   │
│   ├── styles/
│   │   ├── Pages.css            # Global styles
│   │   ├── Navbar.css
│   │   ├── Sidebar.css
│   │   ├── DashboardCards.css
│   │   ├── Charts.css
│   │   ├── RecommendationForm.css
│   │   ├── Chatbot.css
│   │   └── Auth.css
│   │
│   ├── App.jsx                  # Main app component
│   └── main.jsx                 # React entry point
│
├── index.html                   # HTML template
├── package.json                 # Dependencies
├── vite.config.js              # Vite configuration
├── .env.example                # Environment template
└── README.md                   # This file
```

## 🎯 Key Features

- **Responsive Design** - Works on desktop, tablet, mobile
- **Component-Based** - Modular, reusable components
- **Centralized API** - Single api.js service module
- **Modern CSS** - No inline styles, modern responsive layout
- **State Management** - React hooks for state
- **Error Handling** - User-friendly error messages
- **Loading States** - Skeleton loaders & spinners
- **Charts & Graphs** - Recharts for visualization

## 🛠️ Available Scripts

### Development
```bash
npm run dev
```
Starts development server with hot reload

### Production Build
```bash
npm run build
```
Creates optimized production build in `dist/` folder

### Preview Build
```bash
npm run preview
```
Preview production build locally

## 📦 Dependencies

### Core
- react - UI library
- react-dom - React rendering
- react-router-dom - Routing

### API
- axios - HTTP client

### Charts
- recharts - Data visualization

## 🔌 API Integration

### Base URL
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
```

### Usage
```javascript
import { apiService } from './services/api'

// Login
const response = await apiService.loginUser(email, password)

// Get scholarships
const response = await apiService.getScholarships(page, perPage)

// Predict eligibility
const response = await apiService.predictEligibility(userData)

// Send chat message
const response = await apiService.sendChatMessage(messageData)
```

## 🎨 Styling

- **CSS3** - Modern CSS without dependencies
- **Mobile-First** - Responsive from small to large screens
- **Color Variables** - Centralized color palette
- **Flexbox & Grid** - Modern layout techniques
- **Animations** - Smooth transitions and keyframes

## 🔐 Security

- API keys stored in backend only
- No sensitive data in localStorage except user ID
- Axios interceptors for auth tokens
- Request timeout (10s)

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
npm i -g vercel
vercel
```

### Deploy to Netlify
```bash
npm run build
# Drag & drop `dist` folder to Netlify
```

### Environment Variables
```env
VITE_API_URL=https://api.example.com
```

## 🚦 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🆘 Troubleshooting

**Port in use:**
```bash
npm run dev -- --port 3000
```

**API not responding:**
- Ensure backend is running on http://localhost:5000
- Check API_BASE_URL in .env

**Build errors:**
```bash
rm -rf node_modules
npm install
npm run build
```

**Styling issues:**
Check browser DevTools for CSS cascade issues

## 📚 Learning Resources

- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev)
- [React Router](https://reactrouter.com)
- [Axios Documentation](https://axios-http.com)

---

Built with ❤️ using React & Vite
