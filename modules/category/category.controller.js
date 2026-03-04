import Category from './category.model.js';
import * as cloudinaryService from '../../services/cloudinary.service.js';
import catchAsync from '../../utils/error/catchAsync.js';
import AppError from '../../utils/error/appError.js';

const getAllCategories = catchAsync(async (req, res, next) => {
  const categories = await Category.find();

  res.status(200).json({
    status: 'success',
    data: {
      categories,
    },
  });
});

const getOneCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const category = await Category.findById(id);

  if (!category) {
    return next(new AppError('No category found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      category,
    },
  });
});

const createCategory = catchAsync(async (req, res, next) => {
  const { name } = req.body;

  const exists = await Category.findOne({ name });
  if (exists) {
    return next(new AppError('Category already exists', 400));
  }

  let uploadResult;
  let imageData = {
    url: null,
    publicId: null,
  };
  if (req.file) {
    uploadResult = await cloudinaryService.uploadToCloudinary(
      req.file.buffer,
      'categories',
    );

    imageData = {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    };
  }

  let category;
  try {
    category = await Category.create({
      name,
      image: imageData,
    });
  } catch (err) {
    if (uploadResult?.public_id)
      await cloudinaryService.deleteFromCloudinary(uploadResult.public_id);
    throw err;
  }

  res.status(201).json({
    status: 'success',
    data: {
      category,
    },
  });
});

const updateCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;

  const category = await Category.findById(id);

  if (!category) {
    return next(new AppError('No category found with that ID', 404));
  }

  if (name) {
    const exists = await Category.findOne({
      name: name.trim().toLowerCase(),
      _id: { $ne: category._id },
    });

    if (exists) {
      return next(new AppError('Category already exists', 400));
    }
    category.name = name;
  }

  if (req.file) {
    const uploadResult = await cloudinaryService.uploadToCloudinary(
      req.file.buffer,
      'categories',
    );

    const oldPublicId = category.image?.publicId;

    category.image = {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    };

    if (oldPublicId) {
      await cloudinaryService.deleteFromCloudinary(oldPublicId);
    }
  }

  await category.save({ validateModifiedOnly: true });

  res.status(200).json({
    status: 'success',
    data: {
      category,
    },
  });
});

const deleteCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const category = await Category.findByIdAndDelete(id);

  if (!category) {
    return next(new AppError('No category found with that ID', 404));
  }

  if (category.image?.publicId) {
    await cloudinaryService.deleteFromCloudinary(category.image.publicId);
  }

  await category.deleteOne();

  res.status(204).send();
});

export {
  getAllCategories,
  getOneCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
