import mongoose from 'mongoose';

const deliveryPersonSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    storeName: {
      type: String,
      required: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    nic: {
      type: String,
      required: true,
      trim: true,
    },
    vehicleType: {
      type: String,
      required: true,
      trim: true,
    },
    vehicleNumber: {
      type: String,
      required: true,
      trim: true,
    },
    deliveryArea: {
      type: String,
      required: true,
      trim: true,
    },
    availability: {
      type: String,
      enum: ['Available', 'Busy'],
      default: 'Available',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('DeliveryPerson', deliveryPersonSchema);
