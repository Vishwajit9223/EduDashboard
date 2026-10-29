/**
 * Reusable Card Component
 * Generic card container with optional header and footer
 */

import React from 'react';

const Card = ({
  title,
  subtitle,
  children,
  footer,
  className = '',
  noPadding = false,
  gradient = false
}) => {
  return (
    <div className={`card ${className} ${gradient ? 'gradient' : ''}`}>
      {title && (
        <div className="card-header">
          <h2 className="card-title">{title}</h2>
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
      )}
      
      <div className={`card-body ${noPadding ? 'no-padding' : ''}`}>
        {children}
      </div>
      
      {footer && (
        <div className="card-footer">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
