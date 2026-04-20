import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetType: {
      type: String,
      enum: ['shop', 'driver', 'doctor'],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique constraints
feedbackSchema.index(
  { userId: 1, orderId: 1, targetType: 1 },
  { unique: true, partialFilterExpression: { orderId: { $exists: true } } }
);
feedbackSchema.index(
  { userId: 1, appointmentId: 1, targetType: 1 },
  { unique: true, partialFilterExpression: { appointmentId: { $exists: true } } }
);

export default mongoose.model('Feedback', feedbackSchema);
