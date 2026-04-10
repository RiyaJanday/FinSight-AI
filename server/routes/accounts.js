import express from "express";
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
} from "../controllers/accountController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/",       getAccounts);
router.post("/",      createAccount);
router.put("/:id",    updateAccount);
router.delete("/:id", deleteAccount);

export default router;