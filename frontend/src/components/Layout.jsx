/**
 * Layout Component
 * Header + Overlay Sidebar Drawer + Content with AnimatePresence page transitions
 */

import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './Header';
import Sidebar from './Sidebar';
import '../styles/layout.css';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: 'easeIn' } },
};

const Layout = ({ children, user, onLogout, onUserUpdate }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-shell">
      <Header
        user={user}
        onLogout={onLogout}
        onUserUpdate={onUserUpdate}
        onToggleSidebar={toggleSidebar}
      />

      {/* Sidebar drawer (overlay, does not push content) */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      <div className="app-layout">
        <div className="layout-main">
          <div className="layout-content">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                variants={pageVariants}
                initial="initial"
                animate="enter"
                exit="exit"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
