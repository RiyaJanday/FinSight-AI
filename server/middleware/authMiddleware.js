import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ── Protect routes — verify JWT ───────────────────────────────
export const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        message: "Access denied. No token provided.",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from DB
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        message: "User no longer exists.",
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      return res.status(423).json({
        message: "Account is temporarily locked.",
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expired. Please refresh your token.",
        code: "TOKEN_EXPIRED",
      });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Invalid token.",
        code: "TOKEN_INVALID",
      });
    }
    console.error("Auth middleware error:", err.message);
    res.status(500).json({ message: "Server error in auth middleware." });
  }
};

// ── Rate limiter for auth routes ──────────────────────────────
import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // max 10 requests per window
  message: {
    message: "Too many requests from this IP. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,  // 5 minutes
  max: 3,                    // max 3 OTP requests per 5 min
  message: {
    message: "Too many OTP requests. Please wait 5 minutes before trying again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});