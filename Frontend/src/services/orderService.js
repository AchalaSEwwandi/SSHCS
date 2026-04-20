import api from './api';

export const orderService = {
  // Orders
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  getOrderHistory: async () => {
    const response = await api.get('/orders/history');
    return response.data;
  },

  getOrder: async (orderId) => {
    const response = await api.get(`/orders/${orderId}/payment`);
    return response.data;
  },

  processPayment: async (orderId, paymentData) => {
    const response = await api.post('/orders/pay', { orderId, ...paymentData });
    return response.data;
  },

  assignDelivery: async (orderId, storeName) => {
    const response = await api.post('/orders/assign-delivery', { orderId, storeName });
    return response.data;
  },

  getOrderTracking: async (orderId) => {
    const response = await api.get(`/orders/tracking/${orderId}`);
    return response.data;
  },

  updateOrderStatus: async (orderId, status) => {
    const response = await api.put(`/orders/${orderId}/status`, { status });
    return response.data;
  },

  confirmDelivery: async (orderId) => {
    const response = await api.post(`/orders/${orderId}/confirm-delivery`);
    return response.data;
  },

  submitRating: async (orderId, rating, comment) => {
    const response = await api.post(`/orders/${orderId}/rate`, { stars: rating, comment });
    return response.data;
  },

  saveDeliveryAddress: async (orderId, deliveryData) => {
    const response = await api.post(`/orders/${orderId}/save-delivery-details`, deliveryData);
    return response.data;
  },
};
