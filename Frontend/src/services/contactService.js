import api from './api';

export const contactService = {
  submitContact: async (contactData) => {
    const response = await api.post('/contact', contactData);
    return response.data;
  },

  getContacts: async () => {
    const response = await api.get('/contact');
    return response.data;
  },
};
