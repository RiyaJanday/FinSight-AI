import Transaction from "../models/Transaction.js";

// ── GET all transactions (with filter, search, pagination) ────
export const getTransactions = async (req, res) => {
  try {
    const {
      search, category, type,
      startDate, endDate,
      page = 1, limit = 20,
      sort = "-date",
    } = req.query;

    const query = { userId: req.user._id };

    if (search) {
      query.merchant = { $regex: search, $options: "i" };
    }
    if (category && category !== "All") {
      query.category = category;
    }
    if (type && type !== "All") {
      query.type = type;
    }
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate)   query.date.$lte = new Date(endDate);
    }

    const total        = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Summary stats
    const allTx     = await Transaction.find({ userId: req.user._id });
    const income    = allTx.filter(t => t.type === "income") .reduce((s, t) => s + t.amount, 0);
    const expense   = allTx.filter(t => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0);

    res.json({
      transactions,
      summary: { income, expense, net: income - expense },
      pagination: {
        total,
        page:       parseInt(page),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Get transactions error:", err.message);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
};

// ── POST create transaction ───────────────────────────────────
export const createTransaction = async (req, res) => {
  try {
    const { merchant, category, amount, type, date, account, notes, status, isRecurring } = req.body;

    if (!merchant || !category || !amount || !type) {
      return res.status(400).json({ message: "merchant, category, amount and type are required." });
    }

    const finalAmount = type === "expense"
      ? -Math.abs(parseFloat(amount))
      :  Math.abs(parseFloat(amount));

    const transaction = await Transaction.create({
      userId: req.user._id,
      merchant,
      category,
      amount: finalAmount,
      type,
      date:        date        || Date.now(),
      account:     account     || "Primary",
      notes:       notes       || "",
      status:      status      || "Completed",
      isRecurring: isRecurring || false,
    });

    res.status(201).json({ message: "Transaction created", transaction });
  } catch (err) {
    console.error("Create transaction error:", err.message);
    res.status(500).json({ message: "Failed to create transaction" });
  }
};

// ── PUT update transaction ────────────────────────────────────
export const updateTransaction = async (req, res) => {
  try {
    const tx = await Transaction.findOne({
      _id:    req.params.id,
      userId: req.user._id,
    });

    if (!tx) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    const { merchant, category, amount, type, date, account, notes, status } = req.body;

    if (merchant) tx.merchant = merchant;
    if (category) tx.category = category;
    if (type)     tx.type     = type;
    if (date)     tx.date     = date;
    if (account)  tx.account  = account;
    if (notes)    tx.notes    = notes;
    if (status)   tx.status   = status;

    if (amount && type) {
      tx.amount = type === "expense"
        ? -Math.abs(parseFloat(amount))
        :  Math.abs(parseFloat(amount));
    }

    await tx.save();
    res.json({ message: "Transaction updated", transaction: tx });
  } catch (err) {
    console.error("Update transaction error:", err.message);
    res.status(500).json({ message: "Failed to update transaction" });
  }
};

// ── DELETE transaction ────────────────────────────────────────
export const deleteTransaction = async (req, res) => {
  try {
    const tx = await Transaction.findOneAndDelete({
      _id:    req.params.id,
      userId: req.user._id,
    });

    if (!tx) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json({ message: "Transaction deleted" });
  } catch (err) {
    console.error("Delete transaction error:", err.message);
    res.status(500).json({ message: "Failed to delete transaction" });
  }
};

// ── GET dashboard summary ─────────────────────────────────────
export const getDashboardStats = async (req, res) => {
  try {
    const now       = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const allTx      = await Transaction.find({ userId: req.user._id });
    const monthlyTx  = allTx.filter(t => new Date(t.date) >= startMonth);

    // Total balance
    const totalBalance = allTx.reduce((s, t) => s + t.amount, 0);

    // Monthly income & expense
    const monthlyIncome   = monthlyTx.filter(t => t.type === "income") .reduce((s, t) => s + t.amount, 0);
    const monthlyExpenses = monthlyTx.filter(t => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0);

    // Savings rate
    const savingsRate = monthlyIncome > 0
      ? (((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100).toFixed(1)
      : 0;

    // Spending by category (this month)
    const categoryMap = {};
    monthlyTx.filter(t => t.type === "expense").forEach((t) => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + Math.abs(t.amount);
    });
    const spendingByCategory = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

    // Monthly bar chart (last 6 months)
    const barData = [];
    for (let i = 5; i >= 0; i--) {
      const d     = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const label = d.toLocaleString("default", { month: "short" });
      const mTx   = allTx.filter(t => new Date(t.date) >= d && new Date(t.date) <= end);
      barData.push({
        month:   label,
        Income:  mTx.filter(t => t.type === "income") .reduce((s, t) => s + t.amount, 0),
        Expense: mTx.filter(t => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0),
      });
    }

    // Recent 5 transactions
    const recent = await Transaction.find({ userId: req.user._id })
      .sort("-date").limit(5);

    res.json({
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      savingsRate,
      spendingByCategory,
      barData,
      recentTransactions: recent,
    });
  } catch (err) {
    console.error("Dashboard stats error:", err.message);
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
};