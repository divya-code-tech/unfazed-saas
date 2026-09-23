import { io } from "socket.io-client";

const token = localStorage.getItem("token");

const socket = io("http://localhost:5000", {
  withCredentials: true,
  auth: {
    token,
  },
});

export default socket;