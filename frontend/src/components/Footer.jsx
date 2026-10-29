/**
 * Footer Component
 * Seamless warm-gradient footer with animated FAQ, staggered columns,
 * gradient divider, micro-interactions, floating accents, scroll-to-top,
 * frosted glass FAQ cards, shrink-on-scroll, and full-width layout.
 *
 * Background: transparent — inherits the Home section warm gradient.
 * Scroll detection: requestAnimationFrame-throttled scroll listener
 * Fade-in: IntersectionObserver (fires once at 5 % threshold)
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Github,
  Linkedin,
  Twitter,
} from 'lucide-react';
import '../styles/Footer.css';

/* ── FAQ data ─────────────────────────────────────── */

const faqItems = [
  {
    q: 'What is EduDashboard?',
    a: 'EduDashboard is an AI-powered platform that helps students discover scholarships, prepare for competitive exams, and receive personalized career guidance — all in one unified dashboard.',
  },
  {
    q: 'How does AI recommendation work?',
    a: 'Our AI analyzes your academic profile, preferences, and eligibility criteria to match you with the most relevant scholarships and exam preparation paths using Google Gemini.',
  },
  {
    q: 'How do I apply for scholarships?',
    a: 'Browse the Scholarships page to explore available opportunities. Each listing includes eligibility details, deadlines, and direct application links so you can apply with ease.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. All data is stored locally in a secure database and your sessions are protected. We never share your personal information with third parties.',
  },
  {
    q: 'Is EduDashboard free to use?',
    a: 'Absolutely. EduDashboard is completely free for students. Create an account and start discovering scholarships and exam opportunities right away.',
  },
];

/* ── Animation variants ───────────────────────────── */

const containerStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const columnFade = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: 'easeOut' },
  },
};

/* ── Accordion Item ───────────────────────────────── */

const AccordionItem = ({ item, isOpen, toggle, index }) => (
  <motion.div
    className="faq-item"
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.07, duration: 0.4 }}
  >
    <button className="faq-question" onClick={toggle} aria-expanded={isOpen}>
      <span>{item.q}</span>
      <motion.span
        className="faq-chevron"
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <ChevronDown size={18} />
      </motion.span>
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          className="faq-answer-wrapper"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
        >
          <p className="faq-answer">{item.a}</p>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

/* ── Footer link columns data ─────────────────────── */

const quickLinks = [
  { label: 'Home', path: '/' },
  { label: 'Scholarships', path: '/scholarships' },
  { label: 'Exams', path: '/exams' },
  { label: 'AI Chat', path: '/chatbot' },
];

const resources = [
  { label: 'Recommendation', path: '/recommendation' },
  { label: 'Register', path: '/register' },
  { label: 'Login', path: '/login' },
];

const socialLinks = [
  { icon: <Github size={18} />, href: '#', label: 'GitHub' },
  { icon: <Linkedin size={18} />, href: '#', label: 'LinkedIn' },
  { icon: <Twitter size={18} />, href: '#', label: 'Twitter' },
];

/* ── Contact item with hover interaction ──────────── */

const ContactItem = ({ icon: Icon, children }) => (
  <motion.li
    className="footer-contact-item"
    whileHover={{ x: 4 }}
    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
  >
    <motion.span
      className="footer-contact-icon"
      whileHover={{ rotate: 12, scale: 1.18 }}
      transition={{ type: 'spring', stiffness: 300, damping: 12 }}
    >
      <Icon size={15} />
    </motion.span>
    <span>{children}</span>
  </motion.li>
);

/* ── Scroll-to-Top button ─────────────────────────── */

const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollUp = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          className="scroll-to-top"
          onClick={scrollUp}
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          whileHover={{
            scale: 1.14,
            boxShadow: '0 8px 28px rgba(0,0,0,0.12)',
          }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          aria-label="Scroll to top"
        >
          <ChevronUp size={20} />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

/* ═══════════════════════════════════════════════════════
   Scroll hooks — pure JS, no libraries
   ═══════════════════════════════════════════════════════ */

/**
 * useFooterShrink
 * Uses a rAF-throttled scroll listener.
 * Shrinks when the user has scrolled past 60 % of the total scrollable height
 * OR when the footer itself is ≥ 50 % inside the viewport — whichever comes
 * first. Restores when both conditions are false.
 */
const useFooterShrink = (footerRef) => {
  const [shrink, setShrink] = useState(false);

  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;

    let ticking = false;

    const check = () => {
      const { scrollY, innerHeight } = window;
      const docH = document.documentElement.scrollHeight;

      // Global scroll ratio (0 → 1)
      const scrollRatio = scrollY / (docH - innerHeight || 1);

      // Footer-specific visibility ratio (0 → 1)
      const rect = el.getBoundingClientRect();
      const visRatio = Math.max(
        0,
        Math.min(1, (innerHeight - rect.top) / (rect.height || 1))
      );

      setShrink(scrollRatio > 0.6 || visRatio > 0.5);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(check);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    check(); // initial
    return () => window.removeEventListener('scroll', onScroll);
  }, [footerRef]);

  return shrink;
};

/**
 * useFooterVisible
 * IntersectionObserver — fires once when 5 % of the footer enters the viewport.
 * Used for the fade-in entrance animation.
 */
const useFooterVisible = (footerRef) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect(); // fire once
        }
      },
      { threshold: 0.05 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [footerRef]);

  return visible;
};

/* ================================================================
   Footer Component
   ================================================================ */

const Footer = () => {
  const navigate = useNavigate();
  const [openIdx, setOpenIdx] = useState(null);
  const footerRef = useRef(null);
  const inView = useInView(footerRef, { once: true, amount: 0.1 });

  const shrink = useFooterShrink(footerRef);
  const footerVisible = useFooterVisible(footerRef);

  const toggle = (i) => setOpenIdx(openIdx === i ? null : i);

  const footerClasses = [
    'site-footer',
    shrink ? 'footer--shrink' : '',
    footerVisible ? 'footer--visible' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <footer className={footerClasses} ref={footerRef}>
      {/* ── Decorative layers ───────────────────────── */}
      <div className="footer-glass-bg" aria-hidden="true" />
      <div className="footer-top-glow" aria-hidden="true" />
      <div className="footer-bg-accent footer-bg-accent--right" aria-hidden="true" />
      <div className="footer-bg-accent footer-bg-accent--left" aria-hidden="true" />

      {/* ── Content wrapper (sidebar-aware) ──────────── */}
      <div className="footer-inner">
        {/* FAQ Section */}
        <section className="faq-section">
          <motion.h2
            className="faq-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Frequently Asked Questions
          </motion.h2>
          <motion.p
            className="faq-subtitle"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            Quick answers to common questions about EduDashboard
          </motion.p>
          <div className="faq-list">
            {faqItems.map((item, i) => (
              <AccordionItem
                key={i}
                item={item}
                index={i}
                isOpen={openIdx === i}
                toggle={() => toggle(i)}
              />
            ))}
          </div>
        </section>

        {/* Gradient divider */}
        <div className="footer-divider" aria-hidden="true">
          <div className="footer-divider-shimmer" />
        </div>

        {/* Footer main grid */}
        <motion.div
          className="footer-grid"
          variants={containerStagger}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {/* Brand */}
          <motion.div className="footer-col footer-brand" variants={columnFade}>
            <div className="footer-logo">
              <GraduationCap size={24} />
              <span>EduDashboard</span>
            </div>
            <p className="footer-desc">
              AI-powered platform helping students discover scholarships, prepare for
              exams, and build a brighter academic future.
            </p>
            <div className="footer-socials">
              {socialLinks.map((s, i) => (
                <motion.a
                  key={i}
                  href={s.href}
                  className="social-icon"
                  aria-label={s.label}
                  whileHover={{ y: -3, scale: 1.14 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {s.icon}
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div className="footer-col" variants={columnFade}>
            <h4 className="footer-col-title">Quick Links</h4>
            <ul className="footer-links">
              {quickLinks.map((l, i) => (
                <li key={i}>
                  <button
                    onClick={() => navigate(l.path)}
                    className="footer-link"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Resources */}
          <motion.div className="footer-col" variants={columnFade}>
            <h4 className="footer-col-title">Resources</h4>
            <ul className="footer-links">
              {resources.map((l, i) => (
                <li key={i}>
                  <button
                    onClick={() => navigate(l.path)}
                    className="footer-link"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div className="footer-col" variants={columnFade}>
            <h4 className="footer-col-title">Contact</h4>
            <ul className="footer-contact">
              <ContactItem icon={Mail}>support@edudashboard.com</ContactItem>
              <ContactItem icon={Phone}>+91 98765 43210</ContactItem>
              <ContactItem icon={MapPin}>Mumbai, India</ContactItem>
            </ul>
          </motion.div>
        </motion.div>

        {/* Bottom bar */}
        <motion.div
          className="footer-bottom"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <span>
            &copy; {new Date().getFullYear()} EduDashboard — Built with React
            &amp; Flask
          </span>
        </motion.div>
      </div>

      {/* Scroll-to-top */}
      <ScrollToTop />
    </footer>
  );
};

export default Footer;
