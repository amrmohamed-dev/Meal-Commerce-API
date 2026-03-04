import express from 'express';
import * as categoryController from './category.controller.js';
import * as authMiddleware from '../../middlewares/auth.middleware.js';
import fileUpload from '../../middlewares/upload.middleware.js';

const categoryRouter = express.Router();

categoryRouter
  .route('/')
  .get(categoryController.getAllCategories)
  .post(
    authMiddleware.isAuthenticated,
    authMiddleware.restrictTo('admin'),
    fileUpload('image'),
    categoryController.createCategory,
  );

categoryRouter
  .route('/:id')
  .get(categoryController.getOneCategory)
  .all(authMiddleware.isAuthenticated, authMiddleware.restrictTo('admin'))
  .patch(fileUpload('image'), categoryController.updateCategory)
  .delete(categoryController.deleteCategory);

export default categoryRouter;
