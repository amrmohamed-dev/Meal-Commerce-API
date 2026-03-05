import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    meal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meal',
      required: [true, 'Meal is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required.'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating must not exceed 5'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Comment must not exceed 500 characters.'],
    },
  },
  { timestamps: true },
);

reviewSchema.index({ user: 1, meal: 1 }, { unique: true });

reviewSchema.statics.calcAverageRatings = async function (mealId) {
  const stats = await this.aggregate([
    {
      $match: { meal: mealId },
    },
    {
      $group: {
        _id: '$meal',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await mongoose.model('Meal').findByIdAndUpdate(mealId, {
      ratingQuantity: stats[0].nRating,
      ratingAverage: Math.round(stats[0].avgRating * 10) / 10,
    });
  } else {
    await mongoose.model('Meal').findByIdAndUpdate(mealId, {
      ratingQuantity: 0,
      ratingAverage: 0,
    });
  }
};

reviewSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.meal);
});

reviewSchema.post(
  'deleteOne',
  { document: true, query: false },
  async function () {
    await this.constructor.calcAverageRatings(this.meal);
  },
);

const Review = mongoose.model('Review', reviewSchema);

export default Review;
