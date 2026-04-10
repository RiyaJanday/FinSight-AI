import express from "express";
import {
  getInsights,
  getForecast,
  autoCategorize,
} from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/insights",      getInsights);
router.get("/forecast",      getForecast);
router.post("/categorize",   autoCategorize);

export default router;