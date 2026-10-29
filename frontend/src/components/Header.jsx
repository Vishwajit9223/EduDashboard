/**
 * Header Component
 * Auto-hide on scroll-down, reveal on scroll-up (Stripe / Linear pattern)
 * Backdrop blur intensifies + shadow appears when scrolled past top
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProfileDropdown from './ProfileDropdown';
import '../styles/Header.css';

const SCROLL_THRESHOLD = 8; // ignore micro-scrolls

const Header = ({ user, onLogout, onUserUpdate, onToggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false); // true once past ~20px
  const [atBottom, setAtBottom] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);

  /* ── Scroll direction + bottom detection ──── */
  const handleScroll = useCallback(() => {
    const y = window.scrollY;
    const delta = y - lastY.current;
    const nearBottom =
      window.innerHeight + y >= document.documentElement.scrollHeight - 20;

    setAtBottom(nearBottom);

    // At bottom → always force visible
    if (nearBottom) {
      setVisible(true);
      setScrolled(true);
      lastY.current = y;
      ticking.current = false;
      return;
    }

    // At the very top → always show, remove "scrolled" styling
    if (y <= 10) {
      setVisible(true);
      setScrolled(false);
      lastY.current = y;
      ticking.current = false;
      return;
    }

    setScrolled(true);

    if (Math.abs(delta) > SCROLL_THRESHOLD) {
      setVisible(delta < 0); // up → show, down → hide
      lastY.current = y;
    }

    ticking.current = false;
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true;
        requestAnimationFrame(handleScroll);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [handleScroll]);

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate('/login');
  };

  /* Build dynamic class list */
  const hdrClass = [
    'hdr',
    !visible && 'hdr--hidden',
    scrolled && 'hdr--scrolled',
    atBottom && 'hdr--at-bottom',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <motion.header
      className={hdrClass}
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
    >
      {/* ── Left: Hamburger + Logo ────────────── */}
      <div className="hdr-left">
        <motion.button
          className="hdr-hamburger"
          onClick={onToggleSidebar}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          aria-label="Toggle sidebar"
        >
          <span className="hdr-hamburger-line" />
          <span className="hdr-hamburger-line" />
          <span className="hdr-hamburger-line" />
        </motion.button>

        <motion.div
          className="hdr-logo"
          onClick={() => navigate('/')}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <motion.span
            className="hdr-logo-icon"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            🎓
          </motion.span>
          <span className="hdr-logo-text">
            Edu<span className="hdr-logo-accent">Dashboard</span>
          </span>
        </motion.div>
      </div>

      {/* ── Right controls ───────────────────── */}
      <motion.div
        className="hdr-actions"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        {user ? (
          <ProfileDropdown
            user={user}
            onLogout={handleLogout}
            onUserUpdate={onUserUpdate}
          />
        ) : (
          <>
            {location.pathname !== '/login' && (
              <motion.button
                className="hdr-btn hdr-btn--login"
                onClick={() => navigate('/login')}
                whileHover={{ scale: 1.06, boxShadow: '0 6px 22px rgba(99,102,241,0.5)' }}
                whileTap={{ scale: 0.95 }}
              >
                Login
              </motion.button>
            )}
            {location.pathname !== '/register' && (
              <motion.button
                className="hdr-btn hdr-btn--register"
                onClick={() => navigate('/register')}
                whileHover={{ scale: 1.06, boxShadow: '0 6px 22px rgba(16,185,129,0.45)' }}
                whileTap={{ scale: 0.95 }}
              >
                Register
              </motion.button>
            )}
          </>
        )}
      </motion.div>
    </motion.header>
  );
};

export default Header;
