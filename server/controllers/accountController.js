import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";

// ── GET all accounts ──────────────────────────────────────────
export const getAccounts = async (req, res) => {
  try {
    const accounts = await Account.find({
      userId: req.user._id,
      isActive: true,
    }).sort("-createdAt");

    // Calculate total balance
    const totalBalance = accounts.reduce((s, a) => {
      return a.type === "credit" ? s - a.balance : s + a.balance;
    }, 0);

    // Attach recent transactions count per account
    const accountsWithStats = await Promise.all(
      accounts.map(async (acc) => {
        const txCount = await Transaction.countDocuments({
          userId:  req.user._id,
          account: acc.name,
        });
        return { ...acc.toObject(), txCount };
      })
    );

    res.json({ accounts: accountsWithStats, totalBalance });
  } catch (err) {
    console.error("Get accounts error:", err.message);
    res.status(500).json({ message: "Failed to fetch accounts" });
  }
};

// ── POST create account ───────────────────────────────────────
export const createAccount = async (req, res) => {
  try {
    const { name, type, balance, currency, mask, creditLimit, color, institution } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: "Name and type are required" });
    }

    const account = await Account.create({
      userId:      req.user._id,
      name,
      type,
      balance:     parseFloat(balance)     || 0,
      currency:    currency                || "INR",
      mask:        mask                    || "0000",
      creditLimit: parseFloat(creditLimit) || null,
      color:       color                   || "#3b82f6",
      institution: institution             || "Manual",
    });

    res.status(201).json({ message: "Account created", account });
  } catch (err) {
    console.error("Create account error:", err.message);
    res.status(500).json({ message: "Failed to create account" });
  }
};

// ── PUT update account ────────────────────────────────────────
export const updateAccount = async (req, res) => {
  try {
    const account = await Account.findOne({
      _id:    req.params.id,
      userId: req.user._id,
    });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    const { name, balance, creditLimit, color, institution, mask } = req.body;

    if (name)        account.name        = name;
    if (balance !== undefined) account.balance = parseFloat(balance);
    if (creditLimit) account.creditLimit = parseFloat(creditLimit);
    if (color)       account.color       = color;
    if (institution) account.institution = institution;
    if (mask)        account.mask        = mask;

    await account.save();
    res.json({ message: "Account updated", account });
  } catch (err) {
    console.error("Update account error:", err.message);
    res.status(500).json({ message: "Failed to update account" });
  }
};

// ── DELETE account ────────────────────────────────────────────
export const deleteAccount = async (req, res) => {
  try {
    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isActive: false },
      { new: true }
    );

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.json({ message: "Account deleted" });
  } catch (err) {
    console.error("Delete account error:", err.message);
    res.status(500).json({ message: "Failed to delete account" });
  }
};