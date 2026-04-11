import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
dotenv.config({ path: join(__dirname, ".env") });

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import { connectDB }   from "./config/db.js";
import { verifyMailer } from "./config/nodemailer.js";
import authRoutes        from "./routes/auth.js";
import transactionRoutes from "./routes/transactions.js";
import budgetRoutes      from "./routes/budget.js";
import goalRoutes        from "./routes/goals.js";
import accountRoutes     from "./routes/accounts.js";
import aiRoutes          from "./routes/ai.js";
import reportRoutes      from "./routes/reports.js";

const app        = express();
const httpServer = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://fin-sight-ai-teal.vercel.app",
  "https://fin-sight-ai-git-main-riyajandays-projects.vercel.app",
  "https://fin-sight-r4axukm83-riyajandays-projects.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("CORS blocked:", origin);
      callback(null, true); // allow all for now during testing
    }
  },
  credentials: true,
};

export const io = new Server(httpServer, {
  cors: corsOptions,
});

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  socket.on("join_room", (userId) => socket.join(userId));
  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth",         authRoutes);
app.use("/api/transactions",  transactionRoutes);
app.use("/api/budget",        budgetRoutes);
app.use("/api/goals",         goalRoutes);
app.use("/api/accounts",      accountRoutes);
app.use("/api/ai",            aiRoutes);
app.use("/api/reports",       reportRoutes);

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

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  try { await verifyMailer(); } catch (err) {
    console.log("Mailer failed, continuing...", err.message);
  }
  httpServer.listen(PORT, () => {
    console.log(`🚀 FinSight AI Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error("❌ DB Connection Failed:", err.message);
  process.exit(1);
});