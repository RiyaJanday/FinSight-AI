import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["checking", "savings", "credit", "investment", "cash"],
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    mask: {
      type: String,
      default: "0000",
    },
    creditLimit: {
      type: Number,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    color: {
      type: String,
      default: "#3b82f6",
    },
    institution: {
      type: String,
      default: "Manual",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Account", accountSchema);