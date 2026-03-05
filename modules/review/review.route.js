import express from 'express';
import * as reviewController from './review.controller.js';
import * as authMiddleware from '../../middlewares/auth.middleware.js';

const reviewRouter = express.Router();

reviewRouter.route('/').get(reviewController.getAllReviews).post(
  authMiddleware.isAuthenticated,

  authMiddleware.needVerify,
  reviewController.createReview,
);

reviewRouter
  .route('/:id')
  .get(reviewController.getOneReview)
  .all(authMiddleware.isAuthenticated, authMiddleware.needVerify)
  .patch(reviewController.updateReview)
  .delete(reviewController.deleteReview);

export default reviewRouter;
