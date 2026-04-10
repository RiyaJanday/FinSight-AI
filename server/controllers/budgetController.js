import Budget from "../models/Budget.js";
import Transaction from "../models/Transaction.js";

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

// ── GET all budgets with real spending ────────────────────────
export const getBudgets = async (req, res) => {
  try {
    const month = req.query.month || getCurrentMonth();
    const [year, mon] = month.split("-").map(Number);

    const startDate = new Date(year, mon - 1, 1);
    const endDate   = new Date(year, mon, 0, 23, 59, 59);

    // Get all budgets for this month
    const budgets = await Budget.find({ userId: req.user._id, month });

    // Get all expense transactions for this month
    const transactions = await Transaction.find({
      userId: req.user._id,
      type:   "expense",
      date:   { $gte: startDate, $lte: endDate },
    });

    // Calculate spent per category
    const spentMap = {};
    transactions.forEach((tx) => {
      spentMap[tx.category] = (spentMap[tx.category] || 0) + Math.abs(tx.amount);
    });

    // Attach spent and percent to each budget
    const budgetsWithSpent = budgets.map((b) => {
      const spent   = spentMap[b.category] || 0;
      const percent = Math.min(Math.round((spent / b.limit) * 100), 100);
      return {
        ...b.toObject(),
        spent,
        percent,
        remaining: Math.max(b.limit - spent, 0),
        isOverspent: spent > b.limit,
      };
    });

    // Total stats
    const totalBudget  = budgets.reduce((s, b) => s + b.limit, 0);
    const totalSpent   = budgetsWithSpent.reduce((s, b) => s + b.spent, 0);
    const totalPercent = totalBudget > 0
      ? Math.round((totalSpent / totalBudget) * 100)
      : 0;

    res.json({
      budgets: budgetsWithSpent,
      summary: { totalBudget, totalSpent, totalPercent, month },
    });
  } catch (err) {
    console.error("Get budgets error:", err.message);
    res.status(500).json({ message: "Failed to fetch budgets" });
  }
};

// ── POST create budget ────────────────────────────────────────
export const createBudget = async (req, res) => {
  try {
    const { category, limit, month, color } = req.body;

    if (!category || !limit) {
      return res.status(400).json({ message: "Category and limit are required" });
    }

    const budgetMonth = month || getCurrentMonth();

    // Check duplicate
    const exists = await Budget.findOne({
      userId:   req.user._id,
      category,
      month:    budgetMonth,
    });

    if (exists) {
      return res.status(409).json({
        message: `Budget for ${category} already exists for this month`,
      });
    }

    const budget = await Budget.create({
      userId:   req.user._id,
      category,
      limit:    parseFloat(limit),
      month:    budgetMonth,
      color:    color || "#3b82f6",
    });

    res.status(201).json({ message: "Budget created", budget });
  } catch (err) {
    console.error("Create budget error:", err.message);
    res.status(500).json({ message: "Failed to create budget" });
  }
};

// ── PUT update budget ─────────────────────────────────────────
export const updateBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id:    req.params.id,
      userId: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    const { limit, color } = req.body;
    if (limit) budget.limit = parseFloat(limit);
    if (color) budget.color = color;
    budget.alertSent = false;

    await budget.save();
    res.json({ message: "Budget updated", budget });
  } catch (err) {
    console.error("Update budget error:", err.message);
    res.status(500).json({ message: "Failed to update budget" });
  }
};

// ── DELETE budget ─────────────────────────────────────────────
export const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id:    req.params.id,
      userId: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    res.json({ message: "Budget deleted" });
  } catch (err) {
    console.error("Delete budget error:", err.message);
    res.status(500).json({ message: "Failed to delete budget" });
  }
};