import express from 'express';
import { submitContact, getContacts } from '../controllers/contactController.js';

const router = express.Router();

// Public route - submit contact form
router.post('/', submitContact);

// Admin only - view all contacts
router.get('/',  getContacts);

export default router;
