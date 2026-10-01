function MessageBubble({ message, currentUserId }) {
  const isOwnMessage =
    String(message.senderId) === String(currentUserId);

  const formattedTime = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div
      className={`uf-chat-message ${
        isOwnMessage
          ? "uf-chat-message-own"
          : "uf-chat-message-other"
      }`}
    >
      <div className="uf-chat-message-bubble">
        <p>{message.text}</p>

        {formattedTime && (
          <span className="uf-chat-message-time">
            {formattedTime}
          </span>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;