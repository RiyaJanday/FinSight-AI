import mongoose from "mongoose";

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Goal title is required"],
      trim: true,
    },
    targetAmount: {
      type: Number,
      required: [true, "Target amount is required"],
      min: [1, "Target must be greater than 0"],
    },
    savedAmount: {
      type: Number,
      default: 0,
    },
    deadline: {
      type: Date,
      required: true,
    },
    category: {
      type: String,
      enum: ["Emergency Fund", "Vacation", "Car", "Home", "Education", "Investment", "Wedding", "Other"],
      default: "Other",
    },
    color: {
      type: String,
      default: "#3b82f6",
    },
    icon: {
      type: String,
      default: "🎯",
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Goal", goalSchema);