import Cart from './cart.model.js';

// Add item to cart
export const addToCart = async (req, res) => {
  const { mealId, quantity } = req.body;

  let cart = await Cart.findOne({ user: req.user.userId });

  if (!cart) {
    cart = await Cart.create({
      user: req.user.userId,
      items: [{ mealId, quantity }],
    });
  } else {
    cart.items.push({ mealId, quantity });
    await cart.save();
  }

  res.status(200).json({
    status: 'success',
    data: cart,
  });
};

// Get my cart
export const getMyCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.userId });

  res.status(200).json({
    status: 'success',
    data: cart,
  });
};