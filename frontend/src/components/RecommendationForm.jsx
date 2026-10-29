/**
 * Recommendation Form Component
 * Form for scholarship eligibility prediction
 */

import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { validateRecommendationForm } from '../services/validation';
import FormInput from './FormInput';
import Card from './Card';
import '../styles/RecommendationForm.css';

/* ── Match-score color helper ─────────────────────── */
function getMatchColor(score) {
  if (score >= 0.85) return '#0F766E';   // Excellent – Deep Emerald
  if (score >= 0.65) return '#1E3A5F';   // Good     – Rich Navy
  return '#92400E';                      // Moderate  – Warm Brown
}
function getMatchBg(score) {
  if (score >= 0.85) return 'rgba(15,118,110,0.12)';
  if (score >= 0.65) return 'rgba(30,58,95,0.10)';
  return 'rgba(146,64,14,0.10)';
}

const RecommendationForm = ({ onSubmit, loading = false, user }) => {
  const [formData, setFormData] = useState({
    age: '',
    category: 'General',
    income: '',
    education_level: '12th',
    stream: 'Science'
  });

  /* Prefill form from user profile when available */
  useEffect(() => {
    if (!user?.id) return;
    apiService.getProfile(user.id)
      .then(data => {
        const u = data?.user || data;
        if (u) {
          setFormData(prev => ({
            ...prev,
            age: u.age ?? prev.age,
            category: u.category || prev.category,
            income: u.income ?? prev.income,
            education_level: u.education_level || prev.education_level,
            stream: u.stream || prev.stream,
          }));
        }
      })
      .catch(() => { /* silent – form stays with defaults */ });
  }, [user]);

  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const categories = ['General', 'OBC', 'SC', 'ST'];
  const educationLevels = ['10th', '12th', 'Bachelor', 'Master', 'PhD'];
  const streams = ['Arts', 'Commerce', 'Science', 'Engineering'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
    setResult(null);

    // Validate form before submission
    const validation = validateRecommendationForm(formData);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Build payload with proper numeric types
      const payload = {
        age: Number(formData.age),
        category: formData.category,
        income: Number(formData.income),
        education_level: formData.education_level,
        stream: formData.stream
      };

      console.log('Sending recommendation data:', payload);

      // Call API
      const response = await apiService.predictEligibility(payload);
      console.log('Recommendation response:', response);

      if (response.success) {
        setSuccess('✨ Eligibility checked! See results below.');
        setResult(response);
        if (onSubmit) onSubmit(response);
      } else {
        setError(response.error || response.message || 'Failed to get prediction');
      }
    } catch (err) {
      console.error('Recommendation error:', err);
      const msg = err?.error || err?.message || 'An error occurred';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="recommendation-form-container">
      <Card className="form-card" gradient>
        <div className="form-header">
          <h2>✨ Scholarship Eligibility Check</h2>
          <p>Fill in your details to get personalized recommendations</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="form">
          <div className="form-grid-2">
            {/* Age */}
            <FormInput
              label="Age"
              id="age"
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="Enter your age"
              error={fieldErrors.age}
              required
              min="13"
              max="80"
            />

            {/* Category */}
            <FormInput
              label="Category"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              options={categories}
              error={fieldErrors.category}
            />
          </div>

          <div className="form-grid-2">
            {/* Income */}
            <FormInput
              label="Family Income (₹/year)"
              id="income"
              type="number"
              name="income"
              value={formData.income}
              onChange={handleChange}
              placeholder="Enter annual family income"
              error={fieldErrors.income}
              required
              min="0"
            />

            {/* Education Level */}
            <FormInput
              label="Education Level"
              id="education_level"
              name="education_level"
              value={formData.education_level}
              onChange={handleChange}
              options={educationLevels}
              error={fieldErrors.education_level}
            />
          </div>

          {/* Stream */}
          <FormInput
            label="Stream"
            id="stream"
            name="stream"
            value={formData.stream}
            onChange={handleChange}
            options={streams}
            error={fieldErrors.stream}
          />

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-primary btn-full-width"
            disabled={isSubmitting || loading}
          >
            {isSubmitting || loading ? '⏳ Checking...' : '✨ Check Eligibility'}
          </button>
        </form>
      </Card>

      {/* Result Display */}
      {result && (
        <Card className="result-card result-gradient">
          <div className="result-header">
            <h3>✨ Your Results</h3>
          </div>

          <div className="result-score-section">
            <div className="score-circle">
              <div className="score-value">{(result.eligibility_score * 100).toFixed(0)}%</div>
              <div className="score-label">Eligibility Score</div>
            </div>

            {result.eligible ? (
              <div className="badge-success">✓ You are Eligible!</div>
            ) : (
              <div className="badge-warning">⚠ Keep improving your profile</div>
            )}
          </div>

          <div className="result-content">
            <div className="result-section">
              <h4>📋 Recommendation</h4>
              <p>{result.recommendation}</p>
            </div>

            {result.explanation && (
              <div className="result-section">
                <h4>📊 Your Profile Analysis</h4>
                <ul className="result-list">
                  {result.explanation.split('\n').map((line, idx) => (
                    line.trim() && <li key={idx}>{line.trim()}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="result-action">
            <button 
              className="btn-primary btn-full-width"
              onClick={() => window.location.href = '/scholarships'}
            >
              View All Scholarships →
            </button>
          </div>

          {/* ── Top Scholarships ─────────────────── */}
          {result.top_scholarships && result.top_scholarships.length > 0 && (
            <div className="result-section">
              <h4>🏆 Top Scholarship Matches</h4>
              <div className="ranked-list">
                {result.top_scholarships.map((s, idx) => (
                  <div key={s.id} className="ranked-item">
                    <span className="ranked-rank">#{idx + 1}</span>
                    <div className="ranked-info">
                      <span className="ranked-name">{s.name}</span>
                      <span className="ranked-meta">
                        {s.organization} · {s.amount > 0 ? `₹${Number(s.amount).toLocaleString('en-IN')}` : 'Full Funding'}
                        {s.deadline && ` · Deadline: ${s.deadline}`}
                      </span>
                    </div>
                    <span
                      className="ranked-score match-percentage"
                      style={{ color: getMatchColor(s.match_score), background: getMatchBg(s.match_score) }}
                    >
                      {(s.match_score * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Top Exams ────────────────────────── */}
          {result.top_exams && result.top_exams.length > 0 && (
            <div className="result-section">
              <h4>📝 Top Exam Matches</h4>
              <div className="ranked-list">
                {result.top_exams.map((e, idx) => (
                  <div key={e.id} className="ranked-item">
                    <span className="ranked-rank">#{idx + 1}</span>
                    <div className="ranked-info">
                      <span className="ranked-name">{e.name}</span>
                      <span className="ranked-meta">
                        {e.exam_type} · {e.difficulty_level || 'N/A'}
                        {e.exam_date && ` · ${e.exam_date}`}
                      </span>
                    </div>
                    <span
                      className="ranked-score match-percentage"
                      style={{ color: getMatchColor(e.match_score), background: getMatchBg(e.match_score) }}
                    >
                      {(e.match_score * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default RecommendationForm;
