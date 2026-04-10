import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Food & Dining", "Transportation", "Shopping",
        "Entertainment", "Utilities", "Health", "Others",
      ],
    },
    limit: {
      type: Number,
      required: [true, "Budget limit is required"],
      min: [1, "Limit must be greater than 0"],
    },
    month: {
      type: String,
      required: true,
    },
    alertSent: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      default: "#3b82f6",
    },
  },
  { timestamps: true }
);

// One budget per category per month per user
budgetSchema.index({ userId: 1, category: 1, month: 1 }, { unique: true });

export default mongoose.model("Budget", budgetSchema);