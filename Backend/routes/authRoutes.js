import express from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  verifyOTP,
  resetPassword,
  getProfile,
  updateProfile,
  deleteProfile,
} from '../controllers/authController.js';
import verifyToken from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.post(
  '/register',
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'medicalLicenseFile', maxCount: 1 },
    { name: 'businessLicenseFile', maxCount: 1 },
  ]),
  register
);
router.post('/login', login);
router.post('/logout', verifyToken, logout);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

// Profile routes
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.delete('/profile', verifyToken, deleteProfile);

export default router;
