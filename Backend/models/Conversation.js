import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastMessage: { type: String, default: '' },
    unreadCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Conversation', conversationSchema);
