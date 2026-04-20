import Feedback from '../models/Feedback.js';
import Doctor from '../models/Doctor.js';
import User from '../models/User.js';

/**
 * POST /api/feedback
 * Submit feedback with sentiment analysis
 */
export const submitFeedback = async (req, res, next) => {
  try {
    const { userId, targetType, targetId, orderId, appointmentId, rating, comment } = req.body;

    if (!userId || !targetType || !targetId || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'All required fields must be provided' });
    }

    if (!['shop', 'driver', 'doctor'].includes(targetType)) {
      return res.status(400).json({ success: false, message: 'Invalid targetType' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    // Analyze sentiment
    const { default: analyzeSentiment } = await import('../utils/analyzeSentiment.js');
    const sentiment = analyzeSentiment(comment);

    // Check for existing feedback
    let existing = null;
    let queryOrderId = orderId && orderId.trim() !== '' ? orderId : undefined;
    let queryAppointmentId = appointmentId && appointmentId.trim() !== '' ? appointmentId : undefined;

    if (queryOrderId) {
      existing = await Feedback.findOne({ userId, orderId: queryOrderId, targetType });
    } else if (queryAppointmentId) {
      existing = await Feedback.findOne({ userId, appointmentId: queryAppointmentId, targetType });
    }

    if (existing) {
      return res.status(400).json({ success: false, message: 'Feedback already submitted for this transaction' });
    }

    const feedback = new Feedback({
      userId,
      targetType,
      targetId,
      orderId: queryOrderId,
      appointmentId: queryAppointmentId,
      rating,
      comment,
      sentiment,
    });

    await feedback.save();

    // Update rating aggregates based on targetType
    if (targetType === 'doctor') {
      const allFeedback = await Feedback.find({ targetId, targetType: 'doctor' });
      const avgRating = allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length;
      await Doctor.findByIdAndUpdate(targetId, {
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: allFeedback.length,
      });
    }

    res.status(201).json({ success: true, message: 'Feedback submitted successfully', data: feedback });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/feedback/doctor/:doctorId
 * Get feedback for a specific doctor
 */
export const getDoctorFeedback = async (req, res, next) => {
  try {
    let { doctorId } = req.params;

    const docLookup = await Doctor.findOne({ userId: doctorId });
    if (docLookup) {
      doctorId = docLookup._id.toString();
    }

    const feedbacks = await Feedback.find({ targetId: doctorId, targetType: 'doctor' })
      .populate('userId', 'name studentId')
      .sort({ createdAt: -1 });

    // Calculate sentiment stats
    const stats = {
      total: feedbacks.length,
      positive: feedbacks.filter((f) => f.sentiment === 'positive').length,
      neutral: feedbacks.filter((f) => f.sentiment === 'neutral').length,
      negative: feedbacks.filter((f) => f.sentiment === 'negative').length,
    };

    res.json({ success: true, stats, data: feedbacks });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/feedback/shop/:shopOwnerId
 * Get feedback for a shop owner
 */
export const getShopFeedback = async (req, res, next) => {
  try {
    const { shopOwnerId } = req.params;
    
    if (!shopOwnerId || shopOwnerId === 'undefined') {
      return res.status(400).json({ success: false, message: 'Invalid or missing shop owner ID' });
    }

    const feedbacks = await Feedback.find({ targetId: shopOwnerId, targetType: 'shop' })
      .populate('userId', 'name studentId')
      .sort({ createdAt: -1 });

    const stats = {
      total: feedbacks.length,
      positive: feedbacks.filter((f) => f.sentiment === 'positive').length,
      neutral: feedbacks.filter((f) => f.sentiment === 'neutral').length,
      negative: feedbacks.filter((f) => f.sentiment === 'negative').length,
    };

    res.json({ success: true, stats, data: feedbacks });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/feedback/driver/:deliveryPersonId
 * Get feedback for a delivery person
 */
export const getDriverFeedback = async (req, res, next) => {
  try {
    const { deliveryPersonId } = req.params;
    const feedbacks = await Feedback.find({ targetId: deliveryPersonId, targetType: 'driver' })
      .populate('userId', 'name studentId')
      .sort({ createdAt: -1 });

    const stats = {
      total: feedbacks.length,
      positive: feedbacks.filter((f) => f.sentiment === 'positive').length,
      neutral: feedbacks.filter((f) => f.sentiment === 'neutral').length,
      negative: feedbacks.filter((f) => f.sentiment === 'negative').length,
    };

    res.json({ success: true, stats, data: feedbacks });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/feedback/summary
 * Get overall sentiment analysis summary (admin)
 */
export const getFeedbackSummary = async (req, res, next) => {
  try {
    const allFeedback = await Feedback.find().sort({ createdAt: -1 }).limit(100);

    const sentimentStats = {
      positive: allFeedback.filter((f) => f.sentiment === 'positive').length,
      neutral: allFeedback.filter((f) => f.sentiment === 'neutral').length,
      negative: allFeedback.filter((f) => f.sentiment === 'negative').length,
    };

    const targetTypeStats = {
      doctor: allFeedback.filter((f) => f.targetType === 'doctor').length,
      shop: allFeedback.filter((f) => f.targetType === 'shop').length,
      driver: allFeedback.filter((f) => f.targetType === 'driver').length,
    };

    res.json({
      success: true,
      data: {
        total: allFeedback.length,
        sentiment: sentimentStats,
        byTarget: targetTypeStats,
        recentFeedback: allFeedback.slice(0, 10),
      },
    });
  } catch (error) {
    next(error);
  }
};
