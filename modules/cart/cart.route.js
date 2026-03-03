import express from 'express';
import { addToCart, getMyCart } from './cart.controller.js';
import { isAuthenticated } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.use(isAuthenticated);

router.post('/', addToCart);
router.get('/', getMyCart);

export default router;
