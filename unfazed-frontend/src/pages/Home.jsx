import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import socket from "../api/socket";

function Home() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    console.log("Socket connected:", socket.connected);

    const handleConnect = () => {
      console.log("Socket connected:", socket.id);
    };

    const handleDisconnect = () => {
      console.log("Socket disconnected");
    };

    const handleReceiveMessage = (message) => {
      setMessages((previousMessages) => [
        ...previousMessages,
        message,
      ]);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off(
        "receive_message",
        handleReceiveMessage
      );
    };
  }, []);

  const clientId = "6a9ea2028328d43d8abd8121";

  const handleSendMessage = () => {
    if (!chatMessage.trim()) {
      return;
    }

    socket.emit("send_message", {
      clientId,
      text: chatMessage,
    });

    setChatMessage("");
  };

  const handleLogin = async () => {
    try {
      const response = await axiosInstance.post(
        "/auth/therapist/login",
        {
          email,
          password,
        }
      );

      const token = response.data.data.token;

      localStorage.setItem("token", token);

      setMessage(
        "Therapist login successful. Refresh the page."
      );

      console.log("Therapist login successful");
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          "Therapist login failed"
      );
    }
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      setMessage("");

      const token = localStorage.getItem("token");

      const response = await axiosInstance.post(
        "/payments/create-order",
        {
          clientId,
          amount: 1500,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const order = response.data.order;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Unfazed",
        description: "Test Therapy Payment",
        order_id: order.id,

        handler: function (paymentResponse) {
          setMessage(
            `Payment completed. Payment ID: ${paymentResponse.razorpay_payment_id}`
          );
        },

        theme: {
          color: "#3399cc",
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.open();
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          "Could not create payment order"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Unfazed</h1>

      <h2>Therapist Login</h2>

      <input
        type="email"
        placeholder="Therapist email"
        value={email}
        onChange={(event) =>
          setEmail(event.target.value)
        }
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(event) =>
          setPassword(event.target.value)
        }
      />

      <button onClick={handleLogin}>
        Login
      </button>

      <h2>Chat Test</h2>

      <input
        type="text"
        placeholder="Type a message"
        value={chatMessage}
        onChange={(event) =>
          setChatMessage(event.target.value)
        }
      />

      <button onClick={handleSendMessage}>
        Send Message
      </button>

      <button
        onClick={handlePayment}
        disabled={loading}
      >
        {loading
          ? "Creating Order..."
          : "Pay ₹1500"}
      </button>

      <div>
        <h3>Messages</h3>

        {messages.map((msg, index) => (
          <p key={msg.id || index}>
            <strong>{msg.senderRole}:</strong>{" "}
            {msg.text}
          </p>
        ))}
      </div>

      {message && <p>{message}</p>}
    </div>
  );
}

export default Home;