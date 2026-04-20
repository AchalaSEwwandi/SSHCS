import express from 'express';
import {
  createMessage,
  getMyMessages,
  getReceivedMessages,
  replyToMessage,
} from '../controllers/messageController.js';

const router = express.Router();

// Student can send and view their own messages
router.post('/', createMessage);
router.get('/my', getMyMessages);

// Doctor/Shop Owner can view received and reply
router.get('/received', getReceivedMessages);
router.put('/:id/reply', replyToMessage);

export default router;
