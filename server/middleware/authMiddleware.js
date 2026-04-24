import jwt from "jsonwebtoken";
import User from "../models/User.js";
import rateLimit from "express-rate-limit";

export const protect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User no longer exists." });
    }

    if (user.isLocked()) {
      return res.status(423).json({ message: "Account is temporarily locked." });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired.", code: "TOKEN_EXPIRED" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token.", code: "TOKEN_INVALID" });
    }
    console.error("Auth middleware error:", err.message);
    res.status(500).json({ message: "Server error in auth middleware." });
  }
};

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  validate: { xForwardedForHeader: false },
  message: { message: "Too many requests. Try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders:   false,
});

export const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  validate: { xForwardedForHeader: false },
  message: { message: "Too many OTP requests. Wait 5 minutes." },
  standardHeaders: true,
  legacyHeaders:   false,
});