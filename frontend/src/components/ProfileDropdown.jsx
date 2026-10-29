/**
 * ProfileDropdown Component
 * Premium animated dropdown — avatar pulse, glassmorphism panel, micro-interactions
 * Three-action menu: View Profile · Edit Profile · Logout
 * Edit Profile opens a right-side drawer (EditProfileModal)
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, LogOut, ChevronDown, UserCircle } from 'lucide-react';
import EditProfileModal from './EditProfileModal';
import { useNavigate } from 'react-router-dom';
import '../styles/ProfileDropdown.css';

/* ── Animation variants ───────────────────────────── */
const dropdownVariants = {
  hidden: {
    opacity: 0,
    y: -10,
    scale: 0.96,
    filter: 'blur(4px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 260, damping: 20 },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.96,
    filter: 'blur(3px)',
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.06, duration: 0.25, ease: 'easeOut' },
  }),
};

const ProfileDropdown = ({ user, onLogout, onUserUpdate }) => {
  const [open, setOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  /* ── Close on outside click ────────────────────── */
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  /* ── Close on Escape key ───────────────────────── */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const handleViewProfile = () => {
    setOpen(false);
    // Open drawer in read-only style — same drawer, just focuses view
    setDrawerOpen(true);
  };

  const handleEditProfile = () => {
    setOpen(false);
    setDrawerOpen(true);
  };

  const handleLogout = () => {
    setOpen(false);
    if (onLogout) onLogout();
    navigate('/login');
  };

  const initial = user.name?.charAt(0).toUpperCase() || '?';

  return (
    <>
      <div className="pd-root" ref={dropdownRef}>
        {/* ── Trigger button ──────────────────── */}
        <motion.button
          className="pd-trigger"
          onClick={() => setOpen((v) => !v)}
          whileHover={{
            scale: 1.05,
            boxShadow: '0 0 20px rgba(99,102,241,0.25)',
            background: 'rgba(99,102,241,0.2)',
          }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          aria-haspopup="true"
          aria-expanded={open}
        >
          <motion.div
            className="pd-trigger-avatar"
            animate={{
              boxShadow: open
                ? '0 0 0 3px rgba(129,140,248,0.5), 0 0 16px rgba(99,102,241,0.3)'
                : '0 0 0 0px transparent, 0 0 0px transparent',
            }}
            transition={{ duration: 0.3 }}
          >
            {initial}
          </motion.div>
          <span className="pd-trigger-name">{user.name}</span>
          <motion.span
            className="pd-trigger-chevron"
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          >
            <ChevronDown size={15} />
          </motion.span>
        </motion.button>

        {/* ── Dropdown panel ──────────────────── */}
        <AnimatePresence>
          {open && (
            <motion.div
              className="pd-dropdown"
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              role="menu"
            >
              {/* User info header */}
              <motion.div
                className="pd-info"
                variants={itemVariants}
                custom={0}
                initial="hidden"
                animate="visible"
              >
                <div className="pd-info-avatar">
                  <span className="pd-info-avatar-letter">{initial}</span>
                  <span className="pd-avatar-pulse" />
                </div>
                <div className="pd-info-text">
                  <span className="pd-info-name">{user.name}</span>
                  <span className="pd-info-email">{user.email || 'No email set'}</span>
                </div>
              </motion.div>

              <div className="pd-divider" />

              {/* ── View Profile ─────────────── */}
              <motion.button
                className="pd-action"
                onClick={handleViewProfile}
                variants={itemVariants}
                custom={1}
                initial="hidden"
                animate="visible"
                whileHover={{
                  x: 4,
                  y: -2,
                  backgroundColor: 'rgba(99,102,241,0.1)',
                }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                role="menuitem"
              >
                <span className="pd-action-icon">
                  <UserCircle size={15} />
                </span>
                <span>View Profile</span>
              </motion.button>

              {/* ── Edit Profile ─────────────── */}
              <motion.button
                className="pd-action"
                onClick={handleEditProfile}
                variants={itemVariants}
                custom={2}
                initial="hidden"
                animate="visible"
                whileHover={{
                  x: 4,
                  y: -2,
                  backgroundColor: 'rgba(99,102,241,0.1)',
                }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                role="menuitem"
              >
                <span className="pd-action-icon">
                  <Pencil size={15} />
                </span>
                <span>Edit Profile</span>
              </motion.button>

              {/* ── Logout ───────────────────── */}
              <motion.button
                className="pd-action pd-action--danger"
                onClick={handleLogout}
                variants={itemVariants}
                custom={3}
                initial="hidden"
                animate="visible"
                whileHover={{
                  x: 4,
                  y: -2,
                  backgroundColor: 'rgba(239,68,68,0.1)',
                }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                role="menuitem"
              >
                <span className="pd-action-icon pd-action-icon--danger">
                  <LogOut size={15} />
                </span>
                <span>Logout</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Edit Profile Drawer ───────────────── */}
      <EditProfileModal
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
        onUserUpdate={onUserUpdate}
      />
    </>
  );
};

export default ProfileDropdown;
