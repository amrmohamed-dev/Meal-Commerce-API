import AppError from "../../utils/error/appError.js";
import catchAsync from "../../utils/error/catchAsync.js";
import Category from "./category.model.js";

const getAllCategories = catchAsync(async (req, res, next) => {
  const categories = await Category.find();

  res.status(200).json({
    status: "success",
    results: categories.length,
    data: { categories },
  });
});

const getOneCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const category = await Category.findById(id);

  if (!category) {
    return next(new AppError("No category found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: { category },
  });
});

const createCategory = catchAsync(async (req, res, next) => {
  const { name } = req.body;

  const exists = await Category.findOne({ name });
  if (exists) {
    return next(new AppError("Category already exists", 400));
  }

  const image = req.file.path;
  const category = await Category.create({ name });

  res.status(201).json({
    status: "success",
    data: { category },
  });
});

const updateCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;

  const category = await Category.findByIdAndUpdate(
    id,
    { name },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!category) {
    return next(new AppError("No category found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: category,
  });
});

const deleteCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const category = await Category.findByIdAndDelete(id);

  if (!category) {
    return next(new AppError("No category found with that ID", 404));
  }

  res.status(204).send();
});

export {
  getAllCategories,
  getOneCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
