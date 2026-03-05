import express from "express";
import {
  getAllReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
} from "../controllers/review.controller.js";

import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", getAllReviews);
router.get("/:id", getReview);

router.post("/", protect, createReview);
router.patch("/:id", protect, updateReview);
router.delete("/:id", protect, deleteReview);
export default router;
