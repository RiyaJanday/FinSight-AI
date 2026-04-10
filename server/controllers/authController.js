import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { saveOTP, verifyOTP } from "../services/otpService.js";
import { sendOTPEmail } from "../services/emailService.js";

// ── Generate Tokens ───────────────────────────────────────────
const generateAccessToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
  );
};

// ── @route   POST /api/auth/register ─────────────────────────
// ── @access  Public ──────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      return res.status(409).json({ message: "Email already registered. Please login." });
    }

    // If user exists but not verified — delete and re-register
    if (existingUser && !existingUser.isVerified) {
      await User.deleteOne({ email });
    }

    // Create user
    const user = await User.create({ name, email, password });

    // Generate and send OTP
    const otp = await saveOTP(email, "register");
    await sendOTPEmail(email, otp, "register");

    // In development — print OTP to console
    if (process.env.NODE_ENV === "development") {
      console.log(`\n🔐 REGISTER OTP for ${email}: ${otp}\n`);
    }

    res.status(201).json({
      message: "Registration successful. Please verify your email with the OTP sent.",
      email,
    });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ message: "Server error during registration." });
  }
};

// ── @route   POST /api/auth/verify-register-otp ──────────────
// ── @access  Public ──────────────────────────────────────────
export const verifyRegisterOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    // Verify OTP
    const result = await verifyOTP(email, otp, "register");
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    // Mark user as verified
    // Replace with:
const user = await User.findOneAndUpdate(
  { email },
  { isVerified: true },
  { returnDocument: "after" }
);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Generate tokens
    const accessToken  = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      message: "Email verified successfully. Welcome to FinSight AI!",
      accessToken,
      refreshToken,
      user,
    });
  } catch (err) {
    console.error("Verify register OTP error:", err.message);
    res.status(500).json({ message: "Server error during OTP verification." });
  }
};

// ── @route   POST /api/auth/login ─────────────────────────────
// ── @access  Public ──────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // Find user
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Check if account is locked
    if (user.isLocked()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({
        message: `Account locked. Try again in ${minutesLeft} minute(s).`,
      });
    }

    // Check if verified
    if (!user.isVerified) {
      return res.status(403).json({
        message: "Email not verified. Please complete registration.",
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementLoginAttempts();
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Reset login attempts on success
    await user.resetLoginAttempts();

    // Generate and send login OTP
    const otp = await saveOTP(email, "login");
    await sendOTPEmail(email, otp, "login");

    if (process.env.NODE_ENV === "development") {
      console.log(`\n🔐 LOGIN OTP for ${email}: ${otp}\n`);
    }

    res.status(200).json({
      message: "Password verified. OTP sent to your email.",
      email,
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Server error during login." });
  }
};

// ── @route   POST /api/auth/verify-login-otp ─────────────────
// ── @access  Public ──────────────────────────────────────────
export const verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    // Verify OTP
    const result = await verifyOTP(email, otp, "login");
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    // Get user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Generate tokens
    const accessToken  = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    user.lastLogin    = new Date();
    await user.save();

    res.status(200).json({
      message: "Login successful. Welcome back!",
      accessToken,
      refreshToken,
      user,
    });
  } catch (err) {
    console.error("Verify login OTP error:", err.message);
    res.status(500).json({ message: "Server error during OTP verification." });
  }
};

// ── @route   POST /api/auth/resend-otp ───────────────────────
// ── @access  Public ──────────────────────────────────────────
export const resendOTP = async (req, res) => {
  try {
    const { email, type } = req.body;

    if (!email || !type) {
      return res.status(400).json({ message: "Email and type are required." });
    }

    const validTypes = ["login", "register", "reset_password"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: "Invalid OTP type." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const otp = await saveOTP(email, type);
    await sendOTPEmail(email, otp, type);

    if (process.env.NODE_ENV === "development") {
      console.log(`\n🔐 RESEND OTP for ${email}: ${otp}\n`);
    }

    res.status(200).json({ message: "OTP resent successfully." });
  } catch (err) {
    console.error("Resend OTP error:", err.message);
    res.status(500).json({ message: "Server error during OTP resend." });
  }
};

// ── @route   POST /api/auth/refresh-token ────────────────────
// ── @access  Public ──────────────────────────────────────────
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required." });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Find user with this refresh token
    const user = await User.findOne({
      _id: decoded.id,
      refreshToken,
    });

    if (!user) {
      return res.status(403).json({ message: "Invalid refresh token." });
    }

    // Generate new tokens
    const newAccessToken  = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Rotate refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    res.status(200).json({
      accessToken:  newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    console.error("Refresh token error:", err.message);
    res.status(403).json({ message: "Invalid or expired refresh token." });
  }
};

// ── @route   POST /api/auth/logout ───────────────────────────
// ── @access  Private ─────────────────────────────────────────
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await User.findOneAndUpdate(
        { refreshToken },
        { refreshToken: null }
      );
    }

    res.status(200).json({ message: "Logged out successfully." });
  } catch (err) {
    console.error("Logout error:", err.message);
    res.status(500).json({ message: "Server error during logout." });
  }
};

// ── @route   GET /api/auth/me ─────────────────────────────────
// ── @access  Private ─────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    res.status(200).json({ user });
  } catch (err) {
    console.error("Get me error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
};