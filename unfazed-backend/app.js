import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import errorHandler from "./src/middleware/errorHandler.js";

dotenv.config();

const app = express();

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Request body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Unfazed API is running",
    timestamp: new Date().toISOString(),
  });
});

app.use(errorHandler);
export default app;
