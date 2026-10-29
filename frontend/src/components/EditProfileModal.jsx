/**
 * EditProfileModal — Right-Side Sliding Drawer
 * Slides in from right, 38% width, dark overlay with blur,
 * profile picture section, staggered field animations, micro-interactions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Save, Loader2, User, Mail,
  GraduationCap, Users, BookOpen, Calendar, Wallet, Camera,
} from 'lucide-react';
import { apiService } from '../services/api';
import '../styles/EditProfileModal.css';

/* ── Animation variants ───────────────────────────── */
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.25, ease: 'easeIn' } },
};

const drawerVariants = {
  hidden: { x: '100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: 0.3, ease: [0.55, 0.06, 0.68, 0.19] },
  },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const fieldVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

const EDUCATION_OPTIONS = ['10th', '12th', 'Bachelor', 'Master', 'PhD'];
const CATEGORY_OPTIONS = ['General', 'OBC', 'SC', 'ST', 'EWS'];
const STREAM_OPTIONS = ['Science', 'Commerce', 'Arts', 'Engineering', 'Medical', 'Law'];

const EditProfileModal = ({ isOpen, onClose, user, onUserUpdate }) => {
  const [form, setForm] = useState({
    name: '',
    age: '',
    education_level: '',
    category: '',
    stream: '',
    income: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  /* ── Sync form data when user/open changes ──── */
  useEffect(() => {
    if (isOpen && user) {
      setForm({
        name: user.name || '',
        age: user.age || '',
        education_level: user.education_level || '',
        category: user.category || '',
        stream: user.stream || '',
        income: user.income || '',
      });
      setError('');
      setFocusedField(null);
    }
  }, [isOpen, user]);

  /* ── Lock body scroll when open ────────────── */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  /* ── Escape key to close ───────────────────── */
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  /* ── Handle field change ───────────────────── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  /* ── Submit ────────────────────────────────── */
  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        name: form.name.trim(),
        age: form.age ? Number(form.age) : undefined,
        education_level: form.education_level || undefined,
        category: form.category || undefined,
        stream: form.stream || undefined,
        income: form.income ? Number(form.income) : undefined,
      };

      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

      const response = await apiService.updateProfile(user.id, payload);

      if (response.success && response.user) {
        if (onUserUpdate) onUserUpdate(response.user);
        onClose();
      } else {
        setError(response.error || 'Update failed. Please try again.');
      }
    } catch (err) {
      setError(err.error || err.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const nameInitial = user?.name?.charAt(0).toUpperCase() || '?';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="epm-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        >
          {/* ── Drawer panel ──────────────────── */}
          <motion.div
            className="epm-drawer"
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Edit profile"
          >
            {/* ── Close button ────────────────── */}
            <motion.button
              className="epm-close"
              onClick={onClose}
              whileHover={{ rotate: 90, scale: 1.1, background: 'rgba(255,255,255,0.1)' }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              aria-label="Close"
            >
              <X size={18} />
            </motion.button>

            {/* ── Profile picture header ──────── */}
            <div className="epm-profile-section">
              <motion.div
                className="epm-avatar"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 18 }}
              >
                <span className="epm-avatar-letter">{nameInitial}</span>
                <span className="epm-avatar-ring" />
                <motion.div
                  className="epm-avatar-badge"
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Camera size={12} />
                </motion.div>
              </motion.div>
              <motion.h2
                className="epm-profile-name"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.35 }}
              >
                {user?.name || 'User'}
              </motion.h2>
              <motion.p
                className="epm-profile-email"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.33, duration: 0.35 }}
              >
                {user?.email || 'No email set'}
              </motion.p>
            </div>

            <div className="epm-divider" />

            {/* ── Section heading ─────────────── */}
            <motion.h3
              className="epm-section-title"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25, duration: 0.3 }}
            >
              Edit Profile
            </motion.h3>

            {/* ── Error banner ─────────────── */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="epm-error"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Form fields ──────────────── */}
            <motion.div
              className="epm-body"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {/* Name */}
              <motion.div
                className={`epm-field ${focusedField === 'name' ? 'epm-field--focused' : ''}`}
                variants={fieldVariants}
              >
                <label className="epm-label" htmlFor="epm-name">
                  <User size={13} />
                  <span>Name</span>
                </label>
                <input
                  id="epm-name"
                  className="epm-input"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Your full name"
                />
              </motion.div>

              {/* Email — readonly */}
              <motion.div className="epm-field" variants={fieldVariants}>
                <label className="epm-label" htmlFor="epm-email">
                  <Mail size={13} />
                  <span>Email</span>
                </label>
                <input
                  id="epm-email"
                  className="epm-input epm-input--readonly"
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  tabIndex={-1}
                />
              </motion.div>

              {/* Age + Income */}
              <motion.div className="epm-row" variants={fieldVariants}>
                <div className={`epm-field ${focusedField === 'age' ? 'epm-field--focused' : ''}`}>
                  <label className="epm-label" htmlFor="epm-age">
                    <Calendar size={13} />
                    <span>Age</span>
                  </label>
                  <input
                    id="epm-age"
                    className="epm-input"
                    type="number"
                    name="age"
                    min="10"
                    max="100"
                    value={form.age}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('age')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Age"
                  />
                </div>

                <div className={`epm-field ${focusedField === 'income' ? 'epm-field--focused' : ''}`}>
                  <label className="epm-label" htmlFor="epm-income">
                    <Wallet size={13} />
                    <span>Family Income (₹)</span>
                  </label>
                  <input
                    id="epm-income"
                    className="epm-input"
                    type="number"
                    name="income"
                    min="0"
                    value={form.income}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('income')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Annual income"
                  />
                </div>
              </motion.div>

              {/* Education Level */}
              <motion.div
                className={`epm-field ${focusedField === 'education_level' ? 'epm-field--focused' : ''}`}
                variants={fieldVariants}
              >
                <label className="epm-label" htmlFor="epm-education">
                  <GraduationCap size={13} />
                  <span>Education Level</span>
                </label>
                <select
                  id="epm-education"
                  className="epm-select"
                  name="education_level"
                  value={form.education_level}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('education_level')}
                  onBlur={() => setFocusedField(null)}
                >
                  <option value="">Select education level</option>
                  {EDUCATION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </motion.div>

              {/* Category */}
              <motion.div
                className={`epm-field ${focusedField === 'category' ? 'epm-field--focused' : ''}`}
                variants={fieldVariants}
              >
                <label className="epm-label" htmlFor="epm-category">
                  <Users size={13} />
                  <span>Category</span>
                </label>
                <select
                  id="epm-category"
                  className="epm-select"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('category')}
                  onBlur={() => setFocusedField(null)}
                >
                  <option value="">Select category</option>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </motion.div>

              {/* Stream */}
              <motion.div
                className={`epm-field ${focusedField === 'stream' ? 'epm-field--focused' : ''}`}
                variants={fieldVariants}
              >
                <label className="epm-label" htmlFor="epm-stream">
                  <BookOpen size={13} />
                  <span>Stream</span>
                </label>
                <select
                  id="epm-stream"
                  className="epm-select"
                  name="stream"
                  value={form.stream}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('stream')}
                  onBlur={() => setFocusedField(null)}
                >
                  <option value="">Select stream</option>
                  {STREAM_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </motion.div>
            </motion.div>

            {/* ── Footer actions ────────────── */}
            <div className="epm-footer">
              <motion.button
                className="epm-btn epm-btn--cancel"
                onClick={onClose}
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                disabled={saving}
              >
                Cancel
              </motion.button>
              <motion.button
                className="epm-btn epm-btn--save"
                onClick={handleSave}
                whileHover={{
                  scale: 1.04,
                  y: -2,
                  boxShadow: '0 8px 28px rgba(99,102,241,0.5)',
                }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 size={15} className="epm-spinner" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    Save Changes
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditProfileModal;
