import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import { generateOTP, sendEmail } from '../utils/index.js';

const generateAccessToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '15m' });

const generateRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

/**
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role,
      // student fields
      studentId,
      year,
      semester,
      faculty,
      // doctor fields
      nic,
      medicalRegNumber,
      specialization,
      yearsOfExperience,
      hospitalName,
      medicalLicenseFile,
      // vendor fields
      shopName,
      businessType,
      shopAddress,
      businessLicenseFile,
    } = req.body;

    const allowedRoles = ['student', 'doctor', 'shop_owner'];
    const chosenRole = allowedRoles.includes(role) ? role : 'student';

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already in use.' });
    }

    // Auto-set status: students auto-approved, others pending
    const status = chosenRole === 'student' ? 'approved' : 'pending';

    // Build user data
    const avatar = req.files?.avatar?.[0]?.filename || '';
    const userData = { name, email, password, phone, role: chosenRole, status, avatar };

    if (chosenRole === 'student') {
      Object.assign(userData, { studentId, year, semester, faculty });
    }

    if (chosenRole === 'doctor') {
      Object.assign(userData, {
        nic,
        medicalRegNumber,
        specialization,
        yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : undefined,
        hospitalName,
        medicalLicenseFile: req.files?.medicalLicenseFile?.[0]?.filename || '',
      });
    }

    if (chosenRole === 'shop_owner') {
      Object.assign(userData, {
        nic,
        shopName,
        businessType,
        shopAddress,
        businessLicenseFile: req.files?.businessLicenseFile?.[0]?.filename || '',
      });
    }

    const user = await User.create(userData);

    // Pending users: return without tokens
    if (status === 'pending') {
      return res.status(201).json({
        success: true,
        pending: true,
        message: 'Registration submitted! Your account is pending admin approval. You will be notified by email once approved.',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
          },
        },
      });
    }

    // Approved users: issue tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      pending: false,
      message: 'User registered successfully.',
      data: {
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          avatar: user.avatar,
          isActive: user.isActive,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact admin.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          avatar: user.avatar,
          isActive: user.isActive,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 */
export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      await User.findOneAndUpdate({ refreshToken }, { refreshToken: '' });
    }
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/refresh-token
 */
export const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
    }

    const accessToken = generateAccessToken(user._id, user.role);
    res.json({ success: true, data: { accessToken } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: true, message: 'If that email exists, an OTP has been sent.' });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OTP.deleteMany({ email });
    await OTP.create({ email, otp, expiresAt });

    // Sending email
    await sendEmail({
      to: email,
      subject: 'SSHCS - Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0ea5e9;">Password Reset</h2>
          <p>You requested a password reset. Use the following OTP:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0;">
            <strong>${otp}</strong>
          </div>
          <p>This OTP expires in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    res.json({ success: true, message: 'OTP sent to your email.' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/verify-otp
 */
export const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const record = await OTP.findOne({ email });
    if (!record) {
      return res.status(400).json({ success: false, message: 'OTP not found or expired. Request a new one.' });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    if (record.expiresAt < new Date()) {
      await OTP.deleteOne({ email });
      return res.status(400).json({ success: false, message: 'OTP has expired. Request a new one.' });
    }

    const resetToken = jwt.sign({ email }, process.env.JWT_RESET_SECRET, { expiresIn: '5m' });
    res.json({ success: true, message: 'OTP verified.', data: { resetToken } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_RESET_SECRET);
    } catch {
      return res.status(400).json({ success: false, message: 'Reset token is invalid or expired.' });
    }

    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.password = newPassword;
    await user.save();

    await OTP.deleteMany({ email: decoded.email });

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    next(error);
  }
};
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) { next(error); }
};
export const updateProfile = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    delete updates.password; // Do not allow password update here
    delete updates.role;     // Role shouldn't be updated here
    delete updates.status;   // Approval shouldn't be updated here
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true }).select('-password');
    res.json({ success: true, data: user });
  } catch (error) { next(error); }
};
export const deleteProfile = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) { next(error); }
};
