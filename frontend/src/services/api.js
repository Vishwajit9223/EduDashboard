/**
 * API Service Module
 * Centralized API communication layer with improved error handling and diagnostics
 */

import axios from 'axios';

// API Configuration from environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000');
const IS_DEBUG = import.meta.env.VITE_DEBUG === 'true' || import.meta.env.DEV;

console.log('[API] Configuration:', {
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  debug: IS_DEBUG,
  environment: import.meta.env.MODE
});

// ============ NETWORK DIAGNOSTICS ============

/**
 * Check if backend server is reachable
 */
export const checkServerHealth = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/health', {
      timeout: 5000,
      validateStatus: () => true // Don't throw on any status
    });
    
    console.log('[HEALTH] Backend response:', response.status, response.data);
    return {
      isReachable: response.status < 500,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    console.error('[HEALTH] Backend unreachable:', {
      message: error.message,
      code: error.code,
      errno: error.errno
    });
    
    return {
      isReachable: false,
      error: error.message,
      code: error.code
    };
  }
};

/**
 * Get network diagnostics information
 */
export const getNetworkDiagnostics = async () => {
  console.log('[DIAGNOSTICS] Starting network checks...');
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    frontend: {
      url: window.location.href,
      host: window.location.host,
      protocol: window.location.protocol
    },
    backend: {
      expectedUrl: API_BASE_URL,
      timeout: API_TIMEOUT
    },
    health: await checkServerHealth(),
    browser: {
      userAgent: navigator.userAgent,
      online: navigator.onLine
    }
  };
  
  console.log('[DIAGNOSTICS] Results:', diagnostics);
  return diagnostics;
};

// ============ AXIOS INSTANCE ============

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// REQUEST interceptor for adding auth token
api.interceptors.request.use(
  config => {
    const token = sessionStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (IS_DEBUG) {
      console.log('[API REQUEST]', {
        method: config.method?.toUpperCase(),
        url: config.url,
        fullURL: config.baseURL + config.url,
        timeout: config.timeout,
        hasAuth: !!token
      });
    }
    
    return config;
  },
  error => {
    console.error('[API REQUEST ERROR]', error.message);
    return Promise.reject(error);
  }
);

// RESPONSE interceptor for error handling
api.interceptors.response.use(
  response => {
    if (IS_DEBUG) {
      console.log('[API RESPONSE]', {
        status: response.status,
        statusText: response.statusText,
        url: response.config.url,
        dataKeys: Object.keys(response.data || {})
      });
    }
    return response;
  },
  error => {
    console.error('[API ERROR DETAILS]', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      timeout: error.config?.timeout,
      errno: error.errno,
      syscall: error.syscall
    });
    
    if (error.response?.status === 401) {
      // Handle unauthorized
      console.warn('[API] Unauthorized (401) - redirecting to login');
      sessionStorage.removeItem('userToken');
      sessionStorage.removeItem('userData');
      window.location.href = '/login';
    }
    
    // Return the error as-is for the calling function to handle
    return Promise.reject(error);
  }
);

// ============ ERROR HANDLING UTILITIES ============

/**
 * Format error message with debugging information
 */
const formatErrorMessage = (error, operation = 'Operation') => {
  const details = {
    operation,
    code: error.code,
    message: error.message,
    status: error.response?.status,
    errno: error.errno,
    syscall: error.syscall
  };
  
  console.error(`[${operation.toUpperCase()}] Error Details:`, details);
  
  // Check response data first (has most specific message)
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  // HTTP status-specific messages
  if (error.response?.status === 400) {
    return 'Invalid request - please check your input and try again';
  } else if (error.response?.status === 401) {
    return 'Unauthorized - please log in again';
  } else if (error.response?.status === 409) {
    return 'Email already registered - try logging in instead';
  } else if (error.response?.status === 500) {
    return 'Server error - please try again later';
  }
  
  // Network/timeout errors
  if (error.code === 'ECONNABORTED') {
    return `Request timeout (${error.config?.timeout}ms) - server may be slow or offline`;
  }
  
  if (error.code === 'ECONNREFUSED') {
    return `Cannot connect to server at ${API_BASE_URL} - backend not running or wrong host/port`;
  }
  
  if (error.code === 'ENOTFOUND' || error.code === 'ERR_SOCKET_CONNECTION_TIMEOUT') {
    return `Network unreachable - check your internet connection and backend server`;
  }
  
  if (error.message?.includes('Network') || error.message?.includes('CORS')) {
    return `Network error - ${error.message}`;
  }
  
  // Fallback
  return error.message || `${operation} failed - please try again`;
};

// ============ AUTHENTICATION APIs ============

const authApi = {
  /**
   * Register new user
   */
  register: async (userData) => {
    try {
      console.log('[AUTH] Register attempt with data:', userData);
      console.log('[AUTH] Sending to:', API_BASE_URL + '/auth/register');
      
      const response = await api.post('/auth/register', userData);
      console.log('[AUTH] Register response received:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      // Check if response has success flag, or if status is 2xx
      const isSuccess = response.data.success || response.status === 201 || response.status === 200;
      
      if (!isSuccess) {
        throw new Error(response.data.message || 'Registration failed');
      }
      
      console.log('[AUTH] Register success:', response.data);
      return response.data;
    } catch (error) {
      const errorMessage = formatErrorMessage(error, 'register');
      console.error('[AUTH] Register final error:', errorMessage);
      throw new Error(errorMessage);
    }
  },

  /**
   * Login user
   */
  login: async (email, password) => {
    try {
      console.log('[AUTH] Login attempt for:', email);
      console.log('[AUTH] Sending to:', API_BASE_URL + '/auth/login');
      
      const response = await api.post('/auth/login', { email, password });
      console.log('[AUTH] Login response received:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      // Check if response has success flag, or if status is 2xx
      const isSuccess = response.data.success || response.status === 200;
      
      if (!isSuccess) {
        throw new Error(response.data.message || 'Login failed');
      }
      
      // Store user data
      if (response.data.user) {
        sessionStorage.setItem('userData', JSON.stringify(response.data.user));
        sessionStorage.setItem('userToken', response.data.user.id);
      }
      
      console.log('[AUTH] Login success:', response.data.message);
      return response.data;
    } catch (error) {
      const errorMessage = formatErrorMessage(error, 'login');
      console.error('[AUTH] Login final error:', errorMessage);
      throw new Error(errorMessage);
    }
  },

  /**
   * Get user profile
   */
  getProfile: async (userId) => {
    try {
      const response = await api.get(`/auth/profile/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch profile' };
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (userId, profileData) => {
    try {
      const response = await api.put(`/auth/profile/${userId}`, profileData);
      if (response.data.success && response.data.user) {
        sessionStorage.setItem('userData', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to update profile' };
    }
  },

  /**
   * Change password
   */
  changePassword: async (userId, currentPassword, newPassword) => {
    try {
      const response = await api.post(`/auth/change-password/${userId}`, {
        current_password: currentPassword,
        new_password: newPassword
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to change password' };
    }
  }
};

// ============ Scholarship & Recommendation APIs ============

const recommendationApi = {
  /**
   * Predict scholarship eligibility
   */
  predictEligibility: async (userData) => {
    try {
      console.log('[API] predictEligibility payload:', userData);
      const response = await api.post('/recommend/predict', userData);
      return response.data;
    } catch (error) {
      console.error('[API] predictEligibility error:', error.response?.data);
      const errData = error.response?.data;
      throw {
        error: errData?.error || errData?.message || 'Prediction failed',
        success: false
      };
    }
  },

  /**
   * Get all scholarships
   */
  getScholarships: async (page = 1, perPage = 10) => {
    try {
      const response = await api.get('/recommend/scholarships', {
        params: { page, per_page: perPage }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch scholarships' };
    }
  },

  /**
   * Get scholarship details
   */
  getScholarship: async (scholarshipId) => {
    try {
      const response = await api.get(`/recommend/scholarship/${scholarshipId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch scholarship' };
    }
  },

  /**
   * Apply for scholarship
   */
  applyScholarship: async (userId, scholarshipId) => {
    try {
      const response = await api.post('/recommend/apply', {
        user_id: userId,
        scholarship_id: scholarshipId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to apply for scholarship' };
    }
  },

  /**
   * Get user applications
   */
  getUserApplications: async (userId, page = 1, perPage = 10) => {
    try {
      const response = await api.get(`/recommend/applications/${userId}`, {
        params: { page, per_page: perPage }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch applications' };
    }
  },

  /**
   * Get dashboard statistics
   */
  getDashboardStats: async (userId) => {
    try {
      const response = await api.get(`/recommend/dashboard/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch dashboard stats' };
    }
  }
};

// ============ Chatbot APIs ============

const chatbotApi = {
  /**
   * Send message to chatbot
   */
  sendMessage: async (messageData) => {
    try {
      const response = await api.post('/chat/message', messageData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to send message' };
    }
  },

  /**
   * Get chatbot suggestions
   */
  getSuggestions: async () => {
    try {
      const response = await api.get('/chat/suggestions');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch suggestions' };
    }
  },

  /**
   * Check chatbot health
   */
  checkHealth: async () => {
    try {
      const response = await api.get('/chat/health');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Chatbot service unavailable' };
    }
  },

  /**
   * Set conversation context
   */
  setContext: async (contextData) => {
    try {
      const response = await api.post('/chat/context', contextData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to set context' };
    }
  }
};

// ============ Stats API ============

const statsApi = {
  /**
   * Get platform-wide stats (total users, active scholarships)
   */
  getStats: async () => {
    try {
      const response = await api.get('/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch stats' };
    }
  }
};

// ============ Health Check API ============

const utilApi = {
  /**
   * Check API health
   */
  checkHealth: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'API health check failed' };
    }
  }
};

// ============ Export Service Object ============

export const apiService = {
  // Auth methods
  registerUser: authApi.register,
  loginUser: authApi.login,
  getProfile: authApi.getProfile,
  updateProfile: authApi.updateProfile,
  changePassword: authApi.changePassword,

  // Scholarship methods
  predictEligibility: recommendationApi.predictEligibility,
  getScholarships: recommendationApi.getScholarships,
  getScholarship: recommendationApi.getScholarship,
  applyScholarship: recommendationApi.applyScholarship,
  getUserApplications: recommendationApi.getUserApplications,
  getDashboardStats: recommendationApi.getDashboardStats,

  // Chatbot methods
  sendChatMessage: chatbotApi.sendMessage,
  getChatbotSuggestions: chatbotApi.getSuggestions,
  checkChatbotHealth: chatbotApi.checkHealth,
  setChatContext: chatbotApi.setContext,

  // Stats methods
  getStats: statsApi.getStats,

  // Utility methods
  checkApiHealth: utilApi.checkHealth
};

export default apiService;
