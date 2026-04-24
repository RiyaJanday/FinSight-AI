import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import { connectDB }     from "./config/db.js";
import { verifyMailer }  from "./config/nodemailer.js";
import authRoutes        from "./routes/auth.js";
import transactionRoutes from "./routes/transactions.js";
import budgetRoutes      from "./routes/budget.js";
import goalRoutes        from "./routes/goals.js";
import accountRoutes     from "./routes/accounts.js";
import aiRoutes          from "./routes/ai.js";
import reportRoutes      from "./routes/reports.js";

const app        = express();
const httpServer = http.createServer(app);

app.set("trust proxy", 1);

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
}));

app.options("*", cors());

app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy:   false,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

export const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  socket.on("join_room", (userId) => socket.join(userId));
  socket.on("disconnect", () => console.log(`Socket disconnected: ${socket.id}`));
});

app.use("/api/auth",         authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/budget",       budgetRoutes);
app.use("/api/goals",        goalRoutes);
app.use("/api/accounts",     accountRoutes);
app.use("/api/ai",           aiRoutes);
app.use("/api/reports",      reportRoutes);

app.get("/", (req, res) => {
  res.json({ app: "FinSight AI API", status: "running", version: "1.0.0" });
});

app.get("/api/health", (req, res) => {
  res.json({
    status:    "ok",
    mongo:     process.env.MONGO_URI ? "uri loaded ✅" : "uri missing ❌",
    timestamp: new Date().toISOString(),
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 10000;

connectDB().then(async () => {
  try { await verifyMailer(); } catch (err) {
    console.log("Mailer failed:", err.message);
  }
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 FinSight AI Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error("❌ DB Connection Failed:", err.message);
  process.exit(1);
});