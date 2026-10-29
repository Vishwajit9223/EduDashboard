/**
 * Form Validation Service
 * Reusable validation functions for all forms
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {object} { isValid: boolean, message: string }
 */
export const validateEmail = (email) => {
  if (!email || email.trim() === '') {
    return { isValid: false, message: 'Email is required' };
  }

  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailPattern.test(email.trim())) {
    return { isValid: false, message: 'Invalid email format' };
  }

  return { isValid: true, message: '' };
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} { isValid: boolean, message: string }
 */
export const validatePassword = (password) => {
  if (!password || password === '') {
    return { isValid: false, message: 'Password is required' };
  }

  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters' };
  }

  return { isValid: true, message: '' };
};

/**
 * Validate name
 * @param {string} name - Name to validate
 * @returns {object} { isValid: boolean, message: string }
 */
export const validateName = (name) => {
  if (!name || name.trim() === '') {
    return { isValid: false, message: 'Name is required' };
  }

  if (name.trim().length < 3) {
    return { isValid: false, message: 'Name must be at least 3 characters' };
  }

  return { isValid: true, message: '' };
};

/**
 * Validate phone number (exactly 10 digits)
 * @param {string} phone - Phone number to validate
 * @returns {object} { isValid: boolean, message: string }
 */
export const validatePhone = (phone) => {
  if (!phone || phone.trim() === '') {
    return { isValid: false, message: 'Phone number is required' };
  }

  const phonePattern = /^[0-9]{10}$/;
  if (!phonePattern.test(phone.trim())) {
    return { isValid: false, message: 'Phone number must be exactly 10 digits' };
  }

  return { isValid: true, message: '' };
};

/**
 * Validate age (number within range)
 * @param {number|string} age - Age to validate
 * @param {number} min - Minimum age
 * @param {number} max - Maximum age
 * @returns {object} { isValid: boolean, message: string }
 */
export const validateAge = (age, min = 13, max = 80) => {
  if (!age || age === '') {
    return { isValid: false, message: 'Age is required' };
  }

  const ageNum = Number(age);
  if (isNaN(ageNum)) {
    return { isValid: false, message: 'Age must be a valid number' };
  }

  if (ageNum < min || ageNum > max) {
    return { isValid: false, message: `Age must be between ${min} and ${max}` };
  }

  return { isValid: true, message: '' };
};

/**
 * Validate income (positive number)
 * @param {number|string} income - Income to validate
 * @returns {object} { isValid: boolean, message: string }
 */
export const validateIncome = (income) => {
  if (!income || income === '') {
    return { isValid: false, message: 'Annual income is required' };
  }

  const incomeNum = Number(income);
  if (isNaN(incomeNum)) {
    return { isValid: false, message: 'Income must be a valid number' };
  }

  if (incomeNum < 0) {
    return { isValid: false, message: 'Income cannot be negative' };
  }

  return { isValid: true, message: '' };
};

/**
 * Validate required field
 * @param {any} value - Value to validate
 * @param {string} fieldName - Field name for error message
 * @returns {object} { isValid: boolean, message: string }
 */
export const validateRequired = (value, fieldName = 'Field') => {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, message: `${fieldName} is required` };
  }

  if (typeof value === 'string' && value.trim() === '') {
    return { isValid: false, message: `${fieldName} is required` };
  }

  return { isValid: true, message: '' };
};

/**
 * Validate registration form
 * @param {object} formData - Form data object
 * @returns {object} { isValid: boolean, errors: object }
 */
export const validateRegistrationForm = (formData) => {
  const errors = {};

  // Validate name
  const nameValidation = validateName(formData.name);
  if (!nameValidation.isValid) {
    errors.name = nameValidation.message;
  }

  // Validate email
  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.message;
  }

  // Validate password
  const passwordValidation = validatePassword(formData.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.message;
  }

  // Validate age
  if (formData.age) {
    const ageValidation = validateAge(formData.age);
    if (!ageValidation.isValid) {
      errors.age = ageValidation.message;
    }
  }

  // Validate income
  if (formData.income) {
    const incomeValidation = validateIncome(formData.income);
    if (!incomeValidation.isValid) {
      errors.income = incomeValidation.message;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate login form
 * @param {object} formData - Form data object
 * @returns {object} { isValid: boolean, errors: object }
 */
export const validateLoginForm = (formData) => {
  const errors = {};

  // Validate email
  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.message;
  }

  // Validate password
  const passwordValidation = validatePassword(formData.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.message;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate recommendation form
 * @param {object} formData - Form data object
 * @returns {object} { isValid: boolean, errors: object }
 */
export const validateRecommendationForm = (formData) => {
  const errors = {};

  // Validate age
  const ageValidation = validateAge(formData.age);
  if (!ageValidation.isValid) {
    errors.age = ageValidation.message;
  }

  // Validate income
  const incomeValidation = validateIncome(formData.income);
  if (!incomeValidation.isValid) {
    errors.income = incomeValidation.message;
  }

  // Validate category
  const categoryValidation = validateRequired(formData.category, 'Category');
  if (!categoryValidation.isValid) {
    errors.category = categoryValidation.message;
  }

  // Validate education level
  const educationValidation = validateRequired(formData.education_level, 'Education Level');
  if (!educationValidation.isValid) {
    errors.education_level = educationValidation.message;
  }

  // Validate stream
  const streamValidation = validateRequired(formData.stream, 'Stream');
  if (!streamValidation.isValid) {
    errors.stream = streamValidation.message;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
