import express from 'express';
import * as orderController from './order.controller.js';
import * as authMiddleware from '../../middlewares/auth.middleware.js';

const orderRouter = express.Router();

orderRouter.use(authMiddleware.isAuthenticated);

orderRouter.post('/', orderController.createOrder);
orderRouter.get('/me', orderController.getMyOrders);
orderRouter.get('/:id', orderController.getOneOrder);
orderRouter.patch('/:id/cancel', orderController.cancelOrder);

// Admin
orderRouter.use(authMiddleware.restrictTo('admin'));

orderRouter.get('/', orderController.getAllOrders);
orderRouter.patch('/:id/status', orderController.updateOrderStatus);

export default orderRouter;
