import express from 'express';
import verifyToken from '../middleware/auth.js';
import {
  getCourses,
  getYearsAndSemesters,
  getModulesList,
  generateQuiz,
  generateIdeas,
  generateRoadmap,
  chat,
  getRoadmaps,
  updateTaskDone,
  getChatSessions,
  getChatSessionById
} from '../controllers/chatbotController.js';

const router = express.Router();

// Public endpoints
router.get('/courses', getCourses);
router.get('/years-semesters', getYearsAndSemesters);
router.get('/modules', getModulesList);
router.post('/generate-quiz', generateQuiz);
router.post('/generate-ideas', generateIdeas);

// Protected endpoints
router.use('/generate-roadmap', verifyToken);
router.post('/generate-roadmap', generateRoadmap);

router.use('/roadmaps', verifyToken);
router.get('/roadmaps', getRoadmaps);

router.use('/roadmap/:roadmapId/task/:taskId', verifyToken);
router.patch('/roadmap/:roadmapId/task/:taskId', updateTaskDone);

router.use('/chat', verifyToken);
router.post('/chat', chat);
router.get('/chat/sessions', getChatSessions);
router.get('/chat/sessions/:sessionId', getChatSessionById);

export default router;