/**
 * Sidebar Component
 * Overlay drawer — hidden by default, slides in from left with stagger animation
 */

import { NavLink } from 'react-router-dom';
import { Home, FileText, GraduationCap, Sparkles, Bot, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/Sidebar.css';

const navItems = [
  { to: '/', icon: Home, label: 'Home', end: true },
  { to: '/exams', icon: FileText, label: 'Exams' },
  { to: '/scholarships', icon: GraduationCap, label: 'Scholarships' },
  { to: '/recommendation', icon: Sparkles, label: 'Recommendation' },
  { to: '/chatbot', icon: Bot, label: 'AI Chat' },
];

const sidebarVariants = {
  hidden: { x: '-100%' },
  visible: { x: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1], staggerChildren: 0.06, delayChildren: 0.1 } },
  exit: { x: '-100%', transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
};

const linkVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Overlay ───────────────────────── */}
          <motion.div
            className="sidebar-overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          {/* ── Drawer ────────────────────────── */}
          <motion.aside
            className="sidebar"
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Close button */}
            <motion.button
              className="sidebar-close"
              onClick={onClose}
              whileHover={{ scale: 1.12, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Close sidebar"
            >
              <X size={20} />
            </motion.button>

            <nav className="sidebar-nav">
              {navItems.map(({ to, icon: Icon, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                  onClick={onClose}
                >
                  {({ isActive }) => (
                    <motion.div
                      className="sidebar-link-inner"
                      variants={linkVariants}
                      whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.06)' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <motion.div
                          className="sidebar-active-bar"
                          layoutId="sidebar-active-bar"
                          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        />
                      )}

                      <motion.span
                        className="sidebar-link-icon"
                        whileHover={{ scale: 1.18 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                      >
                        <Icon size={20} />
                      </motion.span>

                      <span className="sidebar-link-label">{label}</span>

                      {isActive && (
                        <motion.div
                          className="sidebar-active-glow"
                          layoutId="sidebar-glow"
                          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        />
                      )}
                    </motion.div>
                  )}
                </NavLink>
              ))}
            </nav>

            <motion.div
              className="sidebar-footer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ delay: 0.4 }}
            >
              v1.0 &copy; 2026
            </motion.div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
