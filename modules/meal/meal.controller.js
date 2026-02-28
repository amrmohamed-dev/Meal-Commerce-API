import AppError from "../../utils/error/appError.js";
import catchAsync from "../../utils/error/catchAsync.js";
import Meal from "./meal.model.js";
const getAllMeals = catchAsync(async (req, res) => {
  const meals = await Meal.find();
  res.status(200).json({
    status: "success",
    data: {
      meals,
    },
  });
});
const getOneMeal = catchAsync(async (req, res) => {
  const { mealId } = req.params.id;
  const meal = await Meal.findById(mealId);
  if (!meal) {
    return new AppError("No user found with that ID", 404);
  }
  res.status(200).json({
    status: "success",
    data: {
      meal,
    },
  });
});
const createMeal = catchAsync(async (req, res, next) => {
  const { name, description, price, category, isAvailable, preparationTime } =
    req.body;

  const existingMeal = await Meal.findOne({ name });

  if (existingMeal) {
    return next(new AppError("Meal is already exists", 400));
  }

  const newMeal = await Meal.create({
    name,
    description,
    price,
    category,
    isAvailable,
    preparationTime,
  });

  res.status(201).json({
    success: true,
    message: "Meal added successfully",
    data: { newMeal },
  });
});

const updateMeal = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const meal = await Meal.findById(id);
  if (!meal) {
    return next(new AppError("Meal not found", 404));
  }

  const updatedMeal = await Meal.findByIdAndUpdate(id, req.body, {
    new: true,
  });
  res.status(200).json({
    status: "success",
    data: {
      meal: { updatedMeal },
    },
  });
});

const deleteMeal = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const meal = await Meal.findByIdAndDelete(id);
  if (!meal) {
    return next(new AppError("Meal not found", 404));
  }

  res.status(204).send();
});

export { getAllMeals, getOneMeal, updateMeal, deleteMeal, createMeal };
