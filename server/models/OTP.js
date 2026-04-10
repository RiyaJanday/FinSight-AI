import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["login", "register", "reset_password"],
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// ── Auto delete expired OTPs ──────────────────────────────────
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ── Check if OTP is expired ───────────────────────────────────
otpSchema.methods.isExpired = function () {
  return new Date() > this.expiresAt;
};

// ── Check if too many attempts ────────────────────────────────
otpSchema.methods.isMaxAttemptsReached = function () {
  return this.attempts >= 3;
};

export default mongoose.model("OTP", otpSchema);