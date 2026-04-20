import express from 'express';
import {
  getUsers,
  deleteUser,
  approveUser,
  rejectUser,
  getContacts,
  replyContact,
} from '../controllers/adminController.js';
import verifyToken from '../middleware/auth.js';
import allowRoles from '../middleware/roleCheck.js';

const router = express.Router();

// Protect all admin routes - require admin role
router.use(verifyToken, allowRoles('admin'));

router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/approve', approveUser);
router.patch('/users/:id/reject', rejectUser);
router.get('/contacts', getContacts);
router.patch('/contacts/:id/reply', replyContact);

export default router;
