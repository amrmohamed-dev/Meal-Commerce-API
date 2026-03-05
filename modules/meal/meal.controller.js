import Meal from './meal.model.js';
import Category from '../category/category.model.js';
import * as cloudinaryService from '../../services/cloudinary.service.js';
import catchAsync from '../../utils/error/catchAsync.js';
import AppError from '../../utils/error/appError.js';

const getAllMeals = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.categoryId) {
    filter.category = req.query.categoryId;
  }

  const meals = await Meal.find(filter).populate('category', 'name');

  res.status(200).json({
    status: 'success',
    data: {
      meals,
    },
  });
});

const getOneMeal = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const meal = await Meal.findById(id).populate('category', 'name');

  if (!meal) {
    return next(new AppError('No meal found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      meal,
    },
  });
});

const createMeal = catchAsync(async (req, res, next) => {
  const {
    name,
    description,
    price,
    categoryId: category,
    preparationTime,
  } = req.body;

  const categoryExists = await Category.findById(category);

  if (!categoryExists) {
    return next(new AppError('No Category found with that ID', 404));
  }

  const mealExists = await Meal.findOne({
    name: name?.trim().toLowerCase(),
    category,
  });

  if (mealExists) {
    return next(new AppError('Meal already exists in this category', 400));
  }

  if (!req.file) {
    return next(new AppError('Meal image is required', 400));
  }

  const uploadResult = await cloudinaryService.uploadToCloudinary(
    req.file.buffer,
    'meals',
  );

  let meal;
  try {
    meal = await Meal.create({
      name,
      description,
      price,
      category,
      image: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      },
      preparationTime,
    });
  } catch (err) {
    await cloudinaryService.deleteFromCloudinary(uploadResult.public_id);
    throw err;
  }

  res.status(201).json({
    status: 'success',
    message: 'Meal added successfully',
    data: {
      meal,
    },
  });
});

const updateMeal = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const {
    name,
    description,
    price,
    categoryId: category,
    preparationTime,
  } = req.body;

  const meal = await Meal.findById(id);

  if (!meal) {
    return next(new AppError('No Meal found with that ID', 404));
  }

  if (category) {
    const categoryExists = await Category.findById(category);

    if (!categoryExists) {
      return next(new AppError('No Category found with that ID', 404));
    }
  }

  if (name || category) {
    const existingMeal = await Meal.findOne({
      name: name?.trim().toLowerCase() || meal.name,
      category: category || meal.category,
      _id: { $ne: meal._id },
    });

    if (existingMeal) {
      return next(
        new AppError('Meal already exists in this category', 400),
      );
    }
  }

  if (name) meal.name = name;
  if (description) meal.description = description;
  if (price !== undefined) meal.price = Number(price);
  if (category) meal.category = category;
  if (preparationTime !== undefined)
    meal.preparationTime = Number(preparationTime);

  if (req.file) {
    const uploadResult = await cloudinaryService.uploadToCloudinary(
      req.file.buffer,
      'meals',
    );

    const oldPublicId = meal.image?.publicId;

    meal.image = {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    };

    if (oldPublicId) {
      await cloudinaryService.deleteFromCloudinary(oldPublicId);
    }
  }

  await meal.save({ validateModifiedOnly: true });

  res.status(200).json({
    status: 'success',
    message: 'Meal updated successfully',
    data: {
      meal,
    },
  });
});

const deleteMeal = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const meal = await Meal.findById(id);

  if (!meal) {
    return next(new AppError('No Meal found with that ID', 404));
  }

  if (meal.image?.publicId) {
    await cloudinaryService.deleteFromCloudinary(meal.image.publicId);
  }

  await meal.deleteOne();

  res.status(204).send();
});

export { getAllMeals, getOneMeal, updateMeal, deleteMeal, createMeal };
