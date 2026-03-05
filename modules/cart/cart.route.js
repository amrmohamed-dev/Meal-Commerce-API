import express from 'express';
import * as cartController from './cart.controller.js';
import * as authMiddleware from '../../middlewares/auth.middleware.js';

const cartRouter = express.Router();

cartRouter.use(authMiddleware.isAuthenticated);

cartRouter
  .route('/')
  .get(cartController.getCart)
  .post(cartController.addToCart);

cartRouter.delete('/clear', cartController.clearCart);

cartRouter
  .route('/:mealId')
  .patch(cartController.updateMealQuantity)
  .delete(cartController.deleteFromCart);

export default cartRouter;
