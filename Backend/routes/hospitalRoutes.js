import express from 'express';
import {
  getDoctors,
  createAppointment,
  getStudentAppointments,
  getDoctorAppointments,
  approveAppointment,
  rejectAppointment,
  uploadPrescription,
  getStudentPrescriptions,
  getPharmacyPrescriptions,
  getDoctorPrescriptions,
  approvePrescription,
  rejectPrescription,
  submitFeedback,
  getDoctorFeedback,
} from '../controllers/hospitalController.js';

import upload from '../middleware/upload.js';

const router = express.Router();

// Doctors - public read
router.get('/doctors', getDoctors);

// Appointments - require auth
router.post('/appointments',  createAppointment);
router.get('/appointments/student/:studentId',  getStudentAppointments);
router.get('/appointments/doctor/:doctorId',  getDoctorAppointments);
router.put('/appointments/:id/approve',  approveAppointment);
router.put('/appointments/:id/reject',  rejectAppointment);

// Prescriptions - require auth and file upload
router.post('/prescriptions',  upload.single('file'), uploadPrescription);
router.get('/prescriptions/student/:studentId',  getStudentPrescriptions);
router.get('/prescriptions/pharmacy/:pharmacyId',   getPharmacyPrescriptions);router.get('/prescriptions/doctor/:doctorId',  getDoctorPrescriptions);router.put('/prescriptions/:id/approve',   approvePrescription);
router.put('/prescriptions/:id/reject',   rejectPrescription);

// Feedback - require auth
router.post('/feedback',  submitFeedback);
router.get('/feedback/doctor/:doctorId',  getDoctorFeedback);

export default router;
