
import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Italic from "@tiptap/extension-italic";
import axiosInstance from "../../api/axiosInstance";
import DOMPurify from "dompurify";

function Notes() {

  const editor = useEditor({
   extensions: [
  StarterKit.configure({
    italic: false,
  }),
  Italic,
],
    content: "",
    onUpdate: ({ editor }) => {
      setNoteContent(editor.getHTML());
    },
  });

  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [isClientVisible, setIsClientVisible] = useState(false);

  const [notes, setNotes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axiosInstance.get("/sessions");

        const allSessions =
          response.data.sessions ||
          response.data.data?.sessions ||
          response.data.data ||
          [];

        setSessions(Array.isArray(allSessions) ? allSessions : []);
      } catch (err) {
        console.error("Failed to load sessions:", err);

        setError(
          err.response?.data?.message ||
            "Failed to load your sessions."
        );
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, []);

  const loadNotesForSession = async (sessionId) => {
    if (!sessionId) {
      setNotes([]);
      return;
    }

    try {
      const response = await axiosInstance.get(
        `/session-notes/session/${sessionId}`
      );

      setNotes(response.data.notes || []);
    } catch (err) {
      console.error("Failed to load session notes:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load clinical notes."
      );
    }
  };

  const handleSessionChange = async (event) => {
    const sessionId = event.target.value;

    setSelectedSession(sessionId);
    setMessage("");
    setError("");

    await loadNotesForSession(sessionId);
  };

  const handleSaveNote = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!selectedSession) {
      setError("Please select a session first.");
      return;
    }

    if (!noteContent.trim()) {
      setError("Please enter note content.");
      return;
    }

    try {
      setSaving(true);

      await axiosInstance.post("/session-notes", {
        sessionId: selectedSession,
        content: noteContent.trim(),
        isClientVisible,
        attachments: [],
      });

      setMessage("Clinical note saved successfully.");
      setNoteContent("");
      setIsClientVisible(false);

      await loadNotesForSession(selectedSession);
    } catch (err) {
      console.error("Failed to save clinical note:", err);

      setError(
        err.response?.data?.message ||
          "Failed to save clinical note."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p>Loading notes...</p>;
  }

  return (
    <div className="uf-page">
      <div style={{ maxWidth: "900px" }}>
        <p className="uf-eyebrow">Clinical documentation</p>

        <h1 style={{ marginTop: "8px" }}>Notes</h1>

        <p
          className="uf-muted"
          style={{ marginTop: "8px", marginBottom: "24px" }}
        >
          Create and review clinical notes for your sessions.
        </p>

        {message && (
          <div
            style={{
              marginBottom: "16px",
              padding: "12px 14px",
              borderRadius: "10px",
              background: "var(--uf-teal-soft)",
              color: "var(--uf-teal-dark)",
            }}
          >
            {message}
          </div>
        )}

        {error && (
          <div
            style={{
              marginBottom: "16px",
              padding: "12px 14px",
              borderRadius: "10px",
              background: "var(--uf-red-soft)",
              color: "var(--uf-red)",
            }}
          >
            {error}
          </div>
        )}

        <div className="uf-surface" style={{ padding: "24px" }}>
          <h2>New Clinical Note</h2>

          <div style={{ marginTop: "20px" }}>
            <label className="uf-label">
              Session
            </label>

            <select
              className="uf-input"
              value={selectedSession}
              onChange={handleSessionChange}
            >
              <option value="">Select a session</option>

              {sessions.map((session) => (
                <option
                  key={session._id}
                  value={session._id}
                >
                  {session.client?.name ||
                    session.client?.email ||
                    "Client"}{" "}
                  —{" "}
                  {new Date(
                    session.startTime
                  ).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleSaveNote}>
            <div style={{ marginTop: "20px" }}>
              <label className="uf-label">
                Clinical Note
              </label>


 <div
  style={{
    border: "1px solid var(--uf-border)",
    borderRadius: "10px",
    overflow: "hidden",
  }}
>
  <div
    style={{
      display: "flex",
      gap: "8px",
      padding: "10px",
      borderBottom: "1px solid var(--uf-border)",
    }}
  >
    <button
      type="button"
      onClick={() =>
        editor?.chain().focus().toggleBold().run()
      }
    >
      Bold
    </button>

    <button
      type="button"
      onClick={() =>
        editor?.chain().focus().toggleItalic().run()
      }
    >
      Italic
    </button>

    <button
      type="button"
      onClick={() =>
        editor?.chain().focus().toggleBulletList().run()
      }
    >
      Bullet List
    </button>
  </div>

  <EditorContent
    editor={editor}
    style={{
      minHeight: "180px",
      padding: "12px",
    }}
  />
</div>
 </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "16px",
                fontSize: "0.88rem",
              }}
            >
              <input
                type="checkbox"
                checked={isClientVisible}
                onChange={(event) =>
                  setIsClientVisible(event.target.checked)
                }
              />

              Make this note visible to the client
            </label>

            <button
              type="submit"
              className="uf-button uf-button-primary"
              disabled={saving}
              style={{ marginTop: "20px" }}
            >
              {saving ? "Saving..." : "Save Clinical Note"}
            </button>
          </form>
        </div>

        {selectedSession && (
          <div
            className="uf-surface"
            style={{
              padding: "24px",
              marginTop: "20px",
            }}
          >
            <h2>Existing Notes</h2>

            {notes.length === 0 ? (
              <p
                className="uf-muted"
                style={{ marginTop: "12px" }}
              >
                No clinical notes found for this session.
              </p>
            ) : (
              <div style={{ marginTop: "16px" }}>
                {notes.map((note) => (
                  <div
                    key={note._id}
                    style={{
                      padding: "16px",
                      border: "1px solid var(--uf-border)",
                      borderRadius: "12px",
                      marginTop: "12px",
                    }}
                  >
                   <div
                     dangerouslySetInnerHTML={{
                       __html: DOMPurify.sanitize(note.content),
                    }}
                  />

                    <p
                      className="uf-muted"
                      style={{
                        marginTop: "10px",
                        fontSize: "0.82rem",
                      }}
                    >
                      {note.isClientVisible
                        ? "Client visible"
                        : "Private"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notes;