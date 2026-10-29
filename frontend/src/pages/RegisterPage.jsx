/**
 * Register Page
 * User registration with profile
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { validateRegistrationForm } from '../services/validation';
import Card from '../components/Card';
import FormInput from '../components/FormInput';
import '../styles/Auth.css';

const RegisterPage = ({ onRegister }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
    category: 'General',
    income: '',
    education_level: '12th',
    stream: 'Science'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const categories = ['General', 'OBC', 'SC', 'ST'];
  const educationLevels = ['10th', '12th', 'Bachelor', 'Master', 'PhD'];
  const streams = ['Arts', 'Commerce', 'Science', 'Engineering'];

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
    const validation = validateRegistrationForm(formData);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    setLoading(true);

    try {
      console.log('[REGISTER PAGE] Starting registration with:', {
        name: formData.name,
        email: formData.email,
        age: formData.age
      });
      
      const response = await apiService.registerUser(formData);
      console.log('[REGISTER PAGE] Registration response:', response);
      
      if (response.success && response.user) {
        console.log('[REGISTER PAGE] Success! User registered:', response.user.email);
        setSuccess('✨ Account created successfully! Redirecting...');
        // Store user data and token
        sessionStorage.setItem('userData', JSON.stringify(response.user));
        sessionStorage.setItem('userToken', response.user.id);
        
        // Redirect after showing success message
        setTimeout(() => {
          onRegister(response.user);
          navigate('/');
        }, 1500);
      } else {
        const errorMsg = response.message || 'Registration failed. Please try again.';
        console.error('[REGISTER PAGE] Response not successful:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('[REGISTER PAGE] Error caught:', err);
      
      // Extract error message from the Error object
      let errorMsg = 'An error occurred during registration';
      
      if (err instanceof Error) {
        errorMsg = err.message;
      } else if (err.message) {
        errorMsg = err.message;
      } else if (typeof err === 'string') {
        errorMsg = err;
      } else if (err.error) {
        errorMsg = err.error;
      }
      
      console.error('[REGISTER PAGE] Final error message:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-wrapper auth-wrapper--register">
        <Card className="auth-card auth-card--register">
          <div className="auth-header">
            <div className="auth-icon">📝</div>
            <h1>Create Account</h1>
            <p>Join thousands of students finding scholarships</p>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row-2">
              <FormInput
                label="Full Name"
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
                error={fieldErrors.name}
                required
              />

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
            </div>

            <div className="form-row-2">
              <FormInput
                label="Password"
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                error={fieldErrors.password}
                required
              />

              <FormInput
                label="Age"
                id="age"
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="Your age"
                error={fieldErrors.age}
                min="13"
                max="80"
              />
            </div>

            <div className="form-row-2">
              <FormInput
                label="Category"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                options={categories}
                error={fieldErrors.category}
              />

              <FormInput
                label="Family Income (₹/year)"
                id="income"
                type="number"
                name="income"
                value={formData.income}
                onChange={handleChange}
                placeholder="Annual family income"
                error={fieldErrors.income}
                min="0"
              />
            </div>

            <div className="form-row-2">
              <FormInput
                label="Education Level"
                id="education_level"
                name="education_level"
                value={formData.education_level}
                onChange={handleChange}
                options={educationLevels}
                error={fieldErrors.education_level}
              />

              <FormInput
                label="Stream"
                id="stream"
                name="stream"
                value={formData.stream}
                onChange={handleChange}
                options={streams}
                error={fieldErrors.stream}
              />
            </div>

            <button
              type="submit"
              className="btn-primary btn-full-width"
              disabled={loading}
            >
              {loading ? '⏳ Creating Account...' : '✨ Create Account'}
            </button>
          </form>

          <div className="auth-footer">
            <p>Already have an account? <Link to="/login" className="auth-link">Sign in here</Link></p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;

