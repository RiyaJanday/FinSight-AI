import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
dotenv.config({ path: join(__dirname, ".env") });

import User        from "./models/User.js";
import Transaction from "./models/Transaction.js";
import Budget      from "./models/Budget.js";
import Goal        from "./models/Goal.js";
import Account     from "./models/Account.js";

const YOUR_EMAIL = "riyajanday19@gmail.com"; // ← your registered email

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");

  // Find your user
  const user = await User.findOne({ email: YOUR_EMAIL });
  if (!user) {
    console.error("❌ User not found. Register first then run this script.");
    process.exit(1);
  }

  const userId = user._id;
  console.log(`✅ Found user: ${user.name}`);

  // ── Clear existing data for this user ──────────────────────
  await Transaction.deleteMany({ userId });
  await Budget.deleteMany({ userId });
  await Goal.deleteMany({ userId });
  await Account.deleteMany({ userId });
  console.log("🗑 Cleared existing data");

  // ── Accounts ───────────────────────────────────────────────
  await Account.insertMany([
    {
      userId,
      name:        "HDFC Savings Account",
      type:        "savings",
      balance:     988000,
      currency:    "INR",
      mask:        "5678",
      color:       "#22c55e",
      institution: "HDFC Bank",
    },
    {
      userId,
      name:        "SBI Checking Account",
      type:        "checking",
      balance:     433640,
      currency:    "INR",
      mask:        "1234",
      color:       "#3b82f6",
      institution: "State Bank of India",
    },
    {
      userId,
      name:        "ICICI Credit Card",
      type:        "credit",
      balance:     100000,
      creditLimit: 400000,
      currency:    "INR",
      mask:        "9012",
      color:       "#a855f7",
      institution: "ICICI Bank",
    },
  ]);
  console.log("✅ Accounts seeded");

  // ── Transactions ───────────────────────────────────────────
  const now   = new Date();
  const month = (offset = 0) => new Date(now.getFullYear(), now.getMonth() - offset, 1);

  const transactions = [
    // ── This month ──────────────────────────────────────────
    { userId, merchant: "Salary Credit",        category: "Income",          amount:  85000,  type: "income",   date: new Date(now.getFullYear(), now.getMonth(), 1),  account: "HDFC Savings Account",  status: "Completed" },
    { userId, merchant: "Freelance Payment",    category: "Income",          amount:  25000,  type: "income",   date: new Date(now.getFullYear(), now.getMonth(), 5),  account: "HDFC Savings Account",  status: "Completed" },
    { userId, merchant: "Zomato Order",         category: "Food & Dining",   amount: -850,    type: "expense",  date: new Date(now.getFullYear(), now.getMonth(), 3),  account: "ICICI Credit Card",     status: "Completed" },
    { userId, merchant: "Swiggy Delivery",      category: "Food & Dining",   amount: -640,    type: "expense",  date: new Date(now.getFullYear(), now.getMonth(), 5),  account: "ICICI Credit Card",     status: "Completed" },
    { userId, merchant: "Whole Foods Market",   category: "Food & Dining",   amount: -3200,   type: "expense",  date: new Date(now.getFullYear(), now.getMonth(), 7),  account: "SBI Checking Account",  status: "Completed" },
    { userId, merchant: "Uber Ride",            category: "Transportation",  amount: -320,    type: "expense",  date: new Date(now.getFullYear(), now.getMonth(), 4),  account: "ICICI Credit Card",     status: "Completed" },
    { userId, merchant: "Ola Cab",              category: "Transportation",  amount: -280,    type: "expense",  date: new Date(now.getFullYear(), now.getMonth(), 8),  account: "ICICI Credit Card",     status: "Completed" },
    { userId, merchant: "Petrol Bunk",          category: "Transportation",  amount: -2800,   type: "expense",  date: new Date(now.getFullYear(), now.getMonth(), 6),  account: "SBI Checking Account",  status: "Completed" },
    { userId, merchant: "Amazon Purchase",      category: "Shopping",        amount: -7199,   type: "expense",  date: new Date(now.getFullYear(), now.getMonth(), 9),  account: "ICICI Credit Card",     status: "Pending"   },
    { userId, merchant: "Myntra Order",         category: "Shopping",        amount: -3500,   type: "expense",  date: new Date(now.getFullYear(), now.getMonth(), 10), account: "ICICI Credit Card",     status: "Completed" },
    { userId, merchant: "Netflix Subscription", category: "Entertainment",   amount: -649,    type: "expense",  date: new Date(now.getFullYear(), now.getMonth(), 1),  account: "ICICI Credit Card",     status: "Completed" },
    { userId, merchant: "Spotify Premium",      category: "Entertainment",   amount: -119,    type: "expense",  date: new Date(now.getFullYear(), now.getMonth(), 1),  account: "ICICI Credit Card",     status: "Completed" },
    { userId, merchant: "Electricity Bill",     category: "Utilities",       amount: -3200,   type: "expense",  date: new Date(now.getFullYear(), now.getMonth(), 5),  account: "SBI Checking Account",  status: "Completed" },
    { userId, merchant: "Water Bill",           category: "Utilities",       amount: -800,    type: "expense",  date: new Date(now.getFullYear(), now.getMonth(), 5),  account: "SBI Checking Account",  status: "Completed" },
    { userId, merchant: "Internet Bill",        category: "Utilities",       amount: -999,    type: "expense",  date: new Date(now.getFullYear(), now.getMonth(), 3),  account: "SBI Checking Account",  status: "Completed" },
    { userId, merchant: "Apollo Pharmacy",      category: "Health",          amount: -1200,   type: "expense",  date: new Date(now.getFullYear(), now.getMonth(), 8),  account: "SBI Checking Account",  status: "Completed" },
    { userId, merchant: "Gym Membership",       category: "Health",          amount: -2000,   type: "expense",  date: new Date(now.getFullYear(), now.getMonth(), 1),  account: "SBI Checking Account",  status: "Completed" },

    // ── Last month ──────────────────────────────────────────
    { userId, merchant: "Salary Credit",        category: "Income",          amount:  85000,  type: "income",   date: new Date(now.getFullYear(), now.getMonth() - 1, 1),  account: "HDFC Savings Account",  status: "Completed" },
    { userId, merchant: "Dividend Income",      category: "Income",          amount:  12000,  type: "income",   date: new Date(now.getFullYear(), now.getMonth() - 1, 15), account: "HDFC Savings Account",  status: "Completed" },
    { userId, merchant: "Dominos Pizza",        category: "Food & Dining",   amount: -760,    type: "expense",  date: new Date(now.getFullYear(), now.getMonth() - 1, 5),  account: "ICICI Credit Card",     status: "Completed" },
    { userId, merchant: "BigBasket Order",      category: "Food & Dining",   amount: -2800,   type: "expense",  date: new Date(now.getFullYear(), now.getMonth() - 1, 10), account: "SBI Checking Account",  status: "Completed" },
    { userId, merchant: "Metro Card Recharge",  category: "Transportation",  amount: -500,    type: "expense",  date: new Date(now.getFullYear(), now.getMonth() - 1, 3),  account: "SBI Checking Account",  status: "Completed" },
    { userId, merchant: "Rapido Bike",          category: "Transportation",  amount: -180,    type: "expense",  date: new Date(now.getFullYear(), now.getMonth() - 1, 7),  account: "ICICI Credit Card",     status: "Completed" },
    { userId, merchant: "Flipkart Sale",        category: "Shopping",        amount: -5499,   type: "expense",  date: new Date(now.getFullYear(), now.getMonth() - 1, 12), account: "ICICI Credit Card",     status: "Completed" },
    { userId, merchant: "BookMyShow",           category: "Entertainment",   amount: -850,    type: "expense",  date: new Date(now.getFullYear(), now.getMonth() - 1, 20), account: "ICICI Credit Card",     status: "Completed" },
    { userId, merchant: "Gas Bill",             category: "Utilities",       amount: -750,    type: "expense",  date: new Date(now.getFullYear(), now.getMonth() - 1, 8),  account: "SBI Checking Account",  status: "Completed" },
    { userId, merchant: "Electricity Bill",     category: "Utilities",       amount: -2900,   type: "expense",  date: new Date(now.getFullYear(), now.getMonth() - 1, 6),  account: "SBI Checking Account",  status: "Completed" },
    { userId, merchant: "Dr. Consultation",     category: "Health",          amount: -800,    type: "expense",  date: new Date(now.getFullYear(), now.getMonth() - 1, 14), account: "SBI Checking Account",  status: "Completed" },

    // ── 2 months ago ──────────────────────────────────────────
    { userId, merchant: "Salary Credit",        category: "Income",          amount:  85000,  type: "income",   date: new Date(now.getFullYear(), now.getMonth() - 2, 1),  account: "HDFC Savings Account",  status: "Completed" },
    { userId, merchant: "Consulting Fee",       category: "Income",          amount:  15000,  type: "income",   date: new Date(now.getFullYear(), now.getMonth() - 2, 20), account: "HDFC Savings Account",  status: "Completed" },
    { userId, merchant: "Restaurant Dinner",    category: "Food & Dining",   amount: -2400,   type: "expense",  date: new Date(now.getFullYear(), now.getMonth() - 2, 8),  account: "ICICI Credit Card",     status: "Completed" },
    { userId, merchant: "Grocery Store",        category: "Food & Dining",   amount: -3100,   type: "expense",  date: new Date(now.getFullYear(), now.getMonth() - 2, 15), account: "SBI Checking Account",  status: "Completed" },
    { userId, merchant: "Flight Ticket",        category: "Transportation",  amount: -8500,   type: "expense",  date: new Date(now.getFullYear(), now.getMonth() - 2, 5),  account: "ICICI Credit Card",     status: "Completed" },
    { userId, merchant: "Nykaa Shopping",       category: "Shopping",        amount: -2200,   type: "expense",  date: new Date(now.getFullYear(), now.getMonth() - 2, 18), account: "ICICI Credit Card",     status: "Completed" },
    { userId, merchant: "Prime Video",          category: "Entertainment",   amount: -1499,   type: "expense",  date: new Date(now.getFullYear(), now.getMonth() - 2, 1),  account: "ICICI Credit Card",     status: "Completed" },
    { userId, merchant: "Phone Bill",           category: "Utilities",       amount: -599,    type: "expense",  date: new Date(now.getFullYear(), now.getMonth() - 2, 10), account: "SBI Checking Account",  status: "Completed" },
    { userId, merchant: "Electricity Bill",     category: "Utilities",       amount: -3100,   type: "expense",  date: new Date(now.getFullYear(), now.getMonth() - 2, 7),  account: "SBI Checking Account",  status: "Completed" },
  ];

  await Transaction.insertMany(transactions);
  console.log(`✅ ${transactions.length} transactions seeded`);

  // ── Budgets (current month) ────────────────────────────────
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  await Budget.insertMany([
    { userId, category: "Food & Dining",  limit: 10000, month: currentMonth, color: "#3b82f6" },
    { userId, category: "Transportation", limit: 5000,  month: currentMonth, color: "#22c55e" },
    { userId, category: "Shopping",       limit: 8000,  month: currentMonth, color: "#a855f7" },
    { userId, category: "Entertainment",  limit: 2000,  month: currentMonth, color: "#f59e0b" },
    { userId, category: "Utilities",      limit: 6000,  month: currentMonth, color: "#ef4444" },
    { userId, category: "Health",         limit: 5000,  month: currentMonth, color: "#14b8a6" },
  ]);
  console.log("✅ Budgets seeded");

  // ── Goals ──────────────────────────────────────────────────
  await Goal.insertMany([
    {
      userId,
      title:        "Emergency Fund",
      targetAmount: 300000,
      savedAmount:  185000,
      deadline:     new Date(now.getFullYear(), now.getMonth() + 8, 1),
      category:     "Emergency Fund",
      color:        "#3b82f6",
      icon:         "🛡",
    },
    {
      userId,
      title:        "Goa Vacation",
      targetAmount: 50000,
      savedAmount:  32000,
      deadline:     new Date(now.getFullYear(), now.getMonth() + 3, 1),
      category:     "Vacation",
      color:        "#22c55e",
      icon:         "✈",
    },
    {
      userId,
      title:        "New Laptop",
      targetAmount: 80000,
      savedAmount:  80000,
      deadline:     new Date(now.getFullYear(), now.getMonth() - 1, 1),
      category:     "Other",
      color:        "#a855f7",
      icon:         "💻",
      isCompleted:  true,
    },
    {
      userId,
      title:        "Home Down Payment",
      targetAmount: 1000000,
      savedAmount:  250000,
      deadline:     new Date(now.getFullYear() + 2, now.getMonth(), 1),
      category:     "Home",
      color:        "#f59e0b",
      icon:         "🏠",
    },
  ]);
  console.log("✅ Goals seeded");

  console.log("\n🎉 Demo data seeded successfully!");
  console.log(`👤 Login with: ${YOUR_EMAIL}`);
  console.log("🔑 Use your registered password");
  process.exit(0);
};

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});