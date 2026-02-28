import mongoose from "mongoose";

const mealSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
   description : {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    image: {
      publicId: {
        type: String,
        required: true,
      },
      secureUrl: {
        type: String,
        required: true,
      },
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    preparationTime: {
      type: Number, 
      required: true,
      min: 1,
    },
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Meal", mealSchema);
