import api from './api';

export const messageService = {
  createMessage: async (messageData) => {
    const response = await api.post('/messages', messageData);
    return response.data;
  },

  getMyMessages: async () => {
    const response = await api.get('/messages/my');
    return response.data;
  },

  getReceivedMessages: async () => {
    const response = await api.get('/messages/received');
    return response.data;
  },

  replyToMessage: async (messageId, reply) => {
    const response = await api.put(`/messages/${messageId}/reply`, { reply });
    return response.data;
  },
};
