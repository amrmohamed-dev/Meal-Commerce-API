import AppError from "../../utils/error/appError.js";
import catchAsync from "../../utils/error/catchAsync.js";
import User from "./user.model.js";

const getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find();
  res.status(200).json({
    status: "success",
    data: {
      users,
    },
  });
});
const getOneUser = catchAsync(async (req, res) => {
  const userId = req.params.id;
  const user = await User.findById(userId);
  if (!user) {
    return new AppError("No user found with that ID", 404);
  }
  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});
const createUser = catchAsync(async (req, res, next) => {
  const { name, email, password, phone, address } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return next(new AppError("Email already exists", 400));
  }

  const newUser = await User.create({
    name,
    email,
    password,
    phone,
    address
  });

  res.status(201).json({
    success: true,
    message: "User created successfully",
    data: {newUser},
  });
});

const updateUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  const updatedUser = await User.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: "success",
    data: {
      user:{ updatedUser} ,
    },
  });
});

const deleteUser =catchAsync( async (req, res, next) =>{
    const { id } = req.params;
        const user = await User.findByIdAndDelete(id);
 if (!user) {
      return next(new AppError("User not found", 404));
    }

    res.status(204).send();
}) 

export { getAllUsers,getOneUser,updateUser, deleteUser,createUser };