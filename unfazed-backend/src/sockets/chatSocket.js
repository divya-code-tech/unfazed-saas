import jwt from "jsonwebtoken";
import Message from "../models/Message.js";
import Client from "../models/Client.js";

const socketAuthMiddleware = (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.user = decoded;

    next();
  } catch (error) {
    next(new Error("Invalid or expired token"));
  }
};

const chatSocket = (io) => {
  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    console.log(`Chat client connected: ${socket.id}`);

    const userRoom = `${socket.user.role}:${socket.user.id}`;

    socket.join(userRoom);

    socket.on("send_message", async (data) => {
      try {
        const { clientId, text } = data;

        let therapistId;
        let client;

        // Therapist is sending the message
        if (socket.user.role === "therapist") {
          therapistId = socket.user.id;

          client = await Client.findById(clientId);

          if (!client) {
            socket.emit("chat_error", {
              message: "Client not found.",
            });
            return;
          }

          if (client.therapist.toString() !== socket.user.id) {
            socket.emit("chat_error", {
              message: "You are not authorized to message this client.",
            });
            return;
          }
        }

        // Client is sending the message
        else if (socket.user.role === "client") {
          client = await Client.findById(socket.user.id);

          if (!client) {
            socket.emit("chat_error", {
              message: "Client not found.",
            });
            return;
          }

          if (client._id.toString() !== clientId) {
            socket.emit("chat_error", {
              message: "You are not authorized to message as this client.",
            });
            return;
          }

          therapistId = client.therapist;
        }

        // Invalid role
        else {
          socket.emit("chat_error", {
            message: "Invalid user role.",
          });
          return;
        }

        // Required field validation
        if (!therapistId || !clientId || !text) {
          socket.emit("chat_error", {
            message: "Missing required message information.",
          });
          return;
        }

        // Save message
        const message = await Message.create({
          therapist: therapistId,
          client: clientId,
          sender: socket.user.id,
          senderRole: socket.user.role,
          text,
        });

        // Send only to the therapist's private room
        io.to(`therapist:${message.therapist}`).emit("receive_message", {
          id: message._id,
          therapistId: message.therapist,
          clientId: message.client,
          senderId: message.sender,
          senderRole: message.senderRole,
          text: message.text,
          createdAt: message.createdAt,
        });

        // Send only to the client's private room
        io.to(`client:${message.client}`).emit("receive_message", {
          id: message._id,
          therapistId: message.therapist,
          clientId: message.client,
          senderId: message.sender,
          senderRole: message.senderRole,
          text: message.text,
          createdAt: message.createdAt,
        });
      } catch (error) {
        console.error("Chat message error:", error);

        socket.emit("chat_error", {
          message: "Could not send message.",
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(`Chat client disconnected: ${socket.id}`);
    });
  });
};

export default chatSocket;