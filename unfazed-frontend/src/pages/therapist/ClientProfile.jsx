import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import ChatWindow from "../../components/chat/ChatWindow";
import DOMPurify from "dompurify";

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
      <div className="uf-client-profile-page">
{/* =====================================================
          PROFILE HEADER
      ====================================================== */}
      <section className="uf-client-profile-header">
        <div className="uf-client-profile-identity">
          <div className="uf-client-profile-avatar">
            {client.name?.charAt(0).toUpperCase() || "C"}
          </div>

          <div>
            <span className="uf-eyebrow">Client profile</span>

            <h1>{client.name}</h1>

            <div className="uf-client-profile-contact">
              <span>{client.email}</span>
              <span>
                {client.phone || "No phone number"}
              </span>
            </div>

            <div className="uf-client-profile-tags">
              {client.tags && client.tags.length > 0 ? (
                client.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))
              ) : (
                <span>No tags added</span>
              )}
            </div>
          </div>
        </div>

        <div
          className={`uf-client-profile-status ${
            client.isActive ? "active" : "inactive"
          }`}
        >
          <span />
          {client.isActive ? "Active client" : "Inactive client"}
        </div>
      </section>

      {/* =====================================================
          OVERVIEW + CONSENT
      ====================================================== */}
      <section className="uf-client-profile-overview-grid">
        <article className="uf-client-profile-card">
          <div className="uf-client-profile-card-heading">
            <div className="uf-client-profile-card-icon rose">
              ◉
            </div>

            <div>
              <span className="uf-section-kicker">
                Client details
              </span>
              <h2>Overview</h2>
            </div>
          </div>

          <div className="uf-client-detail-grid">
            <div>
              <span>Date of birth</span>
              <strong>
                {client.dateOfBirth
                  ? new Date(
                      client.dateOfBirth
                    ).toLocaleDateString()
                  : "Not provided"}
              </strong>
            </div>

            <div>
              <span>Gender</span>
              <strong>
                {client.gender || "Not provided"}
              </strong>
            </div>

            <div>
              <span>Languages</span>
              <strong>
                {client.languages &&
                client.languages.length > 0
                  ? client.languages.join(", ")
                  : "Not provided"}
              </strong>
            </div>

            <div>
              <span>Sessions</span>
              <strong>{sessions.length}</strong>
            </div>
          </div>
        </article>

        <article className="uf-client-profile-card uf-consent-card">
          <div className="uf-client-profile-card-heading">
            <div className="uf-client-profile-card-icon green">
              ✓
            </div>

            <div>
              <span className="uf-section-kicker">
                Privacy & records
              </span>
              <h2>Digital consent</h2>
            </div>
          </div>

          <label className="uf-consent-toggle">
            <input
              type="checkbox"
              checked={Boolean(client.consent?.given)}
              onChange={handleConsentChange}
              disabled={savingConsent}
            />

            <span className="uf-consent-switch" />

            <div>
              <strong>Client consent</strong>
              <span>
                Allow consent to be recorded for this client.
              </span>
            </div>
          </label>

          <div className="uf-consent-status">
            <span>Status</span>
            <strong>
              {client.consent?.given
                ? "Consent given"
                : "Consent not given"}
            </strong>
          </div>

          {client.consent?.givenAt && (
            <div className="uf-consent-timestamp">
              Recorded{" "}
              {new Date(
                client.consent.givenAt
              ).toLocaleString()}
            </div>
          )}

          {consentMessage && (
            <div className="uf-client-feedback">
              {consentMessage}
            </div>
          )}
        </article>
      </section>

      {/* =====================================================
          CHAT
      ====================================================== */}
      <section className="uf-client-profile-section">
        <div className="uf-client-profile-section-heading">
          <div>
            <span className="uf-section-kicker">
              Communication
            </span>

            <h2>Conversation</h2>

            <p>
              Messages exchanged between you and this client.
            </p>
          </div>

          <div className="uf-client-section-pill">
            Live conversation
          </div>
        </div>

        <div className="uf-client-chat-card">
          <ChatWindow
            clientId={id}
            currentUserId={user?.id}
          />
        </div>
      </section>

      {/* =====================================================
          SESSION + PAYMENT HISTORY
      ====================================================== */}
      <section className="uf-client-profile-two-column">
        <article className="uf-client-profile-section">
          <div className="uf-client-profile-section-heading compact">
            <div>
              <span className="uf-section-kicker">
                Appointments
              </span>

              <h2>Session history</h2>

              <p>
                Previous and scheduled sessions with this
                client.
              </p>
            </div>

            <div className="uf-client-history-count">
              {sessions.length}
            </div>
          </div>

          {sessions.length === 0 ? (
            <div className="uf-client-empty-state">
              <div>◷</div>
              <h3>No sessions yet</h3>
              <p>
                Sessions for this client will appear here.
              </p>
            </div>
          ) : (
            <div className="uf-client-history-list">
              {sessions.map((session) => (
                <article
                  key={session._id}
                  className="uf-client-history-card"
                >
                  <div className="uf-client-history-icon">
                    ◷
                  </div>

                  <div className="uf-client-history-main">
                    <div className="uf-client-history-title">
                      <strong>Therapy session</strong>

                      <span
                         className={`uf-client-session-status ${
                         session.status === "confirmed"
                         ? "confirmed"
                         : session.status === "pending_payment"
                          ? "pending"
                            : ""
                              }`}
                      >
                        {session.status || "Unknown"}
                      </span>
                    </div>

                    <div className="uf-client-history-meta">
                      <span>
                        {new Date(
                          session.startTime
                        ).toLocaleDateString()}
                      </span>

                      <span>
                        {new Date(
                          session.startTime
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" – "}
                        {new Date(
                          session.endTime
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      <span>
                        {session.duration} minutes
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="uf-client-profile-section">
          <div className="uf-client-profile-section-heading compact">
            <div>
              <span className="uf-section-kicker">
                Billing
              </span>

              <h2>Payment history</h2>

              <p>
                Payments associated with this client.
              </p>
            </div>

            <div className="uf-client-history-count">
              {payments.length}
            </div>
          </div>

          {payments.length === 0 ? (
            <div className="uf-client-empty-state">
              <div>₹</div>
              <h3>No payments yet</h3>
              <p>
                Payment records for this client will appear
                here.
              </p>
            </div>
          ) : (
            <div className="uf-client-history-list">
              {payments.map((payment) => (
                <article
                  key={payment._id}
                  className="uf-client-payment-card"
                >
                  <div className="uf-client-payment-icon">
                    ₹
                  </div>

                  <div className="uf-client-history-main">
                    <div className="uf-client-history-title">
                      <strong>
                        ₹{payment.amount}
                      </strong>

                     <span
                        className={`uf-client-payment-status ${
                          payment.status === "paid" ? "paid" : ""
                     }`}
                   >
                     {payment.status || "Unknown"}
                  </span>
                    </div>

                    <div className="uf-client-history-meta">
                      <span>
                        {payment.currency || "INR"}
                      </span>

                      <span>
                        {payment.createdAt
                          ? new Date(
                              payment.createdAt
                            ).toLocaleDateString()
                          : "Date unavailable"}
                      </span>
                    </div>

                    {payment.paidAt && (
                      <small>
                        Paid{" "}
                        {new Date(
                          payment.paidAt
                        ).toLocaleString()}
                      </small>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>
      </section>

      {/* =====================================================
          CLINICAL NOTES
      ====================================================== */}
      <section className="uf-client-profile-section">
        <div className="uf-client-profile-section-heading">
          <div>
            <span className="uf-section-kicker">
              Clinical record
            </span>

            <h2>Clinical notes</h2>

            <p>
              Session notes and documentation for this client.
            </p>
          </div>

          <div className="uf-client-section-pill">
            {notes.length}{" "}
            {notes.length === 1 ? "note" : "notes"}
          </div>
        </div>

        {notes.length === 0 ? (
          <div className="uf-client-empty-state large">
            <div>✎</div>
            <h3>No clinical notes found</h3>
            <p>
              Clinical documentation for this client will
              appear here.
            </p>
          </div>
        ) : (
          <div className="uf-client-notes-grid">
            {notes.map((note) => (
              <article
                key={note._id}
                className="uf-client-note-card"
              >
                <div className="uf-client-note-top">
                  <div>
                    <span className="uf-client-note-date">
                      {note.session?.startTime
                        ? new Date(
                            note.session.startTime
                          ).toLocaleDateString()
                        : "Date unavailable"}
                    </span>

                    <strong>Session note</strong>
                  </div>

                 <span
                       className={`uf-client-note-visibility ${
                         note.type === "shared"
                           ? "visible"
                           : "private"
                        }`}
                       >
                          {note.type === "shared"
                            ? "Shared with client"
                            : "Private"}
                       </span>
                </div>

                <div
                  className="uf-client-note-content"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(
                      note.content
                    ),
                  }}
                />
              </article>
            ))}
          </div>
        )}
      </section>

      {/* =====================================================
          INTAKE INFORMATION
      ====================================================== */}
      <section className="uf-client-profile-section uf-intake-section">
        <div className="uf-client-profile-section-heading">
          <div>
            <span className="uf-section-kicker">
              Client onboarding
            </span>

            <h2>Intake information</h2>

            <p>
              Keep important background information up to
              date for this client.
            </p>
          </div>
        </div>

        <form
          className="uf-intake-form"
          onSubmit={handleSubmit(onSubmitIntake)}
        >
          <div className="uf-intake-form-grid">
            <label className="uf-client-field">
              <span>Date of birth</span>

              <input
                type="date"
                {...register("dateOfBirth")}
              />
            </label>

            <label className="uf-client-field">
              <span>Gender</span>

              <select {...register("gender")}>
                <option value="">Select gender</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="non-binary">
                  Non-binary
                </option>
                <option value="prefer_not_to_say">
                  Prefer not to say
                </option>
              </select>
            </label>

            <label className="uf-client-field uf-client-field-wide">
              <span>Languages</span>

              <input
                type="text"
                placeholder="English, Tamil"
                {...register("languages")}
              />
            </label>

            <label className="uf-client-field uf-client-field-wide">
              <span>Presenting concern</span>

              <textarea
                rows="4"
                placeholder="Describe the client's presenting concern..."
                {...register("presentingConcern")}
              />
            </label>

            <label className="uf-client-field uf-client-field-wide">
              <span>History</span>

              <textarea
                rows="6"
                placeholder="Relevant client history..."
                {...register("history")}
              />
            </label>
          </div>

          <div className="uf-intake-form-footer">
            {intakeMessage && (
              <div className="uf-client-feedback">
                {intakeMessage}
              </div>
            )}

            <button
              type="submit"
              className="uf-client-save-button"
              disabled={savingIntake}
            >
              {savingIntake
                ? "Saving..."
                : "Save intake information"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default ClientProfile;