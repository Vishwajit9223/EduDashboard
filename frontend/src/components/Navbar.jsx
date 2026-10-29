/**
 * Navigation Bar Component
 * Top navigation bar with logo, menu, and user authentication
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
    setShowMenu(false);
  };

  const handleNavigate = (path) => {
    navigate(path);
    setShowMenu(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo">
          <span className="logo-icon">🎓</span>
          <span className="logo-text">EduDashboard</span>
        </div>

        {/* Nav Links */}
        <div className={`nav-links ${showMenu ? 'active' : ''}`}>
          <button 
            className="nav-item"
            onClick={() => handleNavigate('/')}
          >
            Home
          </button>
          <button 
            className="nav-item"
            onClick={() => handleNavigate('/scholarships')}
          >
            Scholarships
          </button>
          <button 
            className="nav-item"
            onClick={() => handleNavigate('/exams')}
          >
            Exams
          </button>
          <button 
            className="nav-item"
            onClick={() => handleNavigate('/chatbot')}
          >
            AI Chat
          </button>
        </div>

        {/* User Menu */}
        <div className="navbar-user">
          {user ? (
            <div className="user-menu">
              <div className="user-avatar">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="user-dropdown">
                <div className="user-name">{user.name}</div>
                <button 
                  className="dropdown-item"
                  onClick={() => handleNavigate(`/profile/${user.id}`)}
                >
                  My Profile
                </button>
                <button 
                  className="dropdown-item"
                  onClick={() => handleNavigate(`/recommendations/${user.id}`)}
                >
                  My Applications
                </button>
                <hr />
                <button 
                  className="dropdown-item logout"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="auth-buttons">
              <button 
                className="btn-secondary"
                onClick={() => handleNavigate('/login')}
              >
                Login
              </button>
              <button 
                className="btn-primary"
                onClick={() => handleNavigate('/register')}
              >
                Register
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="menu-toggle"
          onClick={() => setShowMenu(!showMenu)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
