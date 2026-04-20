import Contact from '../models/Contact.js';
import { sendEmail } from '../utils/index.js';

/**
 * POST /api/contact
 * Submit a contact form inquiry
 */
export const submitContact = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const contact = new Contact({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
    });

    await contact.save();

    // Send confirmation email to user
    try {
      await sendEmail({
        to: email,
        subject: `SSHCS - We received your message: ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0ea5e9;">Message Received</h2>
            <p>Dear ${name},</p>
            <p>We have received your message. Our team will get back to you shortly.</p>
            <div style="background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px;">
              <strong>Subject:</strong> ${subject}<br>
              <strong>Message:</strong><br>${message}
            </div>
            <p>If you need immediate assistance, please contact our support team.</p>
            <p>Best regards,<br>SSHCS Team</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
    }

    res.status(201).json({ success: true, message: 'Your message has been sent successfully!' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/contact/admin
 * Get all contact submissions (admin only)
 */
export const getContacts = async (req, res, next) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({ success: true, count: contacts.length, data: contacts });
  } catch (error) {
    next(error);
  }
};
