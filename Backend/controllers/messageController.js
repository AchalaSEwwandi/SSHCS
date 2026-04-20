import Message from '../models/Message.js';
import User from '../models/User.js';
import { sendMessageReplyEmail } from '../utils/index.js';

/**
 * POST /api/messages
 * Create a new message (student to doctor/shop_owner)
 */
export const createMessage = async (req, res, next) => {
  try {
    const { receiverId, receiverType, subject, message } = req.body;

    if (!receiverId || !receiverType || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (!['doctor', 'shop_owner'].includes(receiverType)) {
      return res.status(400).json({ success: false, message: 'Invalid receiverType. Must be doctor or shop_owner' });
    }

    if (subject.length < 5) {
      return res.status(400).json({ success: false, message: 'Subject must be at least 5 characters' });
    }

    if (message.length < 10) {
      return res.status(400).json({ message: 'Message must be at least 10 characters' });
    }

    const senderId = req.user ? req.user.id : 'demo';

    const newMessage = new Message({
      senderId,
      receiverId,
      receiverType,
      subject: subject.trim(),
      message: message.trim(),
    });

    await newMessage.save();
    res.status(201).json({ success: true, message: 'Message sent successfully', data: newMessage });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/messages/my
 * Get messages sent by the logged-in student
 */
export const getMyMessages = async (req, res, next) => {
  try {
    const senderId = req.user ? req.user.id : 'demo';

    const messages = await Message.find({ senderId })
      .populate('receiverId', 'name email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/messages/received
 * Get messages received by the logged-in vendor (doctor/shop_owner)
 */
export const getReceivedMessages = async (req, res, next) => {
  try {
    const receiverId = req.user ? req.user.id : 'demo';

    const messages = await Message.find({ receiverId })
      .populate('senderId', 'name email studentId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/messages/:id/reply
 * Reply to a message
 */
export const replyToMessage = async (req, res, next) => {
  try {
    const { reply } = req.body;

    if (!reply || reply.trim() === '') {
      return res.status(400).json({ success: false, message: 'Reply content is required' });
    }

    const receiverId = req.user ? req.user.id : 'demo';
    const message = await Message.findById(req.params.id)
      .populate('senderId', 'name email');

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Ensure the user replying is the receiver
    if (message.receiverId.toString() !== receiverId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to reply to this message' });
    }

    message.reply = reply.trim();
    message.status = 'replied';
    await message.save();

    // Send email notification to student
    if (message.senderId && message.senderId.email) {
      try {
        await sendMessageReplyEmail({
          to: message.senderId.email,
          studentName: message.senderId.name,
          vendorName: req.user?.name || 'Vendor',
          subject: message.subject,
          originalMessage: message.message,
          reply: message.reply,
        });
      } catch (emailError) {
        console.error('Error sending reply email:', emailError);
      }
    }

    res.json({ success: true, message: 'Reply sent successfully', data: message });
  } catch (error) {
    next(error);
  }
};
