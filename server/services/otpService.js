import crypto from "crypto";
import bcrypt from "bcryptjs";
import OTP from "../models/OTP.js";

// ── Generate a 6 digit OTP ────────────────────────────────────
export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// ── Save OTP to database (hashed) ────────────────────────────
export const saveOTP = async (email, type) => {
  // Delete any existing OTP for this email + type
  await OTP.deleteMany({ email, type });

  const otp = generateOTP();
  const salt = await bcrypt.genSalt(10);
  const hashedOtp = await bcrypt.hash(otp, salt);

  const expiresAt = new Date(
    Date.now() + (parseInt(process.env.OTP_EXPIRES_MINUTES) || 10) * 60 * 1000
  );

  await OTP.create({
    email,
    otp: hashedOtp,
    type,
    expiresAt,
  });

  // Return plain OTP to send to user
  return otp;
};

// ── Verify OTP ────────────────────────────────────────────────
export const verifyOTP = async (email, enteredOtp, type) => {
  const otpRecord = await OTP.findOne({
    email,
    type,
    isUsed: false,
  }).sort({ createdAt: -1 });

  // No OTP found
  if (!otpRecord) {
    return { success: false, message: "OTP not found. Please request a new one." };
  }

  // Check if expired
  if (otpRecord.isExpired()) {
    await OTP.deleteOne({ _id: otpRecord._id });
    return { success: false, message: "OTP has expired. Please request a new one." };
  }

  // Check max attempts
  if (otpRecord.isMaxAttemptsReached()) {
    await OTP.deleteOne({ _id: otpRecord._id });
    return { success: false, message: "Too many wrong attempts. Please request a new OTP." };
  }

  // Compare OTP
  const isMatch = await bcrypt.compare(enteredOtp, otpRecord.otp);

  if (!isMatch) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    const remaining = 3 - otpRecord.attempts;
    return {
      success: false,
      message: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
    };
  }

  // Mark as used
  otpRecord.isUsed = true;
  await otpRecord.save();

  return { success: true, message: "OTP verified successfully." };
};