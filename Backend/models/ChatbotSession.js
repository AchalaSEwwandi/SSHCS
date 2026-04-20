import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  text: { type: String, required: true },
  isBot: { type: Boolean, required: true },
  createdAt: { type: Date, default: Date.now }
});

const chatbotSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'New Chat' },
  messages: [messageSchema]
}, { timestamps: true });

export default mongoose.model('ChatbotSession', chatbotSessionSchema);
