import User from './user.model.js';
import Meal from '../meal/meal.model.js';
import * as cloudinaryService from '../../services/cloudinary.service.js';
import catchAsync from '../../utils/error/catchAsync.js';
import AppError from '../../utils/error/appError.js';

// Helper
const ensureNotLastAdmin = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('No user found with that ID', 404);
  }

  if (user.role === 'admin') {
    const adminsCount = await User.countDocuments({ role: 'admin' });

    if (adminsCount <= 1) {
      throw new AppError('Cannot delete the last admin', 400);
    }
  }

  return user;
};

// Me
const getMe = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user,
    },
  });
};

const updateMe = catchAsync(async (req, res, next) => {
  const { _id } = req.user;
  const { name } = req.body;
  const user = await User.findById(_id);
  user.name = name;
  await user.save({ validateModifiedOnly: true });
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

const deleteMe = catchAsync(async (req, res, next) => {
  const { _id } = req.user;

  const user = await ensureNotLastAdmin(_id);
  if (!user) return;

  await user.deleteOne();

  res.status(204).send();
});

const getMyFavourites = catchAsync(async (req, res, next) => {
  const { _id } = req.user;
  const user = await User.findById(_id)
    .select('favouriteMeals')
    .populate('favouriteMeals.meal');

  user.favouriteMeals.sort((a, b) => b.addedAt - a.addedAt);

  res.status(200).json({
    status: 'success',
    data: {
      favouriteMeals: user.favouriteMeals,
    },
  });
});

const toggleFavourite = catchAsync(async (req, res, next) => {
  const { user } = req;
  const { mealId } = req.params;

  const meal = await Meal.findById(mealId);

  if (!meal) {
    return next(new AppError('No Meal found with that ID', 404));
  }

  const favIndex = user.favouriteMeals.findIndex((fav) =>
    fav.meal.equals(mealId),
  );

  let action;

  if (favIndex !== -1) {
    action = 'removed from';
    user.favouriteMeals.splice(favIndex, 1);
  } else {
    action = 'added to';
    user.favouriteMeals.push({ meal: mealId });
  }

  await user.save({ validateModifiedOnly: true });

  const populatedUser = await User.findById(user._id)
    .select('favouriteMeals')
    .populate('favouriteMeals.meal');

  res.status(200).json({
    status: 'success',
    message: `Meal ${action} favourites`,
    data: {
      favouriteMeals: populatedUser.favouriteMeals,
    },
  });
});

const addProfilePhoto = catchAsync(async (req, res, next) => {
  if (!req.file)
    return next(new AppError('Profile image is required', 400));

  const { _id } = req.user;

  const user = await User.findById(_id);

  const uploadResult = await cloudinaryService.uploadToCloudinary(
    req.file.buffer,
    'users',
  );

  const oldPublicId = user.image?.publicId;

  user.image = {
    url: uploadResult.secure_url,
    publicId: uploadResult.public_id,
  };

  await user.save({ validateModifiedOnly: true });

  if (oldPublicId) {
    await cloudinaryService.deleteFromCloudinary(oldPublicId);
  }

  res.status(200).json({
    status: 'success',
    message: 'Profile photo uploaded successfully',
    data: {
      user,
    },
  });
});

const deleteProfilePhoto = catchAsync(async (req, res, next) => {
  const { _id } = req.user;

  const user = await User.findById(_id);

  if (!user.image?.publicId)
    return next(new AppError('No profile photo to delete', 400));

  await cloudinaryService.deleteFromCloudinary(user.image?.publicId);

  user.image = {
    url: null,
    publicId: null,
  };

  await user.save({ validateModifiedOnly: true });

  res.status(200).json({
    status: 'success',
    message: 'Profile photo deleted successfully',
    data: {
      user,
    },
  });
});

// Admin
const getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: 'success',
    data: {
      users,
    },
  });
});

const getOneUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

const createUser = catchAsync(async (req, res, next) => {
  const { name, email, password, phone, address, isVerified } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return next(
      new AppError('An account with this email already exists.', 409),
    );
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    address,
    isVerified,
  });

  res.status(201).json({
    success: 'success',
    message: 'User created successfully',
    data: {
      user,
    },
  });
});

const updateUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id);

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  const { name, email, password, phone, address, isVerified } = req.body;

  if (name) user.name = name;
  if (email) user.email = email;
  if (password) user.password = password;
  if (phone) user.phone = phone;
  if (address) user.address = address;
  if (typeof isVerified === 'boolean') user.isVerified = isVerified;
  await user.save({ validateModifiedOnly: true });

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

const deleteUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const user = await ensureNotLastAdmin(id);
  if (!user) return;

  await user.deleteOne();

  res.status(204).send();
});

const updateUserRole = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { role } = req.body;

  if (
    typeof role !== 'string' ||
    !['user', 'admin'].includes(role.trim())
  ) {
    return next(new AppError('Invalid role', 400));
  }

  const user = await User.findById(id);

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  if (req.user.id === id) {
    return next(new AppError('You cannot change your own role', 400));
  }

  if (user.role === 'admin' && role === 'user') {
    const adminsCount = await User.countDocuments({ role: 'admin' });

    if (adminsCount <= 1) {
      return next(new AppError('Cannot downgrade the last admin', 400));
    }
  }

  user.role = role;
  await user.save({ validateModifiedOnly: true });

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

export {
  getMe,
  updateMe,
  deleteMe,
  getMyFavourites,
  toggleFavourite,
  addProfilePhoto,
  deleteProfilePhoto,
  getAllUsers,
  getOneUser,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole,
};
