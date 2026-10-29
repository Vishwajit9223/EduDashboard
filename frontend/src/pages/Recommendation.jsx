/**
 * Recommendation Page
 * Scholarship eligibility prediction and AI-ranked recommendations
 */

import React, { useState } from 'react';
import RecommendationForm from '../components/RecommendationForm';
import Card from '../components/Card';

const Recommendation = ({ user }) => {
  const [recommendations, setRecommendations] = useState(null);

  const handleRecommendationResult = (result) => {
    setRecommendations(result);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🎓 Scholarship & Exam Eligibility Checker</h1>
        <p>Get AI-powered scholarship and exam recommendations tailored to your profile</p>
      </div>

      {/* Main Recommendation Card */}
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <RecommendationForm onSubmit={handleRecommendationResult} user={user} />
      </div>

      {/* Ranked Results Summary */}
      {recommendations && recommendations.success && (
        <div style={{ maxWidth: '900px', margin: '3rem auto 0' }}>
          <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>📊 Your Personalized Recommendations</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem'
          }}>
            {/* Scholarship highlights */}
            {recommendations.top_scholarships && recommendations.top_scholarships.length > 0 && (
              <Card title="🏆 Best Scholarship Match" className="recommendation-card">
                <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                  {recommendations.top_scholarships[0].name}
                </p>
                <p style={{ fontSize: '0.9rem', opacity: 0.85 }}>
                  {recommendations.top_scholarships[0].organization}
                  {recommendations.top_scholarships[0].amount > 0
                    ? ` · ₹${Number(recommendations.top_scholarships[0].amount).toLocaleString('en-IN')}`
                    : ' · Full Funding'}
                </p>
                <p style={{ marginTop: '0.5rem' }}>
                  Match: <strong>{(recommendations.top_scholarships[0].match_score * 100).toFixed(0)}%</strong>
                </p>
              </Card>
            )}

            {/* Exam highlights */}
            {recommendations.top_exams && recommendations.top_exams.length > 0 && (
              <Card title="📝 Best Exam Match" className="recommendation-card">
                <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                  {recommendations.top_exams[0].name}
                </p>
                <p style={{ fontSize: '0.9rem', opacity: 0.85 }}>
                  {recommendations.top_exams[0].exam_type}
                  {recommendations.top_exams[0].exam_date && ` · ${recommendations.top_exams[0].exam_date}`}
                </p>
                <p style={{ marginTop: '0.5rem' }}>
                  Match: <strong>{(recommendations.top_exams[0].match_score * 100).toFixed(0)}%</strong>
                </p>
              </Card>
            )}

            {/* Eligibility summary */}
            <Card title="🎯 Eligibility Score" className="recommendation-card">
              <p style={{ fontSize: '2rem', fontWeight: 700 }}>
                {(recommendations.eligibility_score * 100).toFixed(0)}%
              </p>
              <p>{recommendations.eligible ? '✅ You are Eligible!' : '⚠️ Keep improving your profile'}</p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recommendation;
