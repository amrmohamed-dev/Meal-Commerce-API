import express from "express";
import {
  getAllMeals,
  getOneMeal,
  updateMeal,
  deleteMeal,
  createMeal,
} from "./meal.controller.js";

const router = express.Router();

router.route("/").get(getAllMeals).post(createMeal);

router.route("/:id").get(getOneMeal).patch(updateMeal).delete(deleteMeal);

export default router;
