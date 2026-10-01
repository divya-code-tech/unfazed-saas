import chatSocket from "./src/sockets/chatSocket.js";
import { Server } from "socket.io";
import dotenv from "dotenv";
import http from "http";
import app from "./app.js";
import connectDB from "./src/config/db.js";
import { startNotificationScheduler } from "./src/services/notificationScheduler.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);

    const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  },
});

    chatSocket(io);

    startNotificationScheduler();

    server.listen(PORT, () => {
      console.log(`Unfazed API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();