import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config();

console.log("✅ ENV CHECK → MONGO_URI");
console.log("✅ ENV CHECK → PORT");

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import { connectDB } from "./config/db.js";
import { verifyMailer } from "./config/nodemailer.js";
import authRoutes from "./routes/auth.js";
import transactionRoutes from "./routes/transactions.js";
import budgetRoutes from "./routes/budget.js";
import goalRoutes from "./routes/goals.js";
import accountRoutes from "./routes/accounts.js";
import aiRoutes      from "./routes/ai.js";
import reportRoutes from "./routes/reports.js";

const app = express();
const httpServer = http.createServer(app);

// ── Socket.io ─────────────────────────────────────────────────
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "https://fin-sight-ai-teal.vercel.app/",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  socket.on("join_room", (userId) => socket.join(userId));
  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// ── Middleware (must come BEFORE routes) ──────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "https://fin-sight-ai-teal.vercel.app/",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/ai",       aiRoutes);
app.use("/api/reports", reportRoutes);

// ── Health Check ──────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    mongo: process.env.MONGO_URI ? "uri loaded ✅" : "uri missing ❌",
    timestamp: new Date().toISOString(),
  });
});

// ── Global Error Handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

// ── Start Server ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB()
  .then(async () => {
    try {
      await verifyMailer();
    } catch (err) {
      console.log("Mailer failed, continuing...", err.message);
    }

    httpServer.listen(PORT, () => {
      console.log(`🚀 FinSight AI Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ DB Connection Failed:", err.message);
    process.exit(1);
  });