import api from './api';

export const chatbotService = {
  getCourses: async () => {
    const response = await api.get('/chatbot/courses');
    return response.data;
  },

  getYearsAndSemesters: async (course) => {
    const response = await api.get('/chatbot/years-semesters', { params: { course } });
    return response.data;
  },

  getModulesList: async (course, year, semester) => {
    const response = await api.get('/chatbot/modules', { params: { course, year, semester } });
    return response.data;
  },

  generateQuiz: async (moduleName) => {
    const response = await api.post('/chatbot/generate-quiz', { moduleName });
    return response.data;
  },

  generateIdeas: async (data) => {
    const response = await api.post('/chatbot/generate-ideas', data);
    return response.data;
  },

  generateRoadmap: async (ideaTitle) => {
    const response = await api.post('/chatbot/generate-roadmap', { idea: ideaTitle });
    return response.data;
  },

  getRoadmaps: async () => {
    const response = await api.get('/chatbot/roadmaps');
    return response.data;
  },

  updateTaskDone: async (roadmapId, taskId, isDone) => {
    const response = await api.patch(`/chatbot/roadmap/${roadmapId}/task/${taskId}`, { isDone });
    return response.data;
  },

  chat: async (message, sessionId = null) => {
    const payload = { message };
    if (sessionId) payload.sessionId = sessionId;
    const response = await api.post('/chatbot/chat', payload);
    return response.data;
  },

  getChatSessions: async () => {
    const response = await api.get('/chatbot/chat/sessions');
    return response.data;
  },

  getChatSessionById: async (sessionId) => {
    const response = await api.get(`/chatbot/chat/sessions/${sessionId}`);      
    return response.data;
  }
};
