import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    //Reference to the conversation this message belongs to
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },

    // User who sent the message
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

     // User who receives the message
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Message content/text body
    text: { type: String, required: true },

    // Message read status (false = unread, true = read)
    isRead: { type: Boolean, default: false },
  },
  { 
    // Automatically adds createdAt and updatedAt timestamps
    timestamps: true }
);

export default mongoose.model('ChatMessage', chatMessageSchema);
