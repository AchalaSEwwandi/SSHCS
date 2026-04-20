import api from './api';

export const feedbackService = {
  submitFeedback: async (feedbackData) => {
    const response = await api.post('/feedback', feedbackData);
    return response.data;
  },

  getDoctorFeedback: async (doctorId) => {
    const response = await api.get(`/feedback/doctor/${doctorId}`);
    return response.data;
  },

  getShopFeedback: async (shopOwnerId) => {
    const response = await api.get(`/feedback/shop/${shopOwnerId}`);
    return response.data;
  },

  getDriverFeedback: async (deliveryPersonId) => {
    const response = await api.get(`/feedback/driver/${deliveryPersonId}`);
    return response.data;
  },

  getFeedbackSummary: async () => {
    const response = await api.get('/feedback/summary');
    return response.data;
  },
};
