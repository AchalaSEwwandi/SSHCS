import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email'],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },

    role: {
      type: String,
      enum: ['student', 'doctor', 'shop_owner', 'delivery_person', 'admin'],
      default: 'student',
    },

    status: {
      type: String,
      enum: ['pending', 'approved'],
      default: 'approved',
    },

    phone: {
      type: String,
      trim: true,
    },

    avatar: {
      type: String,
      default: '',
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    refreshToken: {
      type: String,
      select: false,
    },

    performanceScore: {
      type: Number,
      default: 0,
    },

    // Student-specific fields
    studentId: { type: String },
    year: { type: Number, min: 1, max: 4 },
    semester: { type: Number, min: 1, max: 2 },
    faculty: { type: String },

    // Doctor-specific fields
    nic: { type: String },
    medicalRegNumber: { type: String },
    specialization: { type: String },
    yearsOfExperience: { type: Number },
    hospitalName: { type: String },
    medicalLicenseFile: { type: String },
    licenseNumber: { type: String },
    availableSlots: [
      {
        day: String,
        startTime: String,
        endTime: String,
      },
    ],

    // Shop Owner-specific fields
    shopName: { type: String },
    businessType: {
      type: String,
      enum: ['pharmacy', 'grocery', 'other'],
    },
    shopType: {
      type: String,
      enum: ['pharmacy', 'grocery', 'other'],
    },
    shopAddress: { type: String },
    businessLicenseFile: { type: String },

    // Delivery-specific fields
    vehicleType: {
      type: String,
      enum: ['bike', 'car', 'walk'],
    },
    currentLocation: { type: String },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Remove sensitive data when sending response
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};

export default mongoose.model('User', userSchema);
