import express from 'express';
import * as mealController from './meal.controller.js';
import * as authMiddleware from '../../middlewares/auth.middleware.js';
import fileUpload from '../../middlewares/upload.middleware.js';

const mealRouter = express.Router();

mealRouter
  .route('/')
  .get(mealController.getAllMeals)
  .post(
    authMiddleware.isAuthenticated,
    authMiddleware.restrictTo('admin'),
    fileUpload('image'),
    mealController.createMeal,
  );

mealRouter
  .route('/:id')
  .get(mealController.getOneMeal)
  .all(authMiddleware.isAuthenticated, authMiddleware.restrictTo('admin'))
  .patch(fileUpload('image'), mealController.updateMeal)
  .delete(mealController.deleteMeal);

export default mealRouter;
