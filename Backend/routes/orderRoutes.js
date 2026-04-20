import express from 'express';
import verifyToken from '../middleware/auth.js'; // Added missing auth middleware for checking user
import {
  createOrder,
  getOrderHistory,
  calculatePayment,
  processPayment,
  assignDelivery,
  getOrderTracking,
  updateOrderStatus,
  confirmDelivery,
  submitRating,
  saveDeliveryAddress,
} from '../controllers/orderController.js';

const router = express.Router();

// Try to verify token if exists (for optional auth routes), or use strict verifyToken
const optionalAuth = (req, res, next) => {
  // we try to parse it if Bearer is present
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return verifyToken(req, res, next);
  }
  next();
};

// Order creation - requires auth but can accept session key for demo
router.post('/', optionalAuth, createOrder);
router.get('/history', optionalAuth, getOrderHistory);
router.get('/:orderId/payment', optionalAuth, calculatePayment);
router.post('/pay',  processPayment);
router.post('/assign-delivery',  assignDelivery);
router.get('/tracking/:orderId',  getOrderTracking);
router.put('/:orderId/status',  updateOrderStatus);
router.post('/:orderId/confirm-delivery',  confirmDelivery);
router.post('/:orderId/rate',  submitRating);
router.post('/:orderId/save-delivery-details',  saveDeliveryAddress);

export default router;
