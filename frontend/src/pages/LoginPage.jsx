/**
 * Login Page
 * User authentication
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { validateLoginForm } from '../services/validation';
import Card from '../components/Card';
import FormInput from '../components/FormInput';
import '../styles/Auth.css';

const LoginPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});

    // Validate form before submission
    const validation = validateLoginForm(formData);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    setLoading(true);

    try {
      console.log('[LOGIN PAGE] Starting login with email:', formData.email);
      const response = await apiService.loginUser(formData.email, formData.password);
      console.log('[LOGIN PAGE] Login response:', response);
      
      if (response.success && response.user) {
        console.log('[LOGIN PAGE] Success! Logged in as:', response.user.email);
        setSuccess('✨ Login successful! Redirecting...');
        
        // Redirect after showing success message
        setTimeout(() => {
          onLogin(response.user);
          navigate('/');
        }, 1500);
      } else {
        const errorMsg = response.message || 'Login failed';
        console.error('[LOGIN PAGE] Response not successful:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('[LOGIN PAGE] Error caught:', err);
      
      let errorMsg = 'An error occurred during login';
      
      if (err instanceof Error) {
        errorMsg = err.message;
      } else if (err.message) {
        errorMsg = err.message;
      } else if (typeof err === 'string') {
        errorMsg = err;
      } else if (err.error) {
        errorMsg = err.error;
      }
      
      console.error('[LOGIN PAGE] Final error message:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-wrapper auth-wrapper--login">
        <Card className="auth-card auth-card--login">
          <div className="auth-header">
            <div className="auth-icon">🔐</div>
            <h1>Welcome Back</h1>
            <p>Sign in to your scholarship dashboard</p>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <FormInput
              label="Email Address"
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your.email@example.com"
              error={fieldErrors.email}
              required
            />

            <FormInput
              label="Password"
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              error={fieldErrors.password}
              required
            />

            <button
              type="submit"
              className="btn-primary btn-full-width"
              disabled={loading}
            >
              {loading ? '⏳ Signing in...' : '🔓 Sign In'}
            </button>
          </form>

          <div className="auth-footer">
            <p>Don't have an account? <Link to="/register" className="auth-link">Create one here</Link></p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
