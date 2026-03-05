import Cart from './cart.model.js';
import Meal from '../meal/meal.model.js';
import catchAsync from '../../utils/error/catchAsync.js';
import AppError from '../../utils/error/appError.js';

const getCart = catchAsync(async (req, res) => {
  const { _id } = req.user;

  let cart = await Cart.findOne({ user: _id }).populate('cartItems.meal');

  if (!cart) {
    cart = {
      user: _id,
      cartItems: [],
      totalPrice: 0,
    };
  }

  res.status(200).json({
    status: 'success',
    data: {
      cart,
    },
  });
});

const addToCart = catchAsync(async (req, res, next) => {
  const { mealId, quantity = 1 } = req.body;

  if (quantity < 1) {
    return next(new AppError('Quantity must be at least 1', 400));
  }

  const meal = await Meal.findById(mealId).select('price');

  if (!meal) {
    return next(new AppError('No meal found with that ID', 404));
  }

  const { _id } = req.user;

  let cart = await Cart.findOne({ user: _id });
  if (!cart) {
    cart = await Cart.create({
      user: _id,
      cartItems: [{ meal: meal._id, quantity, price: meal.price }],
    });
  } else {
    const cartItem = cart.cartItems.find((item) =>
      item.meal.equals(mealId),
    );
    if (cartItem) {
      const newQuantity = cartItem.quantity + quantity;
      cartItem.quantity = newQuantity;
    } else {
      cart.cartItems.push({
        meal: meal._id,
        quantity,
        price: meal.price,
      });
    }
    await cart.save();
  }

  res.status(201).json({
    status: 'success',
    data: {
      cart,
    },
  });
});

const updateMealQuantity = catchAsync(async (req, res, next) => {
  const { mealId } = req.params;
  const { quantity = 1 } = req.body;

  if (quantity < 1) {
    return next(new AppError('Quantity must be at least 1', 400));
  }

  const { _id } = req.user;

  const cart = await Cart.findOne({ user: _id });

  if (!cart) {
    return next(new AppError('You do not have a cart yet', 404));
  }

  const cartItem = cart.cartItems.find((item) => item.meal.equals(mealId));
  if (cartItem) {
    cartItem.quantity = quantity;
  } else {
    return next(new AppError('This meal not found in your cart', 404));
  }

  await cart.save();

  res.status(200).json({
    status: 'success',
    data: {
      cart,
    },
  });
});

const deleteFromCart = catchAsync(async (req, res, next) => {
  const { mealId } = req.params;
  const { _id } = req.user;

  const cart = await Cart.findOne({ user: _id });

  if (!cart) {
    return next(new AppError('You do not have a cart yet', 404));
  }

  if (cart.cartItems.length === 0) {
    return next(new AppError('Your cart is empty', 400));
  }

  const cartItem = cart.cartItems.find((el) => el.meal.equals(mealId));

  if (!cartItem) {
    return next(new AppError('This meal is not in your cart', 404));
  }

  cart.cartItems = cart.cartItems.filter((el) => !el.meal.equals(mealId));

  await cart.save();

  res.status(200).json({
    status: 'success',
    data: {
      cart,
    },
  });
});

const clearCart = catchAsync(async (req, res, next) => {
  const { _id } = req.user;

  const cart = await Cart.findOne({ user: _id });

  if (!cart) {
    return next(new AppError('You do not have a cart yet', 404));
  }

  if (cart.cartItems.length === 0) {
    return next(new AppError('Your cart is already empty', 400));
  }

  cart.cartItems = [];

  await cart.save();

  res.status(200).json({
    status: 'success',
    data: {
      cart,
    },
  });
});

export {
  getCart,
  addToCart,
  updateMealQuantity,
  deleteFromCart,
  clearCart,
};
