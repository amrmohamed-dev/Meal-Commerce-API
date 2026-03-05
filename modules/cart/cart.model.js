import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema(
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
  },
  { timestamps: true },
);

cartSchema.index({ user: 1 }, { unique: true });

cartSchema.pre('save', function () {
  this.totalPrice = this.cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );
});

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
