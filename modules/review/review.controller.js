import Review from "../models/review.model.js";

export const getAllReviews = async (req, res) => {
  try {
    const filter = req.query.mealId ? { meal: req.query.mealId } : {};

    const reviews = await Review.find(filter)
      .populate("user", "name email image")
      .populate("meal", "name");

    res.status(200).json({
      status: "success",
      data: {
        reviews,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate("user", "name email image")
      .populate("meal", "name");

    if (!review) return res.status(404).json({ message: "Review not found" });

    res.status(200).json({
      status: "success",
      data: {
        reviews,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createReview = async (req, res) => {
  try {
    const { rating, comment, mealId } = req.body;
    const review = await Review.create({
      rating,
      comment,
      mealId,
      user: req.user.id,
    });

    res.status(201).json({
      status: "success",
      data: {
        review,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        message: "You already reviewed this meal",
      });
    }

    res.status(400).json({ message: err.message });
  }
};

export const updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) return res.status(404).json({ message: "Review not found" });

    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You are not allowed to update this review",
      });
    }

    const { rating, comment, mealId } = req.body;

    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      { rating, comment, mealId },
      { new: true, runValidators: true },
    );

    res.status(200).json({
      status: "success",
      data: {
        review: updatedReview,
      },
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) return res.status(404).json({ message: "Review not found" });

    if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        message: "You are not allowed to delete this review",
      });
    }

    await review.deleteOne();

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
