import mongoose from "mongoose";

export const connectDB = async () => {
  let retries = 5;

  while (retries) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI);

      console.log(`MongoDB connected: ${conn.connection.host}`);

      mongoose.connection.on("error", (err) => {
        console.error("MongoDB runtime error:", err.message);
      });

      mongoose.connection.on("disconnected", () => {
        console.warn("MongoDB disconnected. Attempting reconnect...");
      });

      return;

    } catch (err) {
      retries--;
      console.error(`MongoDB connection failed. Retries left: ${retries}`);
      console.error(err.message);

      if (retries === 0) {
        console.error("All retries exhausted. Shutting down.");
        process.exit(1);
      }

      await new Promise((res) => setTimeout(res, 3000));
    }
  }
};