import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';
import Feedback from '../models/Feedback.js';
import User from '../models/User.js';

/**
 * GET /api/hospital/doctors
 */
export const getDoctors = async (req, res, next) => {
  try {
    // Self-healing: Find all approved doctors in User collection and auto-create Doctor documents if missing
    const approvedDoctorUsers = await User.find({ role: 'doctor', status: 'approved', isActive: true });
    for (const dUser of approvedDoctorUsers) {
      const exists = await Doctor.findOne({ userId: dUser._id });
      if (!exists) {
        await Doctor.create({
          userId: dUser._id,
          specialization: dUser.specialization || 'General Practitioner',
          consultationFee: 1000,
        });
      }
    }

    const doctors = await Doctor.find()
      .populate('userId', 'name email phone avatar hospitalName specialization')
      .sort({ rating: -1, reviewCount: -1, createdAt: -1 });

    // Filter out disabled users or unpopulated ones
    const activeDoctors = doctors.filter(doc => doc.userId);

    const enriched = activeDoctors.map((doc) => ({
      ...doc.toObject(),
      userId: doc.userId,
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/hospital/appointments
 */
export const createAppointment = async (req, res, next) => {
  try {
    const { studentId, doctorId, patientName, symptoms, date, timeSlot, additionalNotes } = req.body;

    if (!patientName || !symptoms || !date || !timeSlot) {
      return res.status(400).json({ success: false, message: 'Patient name, symptoms, date, and time slot are required.' });
    }

    const lettersOnly = /^[A-Za-z\s]+$/;
    if (!lettersOnly.test(patientName)) {
      return res.status(400).json({ success: false, message: 'Patient name must contain letters only.' });
    }

    const appointment = new Appointment({
      studentId,
      doctorId,
      patientName: patientName.trim(),
      symptoms: symptoms.trim(),
      date,
      timeSlot,
      additionalNotes: additionalNotes?.trim() || '',
    });

    await appointment.save();
    res.status(201).json({ success: true, message: 'Appointment booked successfully', data: appointment });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/hospital/appointments/student/:studentId
 */
export const getStudentAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ studentId: req.params.studentId })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name email phone' },
      })
      .sort({ createdAt: -1 });

    // Attach feedback to each appointment
    const withFeedback = await Promise.all(
      appointments.map(async (app) => {
        const fb = await Feedback.findOne({ appointmentId: app._id });
        return { ...app.toObject(), feedback: fb || null };
      })
    );

    res.json({ success: true, data: withFeedback });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/hospital/appointments/doctor/:doctorId
 */
export const getDoctorAppointments = async (req, res, next) => {
  try {
    let docId = req.params.doctorId;
    // Check if the param is the User ID, grab the actual Doctor ID
    const docLookup = await Doctor.findOne({ userId: docId });
    if (docLookup) {
      docId = docLookup._id;
    }

    const appointments = await Appointment.find({ doctorId: docId })
      .populate('studentId', 'name email studentId')
      .sort({ createdAt: -1 });

    // Attach feedback to each appointment
    const withFeedback = await Promise.all(
      appointments.map(async (app) => {
        const fb = await Feedback.findOne({ appointmentId: app._id });
        return { ...app.toObject(), feedback: fb || null };
      })
    );

    res.json({ success: true, data: withFeedback });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/hospital/appointments/:id/approve
 */
export const approveAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    );
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }
    res.json({ success: true, message: 'Appointment approved', data: appointment });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/hospital/appointments/:id/reject
 */
export const rejectAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }
    res.json({ success: true, message: 'Appointment rejected', data: appointment });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/hospital/prescriptions
 * Upload prescription file
 */
export const uploadPrescription = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded. Please provide a PDF or image file.' });
    }

    const { appointmentId, studentId, pharmacyId } = req.body;
    if (!appointmentId || !studentId || !pharmacyId) {
      return res.status(400).json({ success: false, message: 'Appointment, student, and pharmacy are required.' });
    }

    // Check if prescription already exists for this appointment
    const existing = await Prescription.findOne({ appointmentId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Prescription already uploaded for this appointment.' });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    const fileType = req.file.mimetype === 'application/pdf' ? 'pdf' : 'image';

    const prescription = new Prescription({
      appointmentId,
      studentId,
      pharmacyId,
      fileUrl,
      fileType,
    });

    await prescription.save();
    res.status(201).json({ success: true, message: 'Prescription uploaded successfully', data: prescription });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/hospital/prescriptions/student/:studentId
 */
export const getStudentPrescriptions = async (req, res, next) => {
  try {
    const prescriptions = await Prescription.find({ studentId: req.params.studentId })
      .populate('pharmacyId', 'name email shopName')
      .populate({
        path: 'appointmentId',
        populate: { path: 'doctorId', populate: { path: 'userId', select: 'name' } },
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: prescriptions });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/hospital/prescriptions/pharmacy/:pharmacyId
 */
export const getPharmacyPrescriptions = async (req, res, next) => {
  try {
    const prescriptions = await Prescription.find({ pharmacyId: req.params.pharmacyId })
      .populate('studentId', 'name email studentId')
      .populate({
        path: 'appointmentId',
        populate: { path: 'doctorId', populate: { path: 'userId', select: 'name' } },
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: prescriptions });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/hospital/prescriptions/doctor/:doctorId
 */
export const getDoctorPrescriptions = async (req, res, next) => {
  try {
    let docId = req.params.doctorId;
    const docLookup = await Doctor.findOne({ userId: docId });
    if (docLookup) {
      docId = docLookup._id;
    }

    // Find all appointments for this doctor
    const appointments = await Appointment.find({ doctorId: docId }).select('_id');
    const appointmentIds = appointments.map(a => a._id);

    // Find prescriptions linked to those appointments
    const prescriptions = await Prescription.find({ appointmentId: { $in: appointmentIds } })
      .populate('studentId', 'name email studentId')
      .populate('pharmacyId', 'name shopName')
      .populate({
        path: 'appointmentId',
        populate: { path: 'doctorId', populate: { path: 'userId', select: 'name' } },
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: prescriptions });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/hospital/prescriptions/:id/approve
 */
export const approvePrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      { status: 'accepted' },
      { new: true }
    );
    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found.' });
    }
    res.json({ success: true, message: 'Prescription accepted', data: prescription });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/hospital/prescriptions/:id/reject
 */
export const rejectPrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );
    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found.' });
    }
    res.json({ success: true, message: 'Prescription rejected', data: prescription });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/hospital/feedback
 */
export const submitFeedback = async (req, res, next) => {
  try {
    const { appointmentId, studentId, doctorId, rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }

    // Prevent duplicate feedback for same appointment
    const existing = await Feedback.findOne({ appointmentId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Feedback already submitted for this appointment.' });
    }

    // Simple sentiment analysis
    const { analyzeSentiment } = await import('../utils/analyzeSentiment.js');
    const sentiment = analyzeSentiment(comment);

    const feedback = new Feedback({
      userId: studentId,
      targetType: 'doctor',
      targetId: doctorId,
      appointmentId,
      rating,
      comment,
      sentiment,
    });

    await feedback.save();

    // Recalculate doctor average rating
    const allFeedback = await Feedback.find({ doctorId, targetType: 'doctor' });
    const avgRating = allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length;
    await Doctor.findByIdAndUpdate(doctorId, {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: allFeedback.length,
    });

    res.status(201).json({ success: true, message: 'Feedback submitted successfully', data: feedback });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/hospital/feedback/doctor/:doctorId
 */
export const getDoctorFeedback = async (req, res, next) => {
  try {
    const feedbacks = await Feedback.find({ targetId: req.params.doctorId, targetType: 'doctor' })
      .populate('userId', 'name studentId')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: feedbacks });
  } catch (error) {
    next(error);
  }
};
