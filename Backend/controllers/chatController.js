import Conversation from '../models/Conversation.js';
import ChatMessage from '../models/ChatMessage.js';
import User from '../models/User.js';

export const getAvailableContacts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const currentUser = await User.findById(userId);
    
    let query = {};
    if (currentUser.role === 'student') {
      // Students can chat with doctors and shop owners
      query.role = { $in: ['doctor', 'shop_owner'] };
    } else if (['doctor', 'shop_owner'].includes(currentUser.role)) {
      // Doctors/Vendors can chat with all students
      query.role = 'student';
    } else {
      query.role = 'student';
    }
    
    const contacts = await User.find(query).select('name role avatar email shopName specialization');
    res.json({ success: true, data: contacts });
  } catch (error) {
    next(error);
  }
};

export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const conversations = await Conversation.find({ participants: userId })
      .populate('participants', 'name role avatar shopName specialization email')
      .sort({ updatedAt: -1 });
      
    res.json({ success: true, data: conversations });
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { userId: otherUserId } = req.params;
    const myId = req.user.id;

    let conversation = await Conversation.findOne({
      participants: { $all: [myId, otherUserId] }
    });

    if (!conversation) {
      return res.json({ success: true, data: [] });
    }

    const messages = await ChatMessage.find({ conversationId: conversation._id }).sort({ createdAt: 1 });
    
    // Mark messages as read
    await ChatMessage.updateMany(
      { conversationId: conversation._id, receiverId: myId, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, text } = req.body;
    const senderId = req.user.id;

    if (!receiverId || !text) {
      return res.status(400).json({ success: false, message: 'Receiver and text are required' });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] }
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [senderId, receiverId],
      });
    }
    
    conversation.lastMessage = text;
    await conversation.save();

    const newMessage = new ChatMessage({
      conversationId: conversation._id,
      senderId,
      receiverId,
      text
    });

    await newMessage.save();

    res.json({ success: true, data: newMessage });
  } catch (error) {
    next(error);
  }
};
