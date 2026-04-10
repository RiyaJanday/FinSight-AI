import Goal from "../models/Goal.js";

// ── GET all goals ─────────────────────────────────────────────
export const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user._id }).sort("-createdAt");

    // Attach computed fields
    const goalsWithStats = goals.map((g) => {
      const percent      = Math.min(Math.round((g.savedAmount / g.targetAmount) * 100), 100);
      const remaining    = Math.max(g.targetAmount - g.savedAmount, 0);
      const daysLeft     = Math.ceil((new Date(g.deadline) - new Date()) / (1000 * 60 * 60 * 24));
      const isCompleted  = g.savedAmount >= g.targetAmount;
      const isOverdue    = daysLeft < 0 && !isCompleted;

      // Monthly saving needed
      const monthsLeft   = Math.max(Math.ceil(daysLeft / 30), 1);
      const monthlyNeeded = isCompleted ? 0 : Math.ceil(remaining / monthsLeft);

      return {
        ...g.toObject(),
        percent,
        remaining,
        daysLeft,
        isCompleted,
        isOverdue,
        monthlyNeeded,
      };
    });

    // Summary
    const totalGoals     = goals.length;
    const completedGoals = goalsWithStats.filter((g) => g.isCompleted).length;
    const totalSaved     = goals.reduce((s, g) => s + g.savedAmount, 0);
    const totalTarget    = goals.reduce((s, g) => s + g.targetAmount, 0);

    res.json({
      goals: goalsWithStats,
      summary: { totalGoals, completedGoals, totalSaved, totalTarget },
    });
  } catch (err) {
    console.error("Get goals error:", err.message);
    res.status(500).json({ message: "Failed to fetch goals" });
  }
};

// ── POST create goal ──────────────────────────────────────────
export const createGoal = async (req, res) => {
  try {
    const { title, targetAmount, deadline, category, color, icon, notes } = req.body;

    if (!title || !targetAmount || !deadline) {
      return res.status(400).json({ message: "Title, target amount and deadline are required" });
    }

    if (new Date(deadline) <= new Date()) {
      return res.status(400).json({ message: "Deadline must be a future date" });
    }

    const goal = await Goal.create({
      userId: req.user._id,
      title,
      targetAmount: parseFloat(targetAmount),
      deadline:     new Date(deadline),
      category:     category  || "Other",
      color:        color     || "#3b82f6",
      icon:         icon      || "🎯",
      notes:        notes     || "",
    });

    res.status(201).json({ message: "Goal created", goal });
  } catch (err) {
    console.error("Create goal error:", err.message);
    res.status(500).json({ message: "Failed to create goal" });
  }
};

// ── PUT add contribution ──────────────────────────────────────
export const addContribution = async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id:    req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    const { amount } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ message: "Valid amount is required" });
    }

    goal.savedAmount = Math.min(
      goal.savedAmount + parseFloat(amount),
      goal.targetAmount
    );

    if (goal.savedAmount >= goal.targetAmount) {
      goal.isCompleted = true;
    }

    await goal.save();
    res.json({ message: "Contribution added", goal });
  } catch (err) {
    console.error("Add contribution error:", err.message);
    res.status(500).json({ message: "Failed to add contribution" });
  }
};

// ── PUT update goal ───────────────────────────────────────────
export const updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id:    req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    const { title, targetAmount, deadline, category, color, icon, notes } = req.body;

    if (title)        goal.title        = title;
    if (targetAmount) goal.targetAmount = parseFloat(targetAmount);
    if (deadline)     goal.deadline     = new Date(deadline);
    if (category)     goal.category     = category;
    if (color)        goal.color        = color;
    if (icon)         goal.icon         = icon;
    if (notes)        goal.notes        = notes;

    await goal.save();
    res.json({ message: "Goal updated", goal });
  } catch (err) {
    console.error("Update goal error:", err.message);
    res.status(500).json({ message: "Failed to update goal" });
  }
};

// ── DELETE goal ───────────────────────────────────────────────
export const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({
      _id:    req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    res.json({ message: "Goal deleted" });
  } catch (err) {
    console.error("Delete goal error:", err.message);
    res.status(500).json({ message: "Failed to delete goal" });
  }
};