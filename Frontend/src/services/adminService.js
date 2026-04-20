import api from './api';

export const adminService = {
  // Get all users (can filter by role, status in API using params)
  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  // Approve a pending user
  approveUser: async (id) => {
    const response = await api.patch(`/admin/users/${id}/approve`);
    return response.data;
  },

  // Delete a user
  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  // Reject a pending user
  rejectUser: async (id) => {
    const response = await api.patch(`/admin/users/${id}/reject`);
    return response.data;
  },

  // Get all contact submissions
  getContacts: async () => {
    const response = await api.get('/admin/contacts');
    return response.data;
  },

  // Reply to a contact submission
  replyContact: async (id, replyText) => {
    const response = await api.patch(`/admin/contacts/${id}/reply`, { replyText });
    return response.data;
  }
};
