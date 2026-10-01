import { useEffect, useState } from "react";
import socket, {
  connectSocket,
  disconnectSocket,
} from "../../api/socket";
import MessageBubble from "./MessageBubble";

function ChatWindow({ clientId, currentUserId }) {
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleConnect = () => {
      console.log("Chat socket connected:", socket.id);
      setConnected(true);
      setError("");
    };

    const handleDisconnect = () => {
      console.log("Chat socket disconnected");
      setConnected(false);
    };

    const handleReceiveMessage = (message) => {
      setMessages((previousMessages) => [
        ...previousMessages,
        message,
      ]);
    };

    const handleChatError = (chatError) => {
      console.error("Chat error:", chatError);
      setError(
        chatError?.message || "Unable to send message."
      );
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("receive_message", handleReceiveMessage);
    socket.on("chat_error", handleChatError);

    connectSocket();

    if (socket.connected) {
      setConnected(true);
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off(
        "receive_message",
        handleReceiveMessage
      );
      socket.off("chat_error", handleChatError);

      disconnectSocket();
    };
  }, []);

  const handleSendMessage = (event) => {
    event.preventDefault();

    const trimmedMessage = chatMessage.trim();

    if (!trimmedMessage) {
      return;
    }

    if (!connected) {
      setError("Chat is not connected.");
      return;
    }

    if (!clientId) {
      setError("Client information is missing.");
      return;
    }

    setError("");

    socket.emit("send_message", {
      clientId,
      text: trimmedMessage,
    });

    setChatMessage("");
  };

  return (
    <section className="uf-chat-window">
      <div className="uf-chat-header">
        <div>
          <h2>Messages</h2>

          <span>
            {connected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>

      <div className="uf-chat-messages">
        {messages.length === 0 ? (
          <p>No messages yet.</p>
        ) : (
          messages.map((message, index) => (
            <MessageBubble
              key={message.id || index}
              message={message}
              currentUserId={currentUserId}
            />
          ))
        )}
      </div>

      <form
        className="uf-chat-input-area"
        onSubmit={handleSendMessage}
      >
        <input
          type="text"
          placeholder="Type a message..."
          value={chatMessage}
          onChange={(event) =>
            setChatMessage(event.target.value)
          }
        />

        <button type="submit" disabled={!connected}>
          Send
        </button>
      </form>

      {error && (
        <p className="uf-chat-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

export default ChatWindow;