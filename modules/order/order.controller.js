import Order from './order.model.js';
import Cart from '../cart/cart.model.js'; 

// Create Order from Cart
export const createOrder = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.meal');
    if (!cart || cart.items.length === 0)
      return res.status(400).json({ message: 'Cart is empty' });

    let total = 0;
    const orderItems = cart.items.map((item) => {
      total += item.meal.price * item.quantity;
      return {
        meal: item.meal._id,
        quantity: item.quantity,
        price: item.meal.price,
      };
    });

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalPrice: total,
    });

    cart.items = [];
    await cart.save();

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get My Orders
export const getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).populate("items.meal");
  res.json(orders);
};

// Get Order by ID
export const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id).populate("items.meal");
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json(order);
};

// Cancel Order (User)
export const cancelOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.status !== "pending")
    return res.status(400).json({ message: "Cannot cancel this order" });

  order.status = "cancelled";
  await order.save();
  res.json({ message: "Order cancelled" });
};

// Admin – Get all orders
export const getAllOrders = async (req, res) => {
  const orders = await Order.find().populate("user items.meal");
  res.json(orders);
};

// Admin – Update order status
export const updateOrderStatus = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });

  const { status } = req.body;
  if (!["pending","confirmed","shipped","delivered","cancelled"].includes(status))
    return res.status(400).json({ message: "Invalid status" });

  order.status = status;
  await order.save();
  res.json(order);
};