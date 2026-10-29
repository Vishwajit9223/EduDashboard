/**
 * Reusable Form Input Component
 * Standardized input field with label and error handling
 */

import React from 'react';

const FormInput = ({
  label,
  id,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error = '',
  options = null,
  min,
  max,
  className = ''
}) => {
  return (
    <div className={`form-input-group ${error ? 'error' : ''} ${className}`}>
      {label && (
        <label htmlFor={id} className="form-input-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      
      {options ? (
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          className="form-input-field form-select"
          required={required}
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="form-input-field"
          required={required}
          min={min}
          max={max}
        />
      )}
      
      {error && <div className="form-error-message">{error}</div>}
    </div>
  );
};

export default FormInput;
