import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import ChatWindow from "../../components/chat/ChatWindow";

function ClientProfile() {
  const { id } = useParams();
  const { user } = useAuth();

  const [client, setClient] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [notes, setNotes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [savingIntake, setSavingIntake] = useState(false);
  const [intakeMessage, setIntakeMessage] = useState("");

  const [savingConsent, setSavingConsent] = useState(false);
  const [consentMessage, setConsentMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
  } = useForm({
    defaultValues: {
      dateOfBirth: "",
      gender: "",
      languages: "",
      presentingConcern: "",
      history: "",
    },
  });

  useEffect(() => {
    const fetchClientProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          clientResponse,
          sessionsResponse,
          paymentsResponse,
        ] = await Promise.all([
          axiosInstance.get(`/clients/${id}`),
          axiosInstance.get("/sessions"),
          axiosInstance.get("/payments"),
        ]);

        const clientData = clientResponse.data.client;

        setClient(clientData);

        reset({
          dateOfBirth: clientData.dateOfBirth
            ?new Date(clientData.dateOfBirth).toISOString().slice(0, 10)
            : "",
          gender: clientData.gender || "",
          languages: Array.isArray(clientData.languages)
            ? clientData.languages.join(", ")
            : "",
          presentingConcern:
            clientData.intake?.presentingConcern || "",
          history:
            clientData.intake?.history || "",
        });

        const allSessions =
          sessionsResponse.data.sessions ||
          sessionsResponse.data.data?.sessions ||
          sessionsResponse.data.data ||
          [];

        const clientSessions = Array.isArray(allSessions)
          ? allSessions.filter((session) => {
              const sessionClientId =
                session.client?._id || session.client;

              return String(sessionClientId) === String(id);
            })
          : [];

        setSessions(clientSessions);

        const noteResponses = await Promise.all(
          clientSessions.map((session) =>
            axiosInstance.get(
              `/session-notes/session/${session._id}`
            )
          )
        );

        const clientNotes = noteResponses.flatMap(
          (response, index) => {
            const sessionNotes =
              response.data.notes ||
              response.data.data?.notes ||
              response.data.data ||
              [];

            return Array.isArray(sessionNotes)
              ? sessionNotes.map((note) => ({
                  ...note,
                  session: clientSessions[index],
                }))
              : [];
          }
        );

        setNotes(clientNotes);

        const allPayments =
          paymentsResponse.data.payments ||
          paymentsResponse.data.data?.payments ||
          paymentsResponse.data.data ||
          [];

        const clientPayments = Array.isArray(allPayments)
          ? allPayments.filter((payment) => {
              const paymentClientId =
                payment.client?._id || payment.client;

              return String(paymentClientId) === String(id);
            })
          : [];

        setPayments(clientPayments);
      } catch (error) {
        console.error(
          "Failed to load client profile:",
          error
        );

        setError(
          error.response?.data?.message ||
            "Failed to load client profile."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchClientProfile();
    }
  }, [id, reset]);

  const onSubmitIntake = async (data) => {
    try {
      setSavingIntake(true);
      setIntakeMessage("");

      const updatedClient = await axiosInstance.put(
        `/clients/${id}`,
        {
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          languages: data.languages
            .split(",")
            .map((language) => language.trim())
            .filter(Boolean),
          intake: {
            presentingConcern: data.presentingConcern,
            history: data.history,
          },
        }
      );

      setClient(updatedClient.data.client);

      setIntakeMessage(
        "Intake information saved successfully."
      );
    } catch (error) {
      console.error(
        "Failed to save intake:",
        error
      );

      setIntakeMessage(
        error.response?.data?.message ||
          "Failed to save intake information."
      );
    } finally {
      setSavingIntake(false);
    }
  };

  const handleConsentChange = async (event) => {
    const given = event.target.checked;

    try {
      setSavingConsent(true);
      setConsentMessage("");

      const updatedClient = await axiosInstance.put(
        `/clients/${id}`,
        {
          consent: {
            given,
          },
        }
      );

      setClient(updatedClient.data.client);

      setConsentMessage(
        given
          ? "Consent recorded successfully."
          : "Consent status updated."
      );
    } catch (error) {
      console.error(
        "Failed to update consent:",
        error
      );

      setConsentMessage(
        error.response?.data?.message ||
          "Failed to update consent."
      );
    } finally {
      setSavingConsent(false);
    }
  };

  if (loading) {
    return <p>Loading client profile...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!client) {
    return <p>Client not found.</p>;
  }

  return (
    <div>
      <h1>{client.name}</h1>

      <p>
        <strong>Email:</strong> {client.email}
      </p>

      <p>
        <strong>Phone:</strong>{" "}
        {client.phone || "No phone number"}
      </p>

      <p>
        <strong>Status:</strong>{" "}
        {client.isActive ? "Active" : "Inactive"}
      </p>

      <p>
        <strong>Tags:</strong>{" "}
        {client.tags && client.tags.length > 0
          ? client.tags.join(", ")
          : "No tags"}
      </p>

      <hr />

{/* =========================
          CHAT
========================= */}

<h2>Chat</h2>

<ChatWindow
  clientId={id}
  currentUserId={user?.id}
/>

<hr />

      {/* =========================
          SESSION HISTORY
      ========================= */}

      <h2>Session History</h2>

      {sessions.length === 0 ? (
        <p>No sessions found.</p>
      ) : (
        <div>
          {sessions.map((session) => (
            <div
              key={session._id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                padding: "14px",
                marginTop: "12px",
                maxWidth: "600px",
              }}
            >
              <p>
                <strong>Date:</strong>{" "}
                {new Date(
                  session.startTime
                ).toLocaleDateString()}
              </p>

              <p>
                <strong>Time:</strong>{" "}
                {new Date(
                  session.startTime
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                –{" "}
                {new Date(
                  session.endTime
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                {session.status || "Unknown"}
              </p>

              <p>
                <strong>Duration:</strong>{" "}
                {session.duration} minutes
              </p>
            </div>
          ))}
        </div>
      )}

      <hr />

      {/* =========================
          PAYMENT HISTORY
      ========================= */}

      <h2>Payment History</h2>

      {payments.length === 0 ? (
        <p>No payments found.</p>
      ) : (
        <div>
          {payments.map((payment) => (
            <div
              key={payment._id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                padding: "14px",
                marginTop: "12px",
                maxWidth: "600px",
              }}
            >
              <p>
                <strong>Amount:</strong> ₹
                {payment.amount}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                {payment.status || "Unknown"}
              </p>

              <p>
                <strong>Currency:</strong>{" "}
                {payment.currency || "INR"}
              </p>

              <p>
                <strong>Date:</strong>{" "}
                {payment.createdAt
                  ? new Date(
                      payment.createdAt
                    ).toLocaleDateString()
                  : "Not available"}
              </p>

              {payment.paidAt && (
                <p>
                  <strong>Paid At:</strong>{" "}
                  {new Date(
                    payment.paidAt
                  ).toLocaleString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <hr />

      {/* =========================
          CLINICAL NOTES
      ========================= */}

      <h2>Clinical Notes</h2>

      {notes.length === 0 ? (
        <p>No clinical notes found.</p>
      ) : (
        <div>
          {notes.map((note) => (
            <div
              key={note._id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                padding: "14px",
                marginTop: "12px",
                maxWidth: "600px",
              }}
            >
              <p>
                <strong>Session Date:</strong>{" "}
                {note.session?.startTime
                  ? new Date(
                      note.session.startTime
                    ).toLocaleDateString()
                  : "Not available"}
              </p>

              <p>
                <strong>Note:</strong>
              </p>

              <p>{note.content}</p>

              <p>
                <strong>Visibility:</strong>{" "}
                {note.isClientVisible
                  ? "Client visible"
                  : "Private"}
              </p>
            </div>
          ))}
        </div>
      )}

      <hr />

      {/* =========================
          INTAKE INFORMATION
      ========================= */}

      <h2>Intake Information</h2>

      <form onSubmit={handleSubmit(onSubmitIntake)}>
        <div style={{ marginTop: "12px" }}>
          <label>
            <strong>Date of Birth</strong>
            <br />
            <input
              type="date"
              {...register("dateOfBirth")}
              style={{
                marginTop: "6px",
                padding: "8px",
              }}
            />
          </label>
        </div>

        <br />

        <div>
          <label>
            <strong>Gender</strong>
            <br />
            <select
              {...register("gender")}
              style={{
                marginTop: "6px",
                padding: "8px",
              }}
            >
              <option value="">Select gender</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="non-binary">Non-binary</option>
              <option value="prefer_not_to_say">
                Prefer not to say
              </option>
            </select>
          </label>
        </div>

        <br />

        <div>
          <label>
            <strong>Languages</strong>
            <br />
            <input
              type="text"
              placeholder="English, Tamil"
              {...register("languages")}
              style={{
                marginTop: "6px",
                padding: "8px",
                width: "300px",
                maxWidth: "100%",
              }}
            />
          </label>
        </div>

        <br />

        <div>
          <label>
            <strong>Presenting Concern</strong>
            <br />
            <textarea
              rows="4"
              placeholder="Describe the client's presenting concern..."
              {...register("presentingConcern")}
              style={{
                marginTop: "6px",
                padding: "8px",
                width: "500px",
                maxWidth: "100%",
              }}
            />
          </label>
        </div>

        <br />

        <div>
          <label>
            <strong>History</strong>
            <br />
            <textarea
              rows="6"
              placeholder="Relevant client history..."
              {...register("history")}
              style={{
                marginTop: "6px",
                padding: "8px",
                width: "500px",
                maxWidth: "100%",
              }}
            />
          </label>
        </div>

        <br />

        <button
          type="submit"
          disabled={savingIntake}
        >
          {savingIntake
            ? "Saving..."
            : "Save Intake Information"}
        </button>

        {intakeMessage && (
          <p style={{ marginTop: "10px" }}>
            {intakeMessage}
          </p>
        )}
      </form>

      <hr />

      {/* =========================
          DIGITAL CONSENT
      ========================= */}

      <h2>Digital Consent</h2>

      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          padding: "14px",
          marginTop: "12px",
          maxWidth: "600px",
        }}
      >
        <label>
          <input
            type="checkbox"
            checked={Boolean(client.consent?.given)}
            onChange={handleConsentChange}
            disabled={savingConsent}
          />{" "}
          Client consent has been given.
        </label>

        <p>
          <strong>Status:</strong>{" "}
          {client.consent?.given
            ? "Consent given"
            : "Consent not given"}
        </p>

        {client.consent?.givenAt && (
          <p>
            <strong>Consent Timestamp:</strong>{" "}
            {new Date(
              client.consent.givenAt
            ).toLocaleString()}
          </p>
        )}

        {consentMessage && (
          <p>{consentMessage}</p>
        )}
      </div>
    </div>
  );
}

export default ClientProfile;