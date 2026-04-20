import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      default: 'demo',
    },
    shopName: {
      type: String,
      default: '',
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: false,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: false,
        },
        name: String,
        price: Number,
        quantity: Number,
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    deliveryCharge: {
      type: Number,
      default: 50,
    },
    grandTotal: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Ready', 'Ready for Pickup', 'Out for Delivery', 'Delivered'],
      default: 'Pending',
    },
    deliveryAddress: {
      type: String,
      default: '',
    },
    deliveryArea: {
      type: String,
      enum: ['Inside Campus', 'Outside Campus (around 1km)', ''],
      default: '',
    },
    telephone: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      default: '',
    },
    confirmedOrder: {
      type: Boolean,
      default: false,
    },
    isRated: {
      type: Boolean,
      default: false,
    },
    isDeliveryConfirmed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Order', orderSchema);

