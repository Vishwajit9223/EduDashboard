/**
 * Application Main Component
 * Root component handling routing and app-wide state
 *
 * Auth behaviour:
 *   - Session lives only until the tab is refreshed or closed.
 *   - On beforeunload a confirmation dialog is shown (only when logged in).
 *   - After a refresh / reopen the user must log in again.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

// Pages
import Home from './pages/Home';
import Scholarships from './pages/Scholarships';
import Exams from './pages/Exams';
import Recommendation from './pages/Recommendation';
import ChatbotPage from './pages/ChatbotPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UsersList from './pages/UsersList';

import './styles/theme.css';
import './styles/layout.css';
import './styles/forms.css';
import './styles/Pages.css';
import './styles/micro.css';

/* ── helpers ──────────────────────────────────────────────── */

/** Wipe every trace of the current session */
const clearAuthData = () => {
  sessionStorage.removeItem('userToken');
  sessionStorage.removeItem('userData');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('__session_active');
};

/**
 * Detect whether this page-load is a reload (F5 / Ctrl-R / pull-to-refresh).
 * Uses the modern PerformanceNavigationTiming API with a legacy fallback.
 */
const isPageReload = () => {
  // Modern browsers (Chrome 57+, Firefox 58+, Edge 79+)
  const navEntries = performance.getEntriesByType?.('navigation');
  if (navEntries?.length) {
    return navEntries[0].type === 'reload';
  }
  // Legacy fallback (deprecated but still works in many browsers)
  // eslint-disable-next-line no-restricted-properties
  return performance.navigation?.type === 1;
};

/* ── Protected Route wrapper ──────────────────────────────── */
const ProtectedRoute = ({ children }) => {
  const token = sessionStorage.getItem('userToken');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ── Logout (callable from anywhere) ────────────────────── */
  const handleLogout = useCallback(() => {
    setUser(null);
    clearAuthData();
  }, []);

  /* ── On mount: force logout when the page was reloaded ──── */
  useEffect(() => {
    if (isPageReload()) {
      // Page was refreshed → wipe session, force re-login
      console.log('[AUTH] Reload detected — logging out');
      clearAuthData();
      setLoading(false);
      return;
    }

    // Normal navigation (first visit / SPA transition) → restore session if any
    const active = sessionStorage.getItem('__session_active');
    if (active) {
      const userData = sessionStorage.getItem('userData');
      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (err) {
          console.error('Error parsing user data:', err);
          clearAuthData();
        }
      }
    }
    setLoading(false);
  }, []); // runs once on mount

  /* ── beforeunload: confirmation dialog while logged in ──── */
  useEffect(() => {
    if (!user) return;                     // only attach when logged in

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      // Modern browsers ignore custom strings but still show a generic
      // "Leave site?" dialog when returnValue is set.
      e.returnValue = 'Are you sure you want to refresh? You will be logged out.';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user]);

  /* ── Login handler ──────────────────────────────────────── */
  const handleLogin = (userData) => {
    setUser(userData);
    // Mark this tab as having an active session
    sessionStorage.setItem('__session_active', '1');
  };

  /* ── Profile update handler ─────────────────────────────── */
  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
    sessionStorage.setItem('userData', JSON.stringify(updatedUser));
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        background: 'linear-gradient(120deg, #f6d365, #fda085)'
      }}>
        <div style={{ 
          fontSize: '1.5rem',
          color: '#34495e',
          fontWeight: 'bold'
        }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Layout user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate}>
        <Routes>
          {/* Home — public (shows project info or dashboard) */}
          <Route path="/" element={<Home user={user} />} />
          <Route path="/scholarships" element={<Scholarships user={user} />} />
          <Route path="/exams" element={<Exams />} />
          <Route path="/chatbot" element={<ChatbotPage />} />

          {/* Protected Routes */}
          <Route path="/recommendation" element={
            <ProtectedRoute>
              <Recommendation user={user} />
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/users" element={
            <ProtectedRoute>
              <UsersList user={user} />
            </ProtectedRoute>
          } />

          {/* Auth Routes */}
          {!user ? (
            <>
              <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
              <Route path="/register" element={<RegisterPage onRegister={handleLogin} />} />
            </>
          ) : (
            <>
              <Route path="/login" element={<Navigate to="/" />} />
              <Route path="/register" element={<Navigate to="/" />} />
            </>
          )}

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
