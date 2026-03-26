import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const authService = {
  // Set auth token for all requests
  setAuthToken: (token) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  },

  // Login
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Even if logout fails on server, clear local storage
      console.error('Logout error:', error);
    } finally {
      authService.setAuthToken(null);
    }
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Update user profile
  updateProfile: async (userData) => {
    const response = await api.put('/auth/profile', userData);
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.put('/auth/change-password', passwordData);
    return response.data;
  },

  // Forgot password
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (token, newPassword) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },

  // Refresh token
  refreshToken: async () => {
    const response = await api.post('/auth/refresh-token');
    const { token } = response.data;
    authService.setAuthToken(token);
    return token;
  },

  // Verify email
  verifyEmail: async (token) => {
    const response = await api.post('/auth/verify-email', { token });
    return response.data;
  },

  // Resend verification email
  resendVerification: async (email) => {
    const response = await api.post('/auth/resend-verification', { email });
    return response.data;
  },

  // Check if username is available
  checkUsernameAvailability: async (username) => {
    const response = await api.get(`/auth/check-username/${username}`);
    return response.data;
  },

  // Check if email is available
  checkEmailAvailability: async (email) => {
    const response = await api.get(`/auth/check-email/${email}`);
    return response.data;
  },

  // Get user permissions
  getUserPermissions: async () => {
    const response = await api.get('/auth/permissions');
    return response.data;
  },

  // Update user preferences
  updatePreferences: async (preferences) => {
    const response = await api.put('/auth/preferences', preferences);
    return response.data;
  },

  // Get user activity log
  getActivityLog: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await axios.get(`${API_BASE_URL}/auth/activity?${params}`);
    return response.data;
  },

  // Enable/disable 2FA
  toggle2FA: async (enable) => {
    const response = await axios.post(`${API_BASE_URL}/auth/2fa/toggle`, { enable });
    return response.data;
  },

  // Generate 2FA backup codes
  generateBackupCodes: async () => {
    const response = await axios.post(`${API_BASE_URL}/auth/2fa/backup-codes`);
    return response.data;
  },

  // Verify 2FA code
  verify2FACode: async (code) => {
    const response = await axios.post(`${API_BASE_URL}/auth/2fa/verify`, { code });
    return response.data;
  },

  // Get current user (demo implementation)
  getCurrentUser: async () => {
    // Simulación para demo - en producción esto haría una llamada real a la API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: 1,
          username: 'admin',
          email: 'admin@chempro.com',
          name: 'Administrador',
          role: 'admin',
          permissions: ['admin', 'quality', 'production', 'inventory', 'customers', 'reports', 'laboratory'],
          isActive: true,
          createdAt: new Date(),
          lastLogin: new Date()
        });
      }, 100);
    });
  }
};

export default authService;
