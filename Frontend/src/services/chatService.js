import api from './api';

export const chatService = {
  getContacts: async () => {
    const response = await api.get('/chats/contacts');
    return response.data;
  },

  getConversations: async () => {
    const response = await api.get('/chats/conversations');
    return response.data;
  },

  getMessages: async (userId) => {
    const response = await api.get(`/chats/${userId}`);
    return response.data;
  },

  sendMessage: async (receiverId, text) => {
    const response = await api.post('/chats', { receiverId, text });
    return response.data;
  }
};
