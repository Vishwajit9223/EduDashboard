# Network Troubleshooting Guide

## Quick Start

### 1. Start Backend Server
```bash
cd backend
python app.py
```

You should see:
```
======================================================================
  🚀 AI Smart Scholarship and Exam Manager - Backend
======================================================================
  Environment:  development
  Server:       http://0.0.0.0:5000
  API Base URL: http://localhost:5000/api
  ...
  🎉 Server is running! Point your browser to http://localhost:5173
======================================================================
```

### 2. Start Frontend Server
```bash
cd frontend
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in 589 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

---

## Common Issues & Solutions

### ❌ "Network error - could not reach server"

This means the frontend cannot connect to the backend API.

#### Check 1: Is Backend Running?

**Windows:**
```powershell
# Check if port 5000 is in use
netstat -ano | findstr :5000
```

**Mac/Linux:**
```bash
lsof -i :5000
```

If you see a process listening on port 5000, the backend is running.

**If not running:**
```bash
cd backend
python app.py
```

---

#### Check 2: API URL Configuration

Verify frontend can find backend:

1. Open browser DevTools: `F12` or `Right-click → Inspect`
2. Go to **Console** tab
3. Look for logs starting with `[API]`:
   ```
   [API] Configuration: {
     baseURL: "http://localhost:5000/api",
     timeout: 30000,
     debug: true
   }
   ```

4. Check the **Network** tab:
   - Look for request to `http://localhost:5000/api/auth/register`
   - If it shows `ERR_CONNECTION_REFUSED` → Backend not running
   - If it shows `CORS error` → CORS not configured
   - If `(Pending)` → Timeout, backend is slow

---

#### Check 3: Port Conflicts

**Windows - Find process using port 5000:**
```powershell
# Get process ID
$pid = (netstat -ano | findstr :5000)[0].Split()[-1]

# View details
tasklist | findstr $pid

# Kill process (if needed)
taskkill /PID $pid /F
```

**Try different port:**
```bash
PORT=5001 python app.py
```

Then update frontend `.env`:
```
VITE_API_URL=http://localhost:5001/api
```

---

#### Check 4: Verify Health Check Endpoint

**In browser console (F12):**
```javascript
// Test if backend is reachable
fetch('http://localhost:5000/api/health')
  .then(r => r.json())
  .then(d => console.log('✓ Backend OK:', d))
  .catch(e => console.error('✗ Backend unreachable:', e))
```

Should show:
```
✓ Backend OK: {
  success: true,
  message: "Backend API is running",
  version: "1.0.0"
}
```

---

### ❌ CORS Error (Origin not allowed)

**Browser error:**
```
Access to XMLHttpRequest at 'http://localhost:5000/api/auth/register' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Solution:** Backend already handles this, but verify in `backend/app.py`:

```python
_cors_origins = [
    r"http://localhost(:\d+)?",  # Matches any port on localhost
    r"http://127\.0\.0\.1(:\d+)?",
]

CORS(app, resources={r"/api/*": {"origins": _cors_origins}})
```

If this doesn't work, ensure `flask-cors` is installed:
```bash
pip install flask-cors
```

---

### ❌ Request Timeout

**Error:** "Request timeout - server may be slow or offline"

**Check 1: Backend Processing**
- Look at backend console for slow queries
- Check if database is locked

**Check 2: Increase Timeout**
Edit frontend `.env`:
```
VITE_API_TIMEOUT=60000  # 60 seconds instead of 30
```

**Check 3: Check Server Resources**
- CPU usage: `Task Manager` (Windows) or `top` (Mac/Linux)
- Memory usage: Check if backend process is consuming too much
- Disk space: Ensure database file isn't corrupted

---

### ❌ Invalid Email/Phone Format Errors

**Validation rules:**
- Email: Must match standard email format (user@domain.com)
- Phone: Exactly 10 digits
- Name: Minimum 3 characters
- Password: Minimum 6 characters

**Test in browser console:**
```javascript
// Check what validation errors you're getting
const testData = {
  name: "John",
  email: "john@example.com",
  password: "123456",
  age: 20,
  phone: "9876543210"
};

// The frontend validator should tell you what's wrong
```

---

## Debugging with Network Tab

### Step 1: Open DevTools
- Press `F12`
- Go to **Network** tab

### Step 2: Register/Login
- Fill in form
- Click submit
- Check the network request that appears

### Step 3: Inspect Request
Click on the request (e.g., `register`)

#### Headers Tab:
```
Method: POST
URL: http://localhost:5000/api/auth/register
Status: (should be 200, 201, or 4xx error code)
```

#### Payload Tab:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "123456"
}
```

#### Response Tab:
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {...}
}
```

---

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api     # Backend API URL
VITE_API_TIMEOUT=30000                     # Request timeout (ms)
VITE_DEBUG=true                            # Enable debug logging
```

### Backend (.env)
```
FLASK_ENV=development                      # or production
PORT=5000                                  # Server port
GEMINI_API_KEY=your_key_here               # For chatbot
DATABASE_URL=sqlite:///database/database.db
```

---

## Useful Commands

### Backend

```bash
# Start server
python app.py

# Start with different port
PORT=5001 python app.py

# Check if dependencies installed
pip install -r requirements.txt

# View database
sqlite3 database/database.db
```

### Frontend

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Testing Network Connectivity

### Using curl (Command line)

**Windows PowerShell:**
```powershell
# Test if backend is running
curl http://localhost:5000/api/health

# Test registration
$body = @{name="Test"; email="test@example.com"; password="123456"} | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:5000/api/auth/register -Method Post -Body $body -ContentType "application/json"
```

**Mac/Linux:**
```bash
# Test health check
curl http://localhost:5000/api/health

# Test registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"123456"}'
```

---

## Enable Verbose Logging

### Frontend
Edit `frontend/src/services/api.js`:
```javascript
const IS_DEBUG = true;  // Enable debug logging
```

Open DevTools Console to see detailed logs:
```
[API REQUEST] POST /auth/register
[API RESPONSE] 201 Created
[API ERROR DETAILS] Error connecting to server
```

### Backend
Enable Flask debug:
```bash
FLASK_ENV=development python app.py
```

Look for logs like:
```
[CORS] Initialized...
[DB] Tables created successfully
[ROUTES] Registered: /api/auth, /api/recommend...
```

---

## Still Not Working?

### 1. Check Error Details
- Frontend Console (F12 → Console tab)
- Backend Console (terminal output)
- Browser Network tab (F12 → Network tab)

### 2. Check Firewall
- Windows Firewall may block Flask app
- Check if backend port is open in firewall settings

### 3. Try Different Network Test
```javascript
// Try fetching a simple endpoint
fetch('http://localhost:5000/api/health')
  .then(r => console.log('Status:', r.status))
  .catch(e => console.error('Error code:', e.name))
```

### 4. Restart Everything
```bash
# Kill backend process and restart
# Kill npm dev server (Ctrl+C) and restart

# Clear browser cache (Ctrl+Shift+Delete / Cmd+Shift+Delete)
```

---

## Contact & Support

For more help:
1. Check the Network Diagnostics widget (bottom-right of page)
2. Review logs in both browser console and backend terminal
3. Check the project README.md for setup instructions
