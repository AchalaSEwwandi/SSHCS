import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverType: {
      type: String,
      enum: ['doctor', 'shop_owner'],
      required: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      minlength: [5, 'Subject must be at least 5 characters'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message content is required'],
      minlength: [10, 'Message must be at least 10 characters'],
      trim: true,
    },
    reply: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'replied'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Message', messageSchema);
