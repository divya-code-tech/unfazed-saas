import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import ChatWindow from "../../components/chat/ChatWindow";

function Chat() {
  const { user } = useAuth();

  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axiosInstance.get("/clients");
        const loadedClients = response.data.clients || [];

        setClients(loadedClients);

        if (loadedClients.length > 0) {
          setSelectedClient(loadedClients[0]);
        }
      } catch (err) {
        console.error("Failed to load clients for chat:", err);

        setError(
          err.response?.data?.message ||
            "Failed to load your clients."
        );
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);

  if (loading) {
    return (
      <div className="uf-chat-page">
        <section className="uf-page-header">
          <div>
            <span className="uf-eyebrow">Communication</span>
            <h1>Chat</h1>
            <p>Loading your client conversations...</p>
          </div>
        </section>

        <div className="uf-client-loading">
          <div className="uf-loading-pulse" />
          <div className="uf-loading-lines">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="uf-chat-page">
        <section className="uf-page-header">
          <div>
            <span className="uf-eyebrow">Communication</span>
            <h1>Chat</h1>
          </div>
        </section>

        <div className="uf-client-error">
          <div className="uf-client-error-icon">!</div>

          <div>
            <strong>We couldn't load your clients</strong>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="uf-chat-page">
      <section className="uf-page-header">
        <div>
          <span className="uf-eyebrow">Communication</span>

          <h1>Chat</h1>

          <p>
            Stay connected with your clients through
            secure conversations.
          </p>
        </div>

        <div className="uf-clients-header-count">
          <strong>{clients.length}</strong>
          <span>
            {clients.length === 1
              ? "client"
              : "clients"}
          </span>
        </div>
      </section>

      <section className="uf-chat-workspace">
        <aside className="uf-chat-client-list">
          <div className="uf-chat-list-header">
            <div>
              <span className="uf-section-kicker">
                Conversations
              </span>

              <h2>Your clients</h2>
            </div>

            <span className="uf-chat-client-count">
              {clients.length}
            </span>
          </div>

          {clients.length === 0 ? (
            <div className="uf-chat-empty-list">
              <strong>No clients yet</strong>

              <p>
                Add a client to start a conversation.
              </p>
            </div>
          ) : (
            <div className="uf-chat-client-items">
              {clients.map((client) => (
                <button
                  key={client._id}
                  type="button"
                  className={`uf-chat-client-item ${
                    selectedClient?._id === client._id
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedClient(client)
                  }
                >
                  <span className="uf-chat-client-avatar">
                    {client.name
                      ?.charAt(0)
                      ?.toUpperCase() || "C"}
                  </span>

                  <span className="uf-chat-client-copy">
                    <strong>
                      {client.name || "Unnamed client"}
                    </strong>

                    <span>
                      {client.email || "No email available"}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </aside>

        <div className="uf-chat-conversation">
          {selectedClient ? (
            <>
              <div className="uf-chat-conversation-header">
                <div className="uf-chat-conversation-person">
                  <span className="uf-chat-client-avatar">
                    {selectedClient.name
                      ?.charAt(0)
                      ?.toUpperCase() || "C"}
                  </span>

                  <div>
                    <strong>
                      {selectedClient.name ||
                        "Unnamed client"}
                    </strong>

                    <span>
                      {selectedClient.email ||
                        "Client conversation"}
                    </span>
                  </div>
                </div>

                <span className="uf-client-section-pill">
                  Live conversation
                </span>
              </div>

             <div className="uf-chat-conversation-body">
                <ChatWindow
                   clientId={selectedClient._id}
                   currentUserId={user?.id}
                />
            </div>
            </>
          ) : (
            <div className="uf-chat-no-selection">
              <div className="uf-chat-no-selection-icon">
                ◌
              </div>

              <h2>Select a client</h2>

              <p>
                Choose a client from the conversation list
                to start chatting.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Chat;