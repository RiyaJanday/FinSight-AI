import express from "express";
import {
  register,
  verifyRegisterOTP,
  login,
  verifyLoginOTP,
  resendOTP,
  refreshToken,
  logout,
  getMe,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authLimiter, otpLimiter } from "../middleware/authMiddleware.js";

const router = express.Router();

// ── Public routes ─────────────────────────────────────────────
router.post("/register",             authLimiter, register);
router.post("/verify-register-otp",  otpLimiter,  verifyRegisterOTP);
router.post("/login",                authLimiter, login);
router.post("/verify-login-otp",     otpLimiter,  verifyLoginOTP);
router.post("/resend-otp",           otpLimiter,  resendOTP);
router.post("/refresh-token",                     refreshToken);
router.post("/logout",                            logout);

// ── Protected routes ──────────────────────────────────────────
router.get("/me", protect, getMe);

export default router;

// Profile update
router.put("/profile", protect, async (req, res) => {
  try {
    const { name, phone, currency } = req.body;
    const user = await User.findById(req.user._id);
    if (name)     user.name     = name;
    if (phone)    user.phone    = phone;
    if (currency) user.currency = currency;
    await user.save();
    res.json({ message: "Profile updated", user });
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// Change password
router.put("/change-password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });
    user.password = newPassword;
    await user.save();
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to change password" });
  }
});