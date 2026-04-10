import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    merchant: {
      type: String,
      required: [true, "Merchant is required"],
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Food & Dining", "Transportation", "Shopping",
        "Entertainment", "Utilities", "Health",
        "Income", "Investment", "Others",
      ],
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    account: {
      type: String,
      default: "Primary",
    },
    status: {
      type: String,
      enum: ["Completed", "Pending", "Failed"],
      default: "Completed",
    },
    notes: {
      type: String,
      default: "",
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);