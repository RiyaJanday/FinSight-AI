import Transaction from "../models/Transaction.js";
import {
  generateInsights,
  generateForecast,
  categorizeTransaction,
} from "../services/aiService.js";

// ── GET AI insights ───────────────────────────────────────────
export const getInsights = async (req, res) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({ message: "AI service not configured" });
    }

    // Get user's financial data
    const now        = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const allTx      = await Transaction.find({ userId: req.user._id });
    const monthlyTx  = allTx.filter(t => new Date(t.date) >= startMonth);

    const totalBalance    = allTx.reduce((s, t) => s + t.amount, 0);
    const monthlyIncome   = monthlyTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const monthlyExpenses = monthlyTx.filter(t => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0);
    const savingsRate     = monthlyIncome > 0
      ? (((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100).toFixed(1)
      : 0;

    const categoryMap = {};
    monthlyTx.filter(t => t.type === "expense").forEach((t) => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + Math.abs(t.amount);
    });
    const spendingByCategory = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

    const recentTransactions = allTx
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    const insights = await generateInsights({
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      savingsRate,
      spendingByCategory,
      recentTransactions,
    });

    res.json({ insights });
  } catch (err) {
    console.error("AI insights error:", err.message);
    res.status(500).json({ message: "Failed to generate insights" });
  }
};

// ── GET spending forecast ─────────────────────────────────────
export const getForecast = async (req, res) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({ message: "AI service not configured" });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const transactions  = await Transaction.find({
      userId: req.user._id,
      date:   { $gte: thirtyDaysAgo },
      type:   "expense",
    }).sort("-date");

    if (transactions.length === 0) {
      return res.json({
        forecast: [],
        totalPredicted: 0,
        summary: "Add more transactions to generate a forecast.",
      });
    }

    const forecast = await generateForecast(transactions);
    res.json(forecast);
  } catch (err) {
    console.error("AI forecast error:", err.message);
    res.status(500).json({ message: "Failed to generate forecast" });
  }
};

// ── POST auto-categorize transaction ─────────────────────────
export const autoCategorize = async (req, res) => {
  try {
    const { merchant } = req.body;
    if (!merchant) {
      return res.status(400).json({ message: "Merchant name required" });
    }

    const category = await categorizeTransaction(merchant);
    res.json({ category });
  } catch (err) {
    console.error("Auto-categorize error:", err.message);
    res.status(500).json({ message: "Failed to categorize" });
  }
};