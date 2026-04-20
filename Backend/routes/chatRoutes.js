import express from 'express';
import {
  getAvailableContacts,
  getConversations,
  getMessages,
  sendMessage
} from '../controllers/chatController.js';
import verifyToken from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);

router.get('/contacts', getAvailableContacts);
router.get('/conversations', getConversations);
router.get('/:userId', getMessages);
router.post('/', sendMessage);

export default router;
