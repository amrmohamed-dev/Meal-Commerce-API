import Order from './order.model.js';
import Cart from '../cart/cart.model.js';
import catchAsync from '../../utils/error/catchAsync.js';
import AppError from '../../utils/error/appError.js';

const createOrder = catchAsync(async (req, res, next) => {
  const { _id } = req.user;

  const cart = await Cart.findOne({ user: _id });

  if (!cart) {
    return next(new AppError('You do not have a cart yet', 404));
  }

  if (cart.cartItems.length === 0) {
    return next(new AppError('Your cart is empty', 400));
  }

  const order = await Order.create({
    user: _id,
    cartItems: [...cart.cartItems],
    totalPrice: cart.totalPrice,
    shippingAddress: req.body.shippingAddress,
  });

  cart.cartItems = [];
  await cart.save();

  res.status(201).json({
    status: 'success',
    data: {
      order,
    },
  });
});

const getMyOrders = catchAsync(async (req, res) => {
  const { _id } = req.user;

  const orders = await Order.find({ user: _id })
    .populate('cartItems.meal')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    data: {
      orders,
    },
  });
});

const getOneOrder = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { _id, role } = req.user;

  const order = await Order.findById(id).populate({
    path: 'cartItems.meal',
    select: 'name price image',
  });

  if (!order) {
    return next(new AppError('No order found with that ID', 404));
  }

  if (role !== 'admin' && !order.user.equals(_id)) {
    return next(
      new AppError('You are not allowed to access this order', 403),
    );
  }

  res.status(200).json({
    status: 'success',
    data: {
      order,
    },
  });
});

const cancelOrder = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { _id: userId } = req.user;

  const order = await Order.findById(id);

  if (!order) {
    return next(new AppError('No order found with that ID', 404));
  }

  if (!order.user.equals(userId)) {
    return next(new AppError('Not authorized to cancel this order', 403));
  }

  if (!['pending', 'confirmed'].includes(order.status)) {
    return next(new AppError('Cannot cancel this order', 400));
  }

  order.status = 'cancelled';
  await order.save();

  res.status(200).json({
    status: 'success',
    message: 'Order cancelled successfully',
  });
});

const getAllOrders = catchAsync(async (req, res) => {
  const orders = await Order.find()
    .populate('user')
    .populate('cartItems.meal');

  res.status(200).json({
    status: 'success',
    data: {
      orders,
    },
  });
});

const updateOrderStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findById(id);

  if (!order) {
    return next(new AppError('No order found with that ID', 404));
  }

  const { status } = req.body;

  const validStatuses = [
    'pending',
    'confirmed',
    'preparing',
    'shipped',
    'delivered',
    'cancelled',
  ];

  if (!validStatuses.includes(status)) {
    return next(new AppError('Invalid status', 400));
  }

  order.status = status;
  await order.save();

  res.status(200).json({
    status: 'success',
    data: {
      order,
    },
  });
});

const getOrderStats = catchAsync(async (req, res, next) => {
  const stats = await Order.aggregate([
    {
      $group: {
        _id: '$status',
        nOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totalPrice' },
        avgOrderPrice: { $avg: '$totalPrice' },
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

export {
  createOrder,
  getMyOrders,
  getOneOrder,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  getOrderStats,
};
