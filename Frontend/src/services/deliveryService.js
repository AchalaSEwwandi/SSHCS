import api from './api';

export const deliveryService = {
  // Delivery Persons
  createDeliveryPerson: async (personData) => {
    const response = await api.post('/delivery/persons', personData);
    return response.data;
  },

  getDeliveryPersons: async (storeName) => {
    const params = storeName ? { storeName } : {};
    const response = await api.get('/delivery/persons', { params });
    return response.data;
  },

  updateDeliveryPerson: async (id, personData) => {
    const response = await api.put(`/delivery/persons/${id}`, personData);
    return response.data;
  },

  deleteDeliveryPerson: async (id) => {
    const response = await api.delete(`/delivery/persons/${id}`);
    return response.data;
  },

  assignDeliveryPerson: async (orderId, deliveryPersonId) => {
    const response = await api.post(`/delivery/assign/${orderId}`, { deliveryPersonId });
    return response.data;
  },

  respondToAssignment: async (id, responseText) => {
    const response = await api.patch(`/delivery/assignments/${id}/respond`, { response: responseText });
    return response.data;
  },

  // Tracking
  getDeliveryTracking: async (orderId) => {
    const response = await api.get(`/delivery/tracking/${orderId}`);
    return response.data;
  },

  markDelivered: async (orderId) => {
    const response = await api.put(`/delivery/${orderId}/mark-delivered`);
    return response.data;
  },

  // Dashboards
  getMyAssignments: async () => {
    const response = await api.get('/delivery/my-assignments');
    return response.data;
  },

  getMyDashboard: async () => {
    const response = await api.get('/delivery/my-dashboard');
    return response.data;
  },

  // Stats
  getDeliveryStats: async () => {
    const response = await api.get('/delivery/stats');
    return response.data;
  },
};
