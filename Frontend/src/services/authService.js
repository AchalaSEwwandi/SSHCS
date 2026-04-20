import api from './api';

export const authService = {
  // Register a new user
  register: async (userData) => {
    const config = userData instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : {};
    const response = await api.post('/auth/register', userData, config);
    return response.data;
  },

  // Login
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    const { accessToken, user } = response.data.data;
    localStorage.setItem('accessToken', accessToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    return response.data;
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Backend logout failed, proceeding with local logout', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userName');
      delete api.defaults.headers.common['Authorization'];
    }
  },

  // Forgot password
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Verify OTP
  verifyOTP: async (email, otp) => {
    const response = await api.post('/auth/verify-otp', { email, otp });
    return response.data;
  },

  // Reset password
  resetPassword: async (resetToken, newPassword) => {
    const response = await api.post('/auth/reset-password', { resetToken, newPassword });
    return response.data;
  },

  // Profile Methods
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
  
  updateProfile: async (userData) => {
    const response = await api.put('/auth/profile', userData);
    return response.data;
  },
  
  deleteProfile: async () => {
    const response = await api.delete('/auth/profile');
    return response.data;
  }
};
