import express from 'express';
import {
  submitFeedback,
  getDoctorFeedback,
  getShopFeedback,
  getDriverFeedback,
  getFeedbackSummary,
} from '../controllers/feedbackController.js';

const router = express.Router();

// Submit feedback - require auth
router.post('/', submitFeedback);

// Get feedback by target - require auth
router.get('/doctor/:doctorId', getDoctorFeedback);
router.get('/shop/:shopOwnerId', getShopFeedback);
router.get('/driver/:deliveryPersonId', getDriverFeedback);

// Summary - admin only
router.get('/summary', getFeedbackSummary);

export default router;
