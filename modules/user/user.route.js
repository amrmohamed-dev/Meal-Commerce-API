import express from 'express';
import * as userController from './user.controller.js';
import * as authMiddleware from '../../middlewares/auth.middleware.js';
import { updateMyPassword } from '../auth/auth.controller.js';
import fileUpload from '../../middlewares/upload.middleware.js';

const userRouter = express.Router();

userRouter.use(authMiddleware.isAuthenticated);

userRouter
  .route('/me')
  .get(userController.getMe)
  .patch(userController.updateMe)
  .delete(userController.deleteMe);

userRouter.patch('/me/update-password', updateMyPassword);

userRouter.get('/me/favourites', userController.getMyFavourites);
userRouter.patch('/me/favourites/:mealId', userController.toggleFavourite);

userRouter
  .route('/me/photo')
  .patch(fileUpload('image'), userController.addProfilePhoto)
  .delete(userController.deleteProfilePhoto);

// Admin
userRouter.use(authMiddleware.restrictTo('admin'));

userRouter
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

userRouter
  .route('/:id')
  .get(userController.getOneUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

userRouter.patch('/:id/role', userController.updateUserRole);

export default userRouter;
