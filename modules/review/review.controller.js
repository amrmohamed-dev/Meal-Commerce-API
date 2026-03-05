import Review from './review.model.js';
import Meal from '../meal/meal.model.js';
import catchAsync from '../../utils/error/catchAsync.js';
import AppError from '../../utils/error/appError.js';

const getAllReviews = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.mealId) {
    filter.meal = req.query.mealId;
  }

  const reviews = await Review.find(filter)
    .populate('user', 'name email image')
    .populate('meal', 'name')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    data: {
      reviews,
    },
  });
});

const getOneReview = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const review = await Review.findById(id)
    .populate('user', 'name email image')
    .populate('meal', 'name');

  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      review,
    },
  });
});

const createReview = catchAsync(async (req, res, next) => {
  const { rating, comment, mealId: meal } = req.body;
  const { _id: user } = req.user;

  const existingMeal = await Meal.findById(meal);

  if (!existingMeal) {
    return next(new AppError('No meal found with that ID', 404));
  }

  const existingReview = await Review.findOne({ user, meal });

  if (existingReview) {
    return next(new AppError('You already reviewed this meal', 400));
  }

  const review = await Review.create({
    rating,
    comment,
    meal,
    user,
  });

  res.status(201).json({
    status: 'success',
    data: {
      review,
    },
  });
});

const updateReview = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { _id: user } = req.user;

  const review = await Review.findById(id);

  if (!review) {
    return next(new AppError('No review found with that ID', 404));
  }

  if (!review.user.equals(user)) {
    return next(new AppError('Not authorized to update this review', 403));
  }

  const { rating, comment } = req.body;

  if (typeof rating === 'number') review.rating = rating;
  if (typeof comment === 'string') review.comment = comment;

  await review.save();

  res.status(200).json({
    status: 'success',
    data: {
      review,
    },
  });
});

const deleteReview = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { _id: user, role } = req.user;

  const review = await Review.findById(id);

  if (!review) {
    return next(new AppError('No review found with that ID', 404));
  }

  if (!review.user.equals(user) && role !== 'admin') {
    return next(new AppError('Not authorized to delete this review', 403));
  }

  await review.deleteOne();

  res.status(204).send();
});

export {
  getAllReviews,
  getOneReview,
  createReview,
  updateReview,
  deleteReview,
};
