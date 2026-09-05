import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import errorHandler from "./src/middleware/errorHandler.js";
import authRoutes from "./src/routes/authRoutes.js";
import clientRoutes from "./src/routes/clientRoutes.js";
import sessionRoutes from "./src/routes/sessionRoutes.js";
import sessionNoteRoutes from "./src/routes/sessionNoteRoutes.js";
import availabilityRoutes from "./src/routes/availabilityRoutes.js";
import packageRoutes from "./src/routes/packageRoutes.js";
import clientPackageRoutes from "./src/routes/clientPackageRoutes.js";
import paymentRoutes from "./src/routes/paymentRoutes.js";

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

app.use("/api/auth", authRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/session-notes", sessionNoteRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/client-packages", clientPackageRoutes);
app.use("/api/payments", paymentRoutes);
app.use(errorHandler);

export default app;

