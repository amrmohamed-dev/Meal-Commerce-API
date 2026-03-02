import AppError from '../../utils/error/appError.js';
import catchAsync from '../../utils/error/catchAsync.js';
import User from './user.model.js';

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
  getAllUsers,
  getOneUser,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole,
};
