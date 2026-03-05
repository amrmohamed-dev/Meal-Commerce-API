import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    cartItems: {
      type: [
        {
          meal: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Meal',
            required: [true, 'Meal is required'],
          },
          quantity: {
            type: Number,
            min: [1, 'Quantity must be at least 1'],
            default: 1,
          },
          price: {
            type: Number,
            min: [0, 'Price must be positive'],
            required: [true, 'Price is required'],
          },
        },
      ],
      default: [],
    },
    totalPrice: {
      type: Number,
      min: [0, 'totalPrice must be positive'],
      default: 0,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'preparing',
        'shipped',
        'delivered',
        'cancelled',
      ],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card'],
      default: 'cash',
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: Date,
    shippingAddress: {
      street: {
        type: String,
        required: [true, 'Street is required'],
      },
      city: {
        type: String,
        required: [true, 'City is required'],
      },
      phone: {
        type: String,
        required: [true, 'Phone is required'],
      },
    },
    deliveredAt: Date,
  },
  { timestamps: true },
);

orderSchema.index({ user: 1 });

export default mongoose.model('Order', orderSchema);
