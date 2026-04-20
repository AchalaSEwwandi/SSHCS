import nodemailer from 'nodemailer';

const createTransporter = () => {
  // For development, use ethereal email or configure SMTP
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback: console log in development
  return nodemailer.createTransport({
    streamTransport: true,
    buffer: true,
  });
};

const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const message = {
      from: `${process.env.SMTP_USER || 'SSHCS'} <${process.env.SMTP_USER || 'noreply@sshcs.com'}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    // Send email or log to console in dev mode
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
      console.log('📧 Email would be sent:', message);
      return { success: true, messageId: 'dev-mode-mock' };
    }

    const info = await transporter.sendMail(message);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};

// Specific email templates
const sendApprovalEmail = async ({ to, name }) => {
  const subject = 'SSHCS - Your Account Has Been Approved!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0ea5e9;">Account Approved</h2>
      <p>Dear ${name},</p>
      <p>Great news! Your account has been approved by the administrator.</p>
      <p>You can now log in and access your dashboard.</p>
      <p><a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login"
            style="background: #0ea5e9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Go to Login
        </a>
      </p>
      <p>Best regards,<br>SSHCS Team</p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
  });
};

const sendContactReplyEmail = async ({ to, name, messageSubject, replyText }) => {
  const subject = `SSHCS - Re: ${messageSubject}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0ea5e9;">Admin Reply</h2>
      <p>Dear ${name},</p>
      <p>We have replied to your inquiry:</p>
      <blockquote style="background: #f5f5f5; padding: 15px; border-left: 3px solid #0ea5e9; margin: 20px 0;">
        ${replyText}
      </blockquote>
      <p>If you have further questions, feel free to contact us.</p>
      <p>Best regards,<br>SSHCS Team</p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
  });
};

const sendMessageReplyEmail = async ({ to, studentName, vendorName, subject, originalMessage, reply }) => {
  const emailSubject = `SSHCS - Reply from ${vendorName}: ${subject}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0ea5e9;">New Message Reply</h2>
      <p>Dear ${studentName},</p>
      <p><strong>${vendorName}</strong> has replied to your message:</p>

      <div style="background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px;">
        <h4 style="margin: 0 0 10px 0; color: #666;">Your Message:</h4>
        <p style="margin: 0; white-space: pre-wrap;">${originalMessage}</p>
      </div>

      <div style="background: #e0f2fe; padding: 15px; margin: 10px 0; border-radius: 5px;">
        <h4 style="margin: 0 0 10px 0; color: #0ea5e9;">Reply:</h4>
        <p style="margin: 0; white-space: pre-wrap;">${reply}</p>
      </div>

      <p>Log in to continue the conversation.</p>
      <p>Best regards,<br>SSHCS Team</p>
    </div>
  `;

  return sendEmail({
    to,
    subject: emailSubject,
    html,
  });
};

const sendAssignmentEmail = async ({ to, deliveryPersonName, orderId, shopName, assignmentId }) => {
  const subject = 'SSHCS - New Delivery Assignment';
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
  
  const acceptUrl = `${serverUrl}/api/delivery/assignments/${assignmentId}/email-respond?response=Accept`;
  const rejectUrl = `${serverUrl}/api/delivery/assignments/${assignmentId}/email-respond?response=Reject`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0ea5e9;">New Delivery Assignment</h2>
      <p>Dear ${deliveryPersonName},</p>
      <p>You have been assigned a new delivery for order <strong>#${orderId}</strong> from <strong>${shopName}</strong>.</p>
      
      <p>You can view all your assignments by logging into your account:</p>
      <p><a href="${clientUrl}/login"
            style="background: #0ea5e9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Log In to View Assignments
        </a>
      </p>

      <h3 style="margin-top: 30px;">Quick Actions</h3>
      <p>Please choose an action for this assignment:</p>
      <div>
        <a href="${acceptUrl}" style="background: #22c55e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px; display: inline-block;">Accept Assignment</a>
        <a href="${rejectUrl}" style="background: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reject Assignment</a>
      </div>
      
      <p style="margin-top: 30px;">Best regards,<br>SSHCS Team</p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
  });
};

export {
  sendEmail,
  sendApprovalEmail,
  sendContactReplyEmail,
  sendMessageReplyEmail,
  sendAssignmentEmail,
};
