import express from "express";
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getDashboardStats,
} from "../controllers/transactionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect); // all routes protected

router.get("/dashboard-stats", getDashboardStats);
router.get("/",                getTransactions);
router.post("/",               createTransaction);
router.put("/:id",             updateTransaction);
router.delete("/:id",          deleteTransaction);

export default router;