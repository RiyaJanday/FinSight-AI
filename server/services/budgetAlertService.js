import Budget from "../models/Budget.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import { sendBudgetAlertEmail } from "./emailService.js";

export const checkBudgetAlerts = async (io) => {
  try {
    const now        = new Date();
    const month      = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const startDate  = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate    = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Get all budgets for this month that haven't sent alert
    const budgets = await Budget.find({ month, alertSent: false });

    for (const budget of budgets) {
      // Get spending for this category this month
      const transactions = await Transaction.find({
        userId:   budget.userId,
        category: budget.category,
        type:     "expense",
        date:     { $gte: startDate, $lte: endDate },
      });

      const spent   = transactions.reduce((s, t) => s + Math.abs(t.amount), 0);
      const percent = Math.round((spent / budget.limit) * 100);

      // Alert at 80% and 100%
      if (percent >= 80) {
        const user = await User.findById(budget.userId);
        if (!user) continue;

        // Send email
        await sendBudgetAlertEmail(user.email, budget.category, percent);

        // Send real-time socket notification
        if (io) {
          io.to(budget.userId.toString()).emit("budget_alert", {
            category: budget.category,
            percent,
            spent,
            limit:    budget.limit,
            message:  percent >= 100
              ? `You have exceeded your ${budget.category} budget!`
              : `You have used ${percent}% of your ${budget.category} budget.`,
          });
        }

        // Mark alert as sent
        budget.alertSent = true;
        await budget.save();

        console.log(`Budget alert sent: ${user.email} — ${budget.category} at ${percent}%`);
      }
    }
  } catch (err) {
    console.error("Budget alert service error:", err.message);
  }
};