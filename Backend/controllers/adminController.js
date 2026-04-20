import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Contact from '../models/Contact.js';
import { sendApprovalEmail, sendContactReplyEmail } from '../utils/index.js';

/**
 * GET /api/admin/users
 * List users - optionally filter by role and/or status
 */
export const getUsers = async (req, res, next) => {
  try {
    const { role, status } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;

    const users = await User.find(filter).select('-password -refreshToken').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/users/:id
 * Delete a user by ID
 */
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/users/:id/approve
 * Approve a pending doctor or vendor account
 */
export const approveUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.status === 'approved') {
      return res.status(400).json({ success: false, message: 'User is already approved.' });
    }

    user.status = 'approved';
    await user.save({ validateBeforeSave: false });

    // If the approved user is a doctor, automatically create the Doctor profile
    if (user.role === 'doctor') {
      const existingDoctor = await Doctor.findOne({ userId: user._id });
      if (!existingDoctor) {
        await Doctor.create({
          userId: user._id,
          specialization: user.specialization || 'General',
          consultationFee: 1000, // Default fee
        });
      }
    }

    // Send approval email
    await sendApprovalEmail({ to: user.email, name: user.name }).catch((err) =>
      console.error('Approval email failed:', err.message)
    );

    res.json({
      success: true,
      message: `${user.name}'s account has been approved. Notification email sent.`,
      data: { id: user._id, status: user.status },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/users/:id/reject
 * Reject (deactivate) a pending account
 */
export const rejectUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    res.json({ success: true, message: `${user.name}'s account has been rejected.` });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/contacts
 * Get all contact form submissions
 */
export const getContacts = async (req, res, next) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({ success: true, data: contacts });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/contacts/:id/reply
 * Reply to a contact submission
 */
export const replyContact = async (req, res, next) => {
  try {
    const { replyText } = req.body;
    if (!replyText) return res.status(400).json({ success: false, message: 'Reply text is required.' });

    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ success: false, message: 'Message not found.' });

    if (contact.status === 'replied') {
      return res.status(400).json({ success: false, message: 'Already replied.' });
    }

    contact.status = 'replied';
    contact.replyMessage = replyText;
    contact.repliedAt = new Date();
    await contact.save();

    // Send reply email
    await sendContactReplyEmail({
      to: contact.email,
      name: contact.name,
      messageSubject: contact.subject,
      replyText: contact.replyMessage,
    }).catch((err) => console.error('Contact reply email failed:', err.message));

    res.json({ success: true, message: 'Reply sent successfully.', data: contact });
  } catch (err) {
    next(err);
  }
};
