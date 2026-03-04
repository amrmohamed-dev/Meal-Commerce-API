import mongoose from 'mongoose';

const mealSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      lowercase: true,
      minlength: [3, 'Name must be at least 3 characters'],
      maxlength: [100, 'Name must not exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [1000, 'Description must not exceed 1000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    image: {
      url: {
        type: String,
        required: [true, 'Image is required'],
      },
      publicId: {
        type: String,
        required: [true, 'Image is required'],
      },
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    preparationTime: {
      type: Number,
      required: [true, 'Preparation time is required'],
      min: [1, 'Preparation time must be at least 1 minute'],
    },
  },
  {
    timestamps: true,
  },
);

mealSchema.index({ category: 1 });
mealSchema.index({ name: 1 });

mealSchema.index({ name: 1, category: 1 }, { unique: true });

const Meal = mongoose.model('Meal', mealSchema);

export default Meal;
