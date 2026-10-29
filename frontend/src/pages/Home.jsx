/**
 * Home Page
 * Animated landing for guests · Animated dashboard for logged-in users
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  GraduationCap,
  BookOpen,
  Bot,
  BarChart3,
  Star,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { apiService } from '../services/api';
import DashboardCards from '../components/DashboardCards';
import Charts from '../components/Charts';
import Footer from '../components/Footer';
import '../styles/Pages.css';

/* ── Animation variants ──────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: 'easeOut' },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.14 } },
};

const floatCard = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.13, duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

/* ── Scroll-reveal wrapper ───────────────────────── */

const ScrollReveal = ({ children, className = '', delay = 0 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

/* ── Feature data ────────────────────────────────── */

const features = [
  {
    icon: <GraduationCap size={32} />,
    title: 'Find Scholarships',
    desc: 'Discover and filter scholarships matching your profile and eligibility.',
    color: '#6366f1',
  },
  {
    icon: <BookOpen size={32} />,
    title: 'Exam Preparation',
    desc: 'Track competitive exams like JEE, NEET, CAT with deadlines and tips.',
    color: '#f59e0b',
  },
  {
    icon: <Bot size={32} />,
    title: 'AI Chat Assistant',
    desc: 'Get instant guidance on scholarships, careers, and study strategies.',
    color: '#10b981',
  },
  {
    icon: <BarChart3 size={32} />,
    title: 'Track Applications',
    desc: 'Monitor your scholarship applications and get personalized recommendations.',
    color: '#ec4899',
  },
];

/* ── Static stats (match rate & support are fixed) ─ */

const staticStats = [
  { value: '95%', label: 'Match Rate' },
  { value: '24/7', label: 'AI Support' },
];

/* ================================================================
   Component
   ================================================================ */

const Home = ({ user }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [platformStats, setPlatformStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* Fetch platform-wide stats for guest landing page */
  useEffect(() => {
    apiService.getStats()
      .then(data => { if (data.success) setPlatformStats(data); })
      .catch(() => { /* silent – landing still renders fine */ });
  }, []);

  useEffect(() => {
    if (user?.id) fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const response = await apiService.getDashboardStats(user.id);
      if (response.success) setStats(response.stats);
      else setError('Failed to load dashboard data');
    } catch {
      setError('Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  /* ── Guest landing ─────────────────────────────── */
  if (!user) {
    return (
      <div className="page-container home-page page-with-footer">
        {/* Hero */}
        <section className="hero-section">
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'backOut' }}
          >
            <Sparkles size={14} /> AI-Powered Platform
          </motion.div>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.6 }}
          >
            AI Smart Scholarship
            <br />
            <span className="hero-title-accent">&amp; Exam Manager</span>
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26, duration: 0.55 }}
          >
            A modern platform that helps students discover scholarships, prepare for
            competitive exams, and get AI-powered career guidance — all in one place.
          </motion.p>

          {/* CTA */}
          <motion.div
            className="hero-cta"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42, duration: 0.5 }}
          >
            <motion.button
              className="cta-primary"
              onClick={() => navigate('/register')}
              whileHover={{ scale: 1.06, boxShadow: '0 8px 30px rgba(99,102,241,0.45)' }}
              whileTap={{ scale: 0.96 }}
            >
              Get Started Free <ArrowRight size={18} className="cta-arrow" />
            </motion.button>
            <motion.button
              className="cta-secondary"
              onClick={() => navigate('/scholarships')}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.96 }}
            >
              Browse Scholarships
            </motion.button>
          </motion.div>
        </section>

        {/* Stats bar */}
        <ScrollReveal>
          <section className="stats-bar">
            {[
              { value: `${platformStats?.total_scholarships ?? 0}+`, label: 'Scholarships' },
              { value: `${platformStats?.total_users ?? 0}+`, label: 'Students' },
              ...staticStats,
            ].map((s, i) => (
              <motion.div
                key={i}
                className="stat-item"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <span className="stat-value">{s.value}</span>
                <span className="stat-label">{s.label}</span>
              </motion.div>
            ))}
          </section>
        </ScrollReveal>

        {/* Feature cards */}
        <ScrollReveal>
          <section className="features-section">
            <h2 className="section-heading">Everything You Need</h2>
            <p className="section-subheading">
              Powerful tools designed to simplify your academic journey
            </p>

            <motion.div
              className="hero-features"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
            >
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  className="feature-card glass"
                  variants={floatCard}
                  custom={i}
                  whileHover={{
                    y: -8,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.10)',
                    transition: { duration: 0.3 },
                  }}
                >
                  <motion.span
                    className="feature-icon-wrapper"
                    style={{ '--icon-color': f.color }}
                    whileHover={{ scale: 1.15, rotate: [0, -8, 8, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    {f.icon}
                  </motion.span>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </section>
        </ScrollReveal>

        {/* How it works */}
        <ScrollReveal>
          <section className="how-section">
            <h2 className="section-heading">How It Works</h2>
            <p className="section-subheading">
              Three simple steps to unlock your potential
            </p>
            <div className="how-steps">
              {[
                { step: '01', title: 'Create Profile', desc: 'Sign up and fill in your academic details and preferences.' },
                { step: '02', title: 'Get Matched', desc: 'Our AI analyzes your profile and finds the best opportunities.' },
                { step: '03', title: 'Apply & Track', desc: 'Apply to scholarships and track all your applications in one place.' },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  className="how-step-card"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.55 }}
                  whileHover={{ y: -4 }}
                >
                  <span className="how-step-number">{s.step}</span>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </section>
        </ScrollReveal>

        <Footer />
      </div>
    );
  }

  /* ── Logged-in dashboard ───────────────────────── */
  return (
    <div className="page-container dashboard-page page-with-footer">
      <motion.div
        className="page-header dashboard-header"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1>
          <motion.span
            style={{ display: 'inline-block' }}
            animate={{ rotate: [0, 14, -8, 14, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 3 }}
          >
            👋
          </motion.span>{' '}
          Welcome back, <span className="welcome-name">{user.name}</span>!
        </h1>
        <p>Your AI-powered scholarship and exam management dashboard</p>
      </motion.div>

      {error && <div className="error-banner">{error}</div>}

      <section className="dashboard-section dashboard-section--cards">
        <DashboardCards stats={stats} loading={loading} />
      </section>

      <div className="dashboard-divider" aria-hidden="true" />

      <section className="dashboard-section dashboard-section--charts">
        <Charts data={{}} />
      </section>

      {/* Quick Actions */}
      <motion.div
        className="quick-actions"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={staggerContainer}
      >
        <motion.h2 variants={fadeUp}>Quick Actions</motion.h2>
        <div className="action-buttons">
          {[
            { icon: <Star size={26} />, label: 'Check Eligibility', path: '/recommendation' },
            { icon: <GraduationCap size={26} />, label: 'View Scholarships', path: '/scholarships' },
            { icon: <Bot size={26} />, label: 'Ask AI Assistant', path: '/chatbot' },
            { icon: <BookOpen size={26} />, label: 'Explore Exams', path: '/exams' },
          ].map((a, i) => (
            <motion.button
              key={i}
              className="action-btn"
              onClick={() => navigate(a.path)}
              variants={fadeUp}
              custom={i}
              whileHover={{ scale: 1.04, y: -4 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="action-icon">{a.icon}</span>
              <span>{a.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      <Footer />
    </div>
  );
};

export default Home;
