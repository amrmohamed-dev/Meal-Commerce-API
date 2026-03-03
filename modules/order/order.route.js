import express from 'express';

import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
} from './order.controller.js';

// 👇 ده السطر الصح
import { isAuthenticated, restrictTo } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.use(isAuthenticated);

// User endpoints
router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrderById);
router.patch('/:id/cancel', cancelOrder);

// Admin endpoints
router.get('/', restrictTo('admin'), getAllOrders);
router.patch('/:id/status', restrictTo('admin'), updateOrderStatus);

export default router;