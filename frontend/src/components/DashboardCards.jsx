/**
 * Dashboard Cards Component
 * Staggered entrance + hover lift + CountUp number animation
 */

import React from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import '../styles/DashboardCards.css';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } },
};

const DashboardCards = ({ stats, loading = false }) => {
  const cards = [
    {
      id: 'scholarships',
      label: 'Total Scholarships',
      value: stats?.total_scholarships || 0,
      icon: '🎓',
      color: 'blue',
      description: 'Available opportunities',
      isPercent: false,
    },
    {
      id: 'applications',
      label: 'Applications',
      value: stats?.applications_submitted || 0,
      icon: '📋',
      color: 'green',
      description: 'Total submitted',
      isPercent: false,
    },
    {
      id: 'approved',
      label: 'Approved',
      value: stats?.approved_applications || 0,
      icon: '✅',
      color: 'success',
      description: 'Approved applications',
      isPercent: false,
    },
    {
      id: 'eligibility',
      label: 'Eligibility Score',
      value: parseFloat(((stats?.eligibility_score || 0) * 100).toFixed(1)),
      icon: '⭐',
      color: 'purple',
      description: 'Your score',
      isPercent: true,
    },
  ];

  if (loading) {
    return (
      <div className="dashboard-cards">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="dashboard-card skeleton">
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className="dashboard-cards"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {cards.map((card) => (
        <motion.div
          key={card.id}
          className={`dashboard-card ${card.color}`}
          variants={cardVariants}
          whileHover={{ y: -5, scale: 1.02, boxShadow: '0 16px 34px rgba(0,0,0,0.14)' }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <div className="card-header">
            <div className="card-icon">{card.icon}</div>
            <div className="card-label">{card.label}</div>
          </div>
          <div className="card-body">
            <div className="card-value">
              <CountUp
                end={card.value}
                duration={1.6}
                decimals={card.isPercent ? 1 : 0}
                suffix={card.isPercent ? '%' : ''}
                enableScrollSpy
                scrollSpyOnce
              />
            </div>
            {card.isPercent && (
              <div className="card-progress">
                <div className="card-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={card.value}>
                  <div className="card-progress-fill" style={{ width: `${Math.max(0, Math.min(card.value, 100))}%` }} />
                </div>
              </div>
            )}
            <div className="card-description">{card.description}</div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default DashboardCards;
