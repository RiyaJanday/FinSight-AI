import express from "express";
import {
  getGoals,
  createGoal,
  addContribution,
  updateGoal,
  deleteGoal,
} from "../controllers/goalController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/",                getGoals);
router.post("/",               createGoal);
router.put("/:id/contribute",  addContribution);
router.put("/:id",             updateGoal);
router.delete("/:id",          deleteGoal);

export default router;