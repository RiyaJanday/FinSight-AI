import express from "express";
import { generateReport } from "../controllers/reportController.js";
import { protect }        from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/", generateReport);

export default router;