import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import authRouter from './modules/auth/auth.route.js';
import userRouter from './modules/user/user.route.js';
import categoryRouter from './modules/category/category.route.js';
import mealRouter from './modules/meal/meal.route.js';
import reviewRouter from './modules/review/review.route.js';
import cartRouter from './modules/cart/cart.route.js';
import orderRouter from './modules/order/order.route.js';
import AppError from './utils/error/appError.js';
import globalErrorHandler from './middlewares/globalErrorHandler.js';

const app = express();

app.enable('trust proxy');

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.disable('x-powered-by');

app.use(cookieParser());
app.use(express.json({ limit: '5kb' }));

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/meals', mealRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/orders', orderRouter);

app.use((req, res, next) => {
  next(
    new AppError(
      `Can't find this route '${req.originalUrl}' on this server!`,
      404,
    ),
  );
});

app.use(globalErrorHandler);

export default app;
