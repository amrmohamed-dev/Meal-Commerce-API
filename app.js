import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import authRouter from './modules/auth/auth.route.js';
import AppError from './utils/error/appError.js';
import globalErrorHandler from './middlewares/globalErrorHandler.js';

import orderRoutes from "./modules/order/order.route.js";

import cartRouter from './modules/cart/cart.route.js';

const app = express();

app.enable('trust proxy');

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.disable('x-powered-by');

app.use(cookieParser());
app.use(express.json({ limit: '5kb' }));

app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/auth', authRouter);

app.use('/api/v1/cart', cartRouter);


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

