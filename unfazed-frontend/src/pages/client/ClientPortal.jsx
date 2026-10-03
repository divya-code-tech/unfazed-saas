import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import RazorpayCheckout from "../../components/payment/RazorpayCheckout";
import RazorpayPackageCheckout from "../../components/payment/RazorpayPackageCheckout";
import DOMPurify from "dompurify";
import { useAuth } from "../../context/AuthContext";
import ChatWindow from "../../components/chat/ChatWindow";
import { useNavigate } from "react-router-dom";

function ClientPortal() {

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [therapistId, setTherapistId] = useState("");
  const [date, setDate] = useState(() => {
  const today = new Date();


  return `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;
});

  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [sessions, setSessions] = useState([]);
  const [booking, setBooking] = useState(null);
  const [sessionNotes, setSessionNotes] = useState([]);

  const [myPackages, setMyPackages] = useState([]);
  const [loadingMyPackages, setLoadingMyPackages] = useState(true);

  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(true);

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [paymentChecking, setPaymentChecking] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const getToken = () => {
    return localStorage.getItem("token");
  };

  // --------------------------------------------------
  // Load all client sessions
  // --------------------------------------------------
  const loadMySessions = async () => {
    try {
      setLoadingSessions(true);
      setError("");

      const token = getToken();

      if (!token) {
        setLoadingSessions(false);
        return;
      }

      const response = await axiosInstance.get(
        "/client-portal/sessions",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const loadedSessions = response.data.sessions || [];

     setSessions(loadedSessions);

      await loadMySessionNotes(loadedSessions);

      const sessionTherapistId =
            loadedSessions[0]?.therapist?._id;
     if (sessionTherapistId) {
       setTherapistId(sessionTherapistId);
  }

      // Find the client's pending payment session.
      // We intentionally check the session status here
      // because the current sessions endpoint does not
      // always include a populated payment object.
      const pendingSession = loadedSessions.find(
        (session) =>
          session.status === "pending_payment"
      );

      if (pendingSession) {
        setBooking(pendingSession);
      } else {
        setBooking(null);
      }
    } catch (requestError) {
      console.error(
        "Failed to load client sessions:",
        requestError
      );

      setError(
        requestError.response?.data?.message ||
          "Unable to load your sessions."
      );
    } finally {
      setLoadingSessions(false);}
  };

  const loadMySessionNotes = async (clientSessions) => {
  try {
    const token = getToken();

    if (!token || !Array.isArray(clientSessions)) {
      return;
    }

    const noteResponses = await Promise.all(
      clientSessions.map((session) =>
        axiosInstance.get(
          `/client-portal/sessions/${session._id}/notes`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
      )
    );

    const sharedNotes = noteResponses.flatMap(
      (response, index) => {
        const notes = response.data.notes || [];

        return notes.map((note) => ({
          ...note,
          session: clientSessions[index],
        }));
      }
    );

    setSessionNotes(sharedNotes);
  } catch (requestError) {
    console.error(
      "Failed to load shared clinical notes:",
      requestError
    );
  }
};

  const loadAvailablePackages = async () => {
  try {
    setLoadingPackages(true);

    const token = getToken();

    if (!token) {
      setLoadingPackages(false);
      return;
    }

    const response = await axiosInstance.get(
      "/client-portal/packages",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setPackages(response.data.packages || []);
  } catch (requestError) {
    console.error(
      "Failed to load available packages:",
      requestError
    );
  } finally {
    setLoadingPackages(false);
  }
};

const loadMyPackages = async () => {
  try {
    setLoadingMyPackages(true);

    const token = getToken();

    if (!token) {
      setLoadingMyPackages(false);
      return;
    }

    const response = await axiosInstance.get(
      "/client-portal/my-packages",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setMyPackages(
      response.data.clientPackages || []
    );
  } catch (requestError) {
    console.error(
      "Failed to load purchased packages:",
      requestError
    );
  } finally {
    setLoadingMyPackages(false);
  }
};

  useEffect(() => {
    loadMySessions();
    loadAvailablePackages();
    loadMyPackages();
  }, []);

  // --------------------------------------------------
  // Load available slots
  // --------------------------------------------------
  const loadSlots = async () => {
    try {
      setLoadingSlots(true);
      setError("");
      setMessage("");
      setSelectedSlot(null);

      const token = getToken();

      if (!token) {
        setError("Please log in as a client first.");
        return;
      }

      const response = await axiosInstance.get(
        `/client-booking/therapist/${therapistId}/slots`,
        {
          params: {
            date,
            timezone: "Asia/Kolkata",
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSlots(response.data.slots || []);
    } catch (requestError) {
      console.error(requestError);

      setError(
        requestError.response?.data?.message ||
          "Unable to load available slots."
      );
    } finally {
      setLoadingSlots(false);
    }
  };

  // --------------------------------------------------
  // Reserve selected slot
  // --------------------------------------------------
  const bookSelectedSlot = async () => {
    if (!selectedSlot) {
      setError("Please select a slot first.");
      return;
    }

    try {
      setBookingLoading(true);
      setError("");
      setMessage("");

      const token = getToken();

      if (!token) {
        setError("Please log in as a client first.");
        return;
      }

      const response = await axiosInstance.post(
        `/client-booking/therapist/${therapistId}/book`,
        {
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Backend creates the session as pending_payment.
      setBooking(response.data.session);

      setMessage(
        "Slot reserved. Please complete payment to confirm your booking."
      );

      // Remove the selected slot from the available list.
      setSlots((previousSlots) =>
        previousSlots.filter(
          (slot) =>
            slot.startTime !== selectedSlot.startTime ||
            slot.endTime !== selectedSlot.endTime
        )
      );

      setSelectedSlot(null);

      // Refresh sessions so the new booking appears
      // in My Sessions too.
      await loadMySessions();
    } catch (requestError) {
      console.error(requestError);

      // If backend says this booking already exists,
      // restore the existing pending session.
      if (requestError.response?.data?.session) {
        setBooking(requestError.response.data.session);
      }

      setError(
        requestError.response?.data?.message ||
          "Unable to reserve this slot."
      );
    } finally {
      setBookingLoading(false);
    }
  };

  // --------------------------------------------------
  // Refresh a specific booking from backend
  // --------------------------------------------------
  const refreshBookingStatus = async (sessionId) => {
    const token = getToken();

    if (!token || !sessionId) {
      return null;
    }

    try {
      const response = await axiosInstance.get(
        "/client-portal/sessions",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedSessions =
        response.data.sessions || [];

      setSessions(updatedSessions);

      const updatedSession = updatedSessions.find(
        (session) =>
          String(session._id) === String(sessionId)
      );

      if (updatedSession) {
        setBooking(updatedSession);
      }

      return updatedSession || null;
    } catch (requestError) {
      console.error(
        "Failed to refresh booking status:",
        requestError
      );

      return null;
    }
  };

  const handlePaymentSuccess = async () => {
  if (!booking?._id) {
    setMessage(
      "Payment submitted successfully. Please check your session status."
    );
    return;
  }

  setPaymentChecking(true);
  setError("");

  setMessage(
    "Payment submitted successfully. Waiting for confirmation..."
  );

  const maxAttempts = 15;
  const delay = 2000;

  for (
    let attempt = 0;
    attempt < maxAttempts;
    attempt += 1
  ) {
    const updatedSession =
      await refreshBookingStatus(booking._id);

    if (updatedSession?.status === "confirmed") {
      setBooking(updatedSession);

      setMessage(
        "Payment confirmed. Your therapy session is confirmed."
      );

      setPaymentChecking(false);
      return;
    }

    await new Promise((resolve) =>
      setTimeout(resolve, delay)
    );
  }

  const finalSession =
    await refreshBookingStatus(booking._id);

  if (finalSession?.status === "confirmed") {
    setBooking(finalSession);

    setMessage(
      "Payment confirmed. Your therapy session is confirmed."
    );
  } else {
    setMessage(
      "Payment was submitted. Confirmation is still being processed. Please refresh the page shortly."
    );
  }

  setPaymentChecking(false);
};

  // --------------------------------------------------
  // Razorpay success -> wait for webhook confirmation
  // --------------------------------------------------
 const handlePackagePaymentSuccess = async (
  paymentResponse
) => {
  setError("");

  setMessage(
    "Package payment submitted successfully. Waiting for confirmation..."
  );

  const razorpayPaymentId =
    paymentResponse?.razorpay_payment_id;

  if (!razorpayPaymentId) {
    setMessage(
      "Payment was submitted, but the payment ID was not returned. Please refresh the page shortly."
    );
    return;
  }

  const maxAttempts = 15;
  const delay = 2000;

  for (
    let attempt = 0;
    attempt < maxAttempts;
    attempt += 1
  ) {
    try {
      const token = getToken();

      if (!token) {
        break;
      }

      const response = await axiosInstance.get(
        "/client-portal/my-packages",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedPackages =
        response.data.clientPackages || [];

      setMyPackages(updatedPackages);

      const newlyPurchasedPackage =
        updatedPackages.find(
          (clientPackage) =>
            clientPackage.payment?.status === "paid" &&
            clientPackage.payment?.razorpayPaymentId ===
              razorpayPaymentId
        );

      if (newlyPurchasedPackage) {
        setMessage(
          "Payment confirmed. Your package has been purchased successfully."
        );
        return;
      }
    } catch (requestError) {
      console.error(
        "Failed to check package payment:",
        requestError
      );
    }

    await new Promise((resolve) =>
      setTimeout(resolve, delay)
    );
  }

  setMessage(
    "Payment was submitted. Confirmation is still being processed. Please refresh the page shortly."
  );
};



  // --------------------------------------------------
  // Download invoice securely with client JWT
  // --------------------------------------------------
  const handleDownloadInvoice = async (paymentId) => {
    try {
      setError("");

      const token = getToken();

      if (!token) {
        setError("Please log in as a client first.");
        return;
      }

      const response = await axiosInstance.get(
        `/client-portal/invoices/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);

      const fileName =
        response.headers["x-invoice-filename"] ||
        "invoice.pdf";

      const link = document.createElement("a");

      link.href = url;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (requestError) {
      console.error(
        "Failed to download invoice:",
        requestError
      );

      setError(
        "Unable to download invoice. Please try again."
      );
    }
  };

  // --------------------------------------------------
  // Date formatting helpers
  // --------------------------------------------------
  const formatDate = (dateValue) => {
    return new Date(dateValue).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatTime = (dateValue) => {
    return new Date(dateValue).toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------
  return (
  <div className="uf-client-portal-page">
    {/* =====================================================
        PORTAL HEADER
    ====================================================== */}
    <header className="uf-client-portal-hero">
      <div className="uf-client-portal-hero-status">
         <span className="uf-client-portal-status-dot" />

         <div>
             <strong>Private client space</strong>
             <span>Your information stays within your care journey.</span>
         </div>

         <button
             type="button"
             className="uf-client-portal-logout"
             onClick={() => {
               logout();
               navigate("/login");
             }}
      >
    Logout
  </button>
</div>
</header>

    {/* =====================================================
        GLOBAL FEEDBACK
    ====================================================== */}
    {message && (
      <div className="uf-client-portal-feedback success">
        <span>✓</span>
        <p>{message}</p>
      </div>
    )}

    {error && (
      <div className="uf-client-portal-feedback error">
        <span>!</span>
        <p>{error}</p>
      </div>
    )}

    {/* =====================================================
        MAIN WORKSPACE
    ====================================================== */}
    <div className="uf-client-portal-layout">
      <main className="uf-client-portal-main">
        {/* =================================================
            BOOK A SESSION
        ================================================== */}
        <section className="uf-client-portal-card uf-booking-card">
          <div className="uf-client-portal-section-header">
            <div className="uf-client-portal-section-title">
              <div className="uf-client-portal-icon teal">◷</div>

              <div>
                <span className="uf-client-portal-kicker">
                  Appointments
                </span>
                <h2>Book a therapy session</h2>
                <p>
                  Choose a date and find an available time with your
                  therapist.
                </p>
              </div>
            </div>

            {loadingSlots && (
              <span className="uf-client-portal-status-pill">
                Loading slots
              </span>
            )}
          </div>

          <div className="uf-client-portal-booking-controls">
            <div className="uf-client-portal-date-field">
              <label htmlFor="appointment-date">
                Select a date
              </label>

              <input
                id="appointment-date"
                type="date"
                value={date}
                onChange={(event) =>
                  setDate(event.target.value)
                }
              />
            </div>

            <button
              type="button"
              className="uf-client-portal-primary-button"
              onClick={loadSlots}
              disabled={loadingSlots}
            >
              {loadingSlots
                ? "Finding available times..."
                : "Find available times"}
            </button>
          </div>

          {loadingSessions && (
            <div className="uf-client-portal-inline-loading">
              <span className="uf-client-portal-loading-dot" />
              <p>Loading your sessions...</p>
            </div>
          )}

          {slots.length > 0 && (
            <div className="uf-client-portal-slot-area">
              <div className="uf-client-portal-subheading">
                <div>
                  <h3>Available times</h3>
                  <p>Select one time to continue.</p>
                </div>

                <span>{slots.length} available</span>
              </div>

              <div className="uf-client-portal-slot-grid">
                {slots.map((slot) => {
                  const isSelected =
                    selectedSlot?.startTime === slot.startTime &&
                    selectedSlot?.endTime === slot.endTime;

                  return (
                    <button
                      key={`${slot.startTime}-${slot.endTime}`}
                      type="button"
                      className={`uf-client-portal-slot ${
                        isSelected ? "selected" : ""
                      }`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      <span className="uf-client-portal-slot-icon">
                        ◷
                      </span>

                      <span className="uf-client-portal-slot-copy">
                        <strong>{slot.displayStart}</strong>
                        <small>
                          until {slot.displayEnd}
                        </small>
                      </span>

                      {isSelected && (
                        <span className="uf-client-portal-slot-check">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!loadingSlots &&
            slots.length === 0 &&
            date && (
              <div className="uf-client-portal-empty uf-client-portal-empty-booking">
                <div className="uf-client-portal-empty-icon">
                  ◌
                </div>
                <div>
                  <h3>No times loaded yet</h3>
                  <p>
                    Choose a date above and select “Find available
                    times” to see your therapist's open slots.
                  </p>
                </div>
              </div>
            )}

          {selectedSlot && (
            <div className="uf-client-portal-selection">
              <div className="uf-client-portal-selection-copy">
                <span>Selected appointment</span>
                <strong>
                  {selectedSlot.displayStart} →{" "}
                  {selectedSlot.displayEnd}
                </strong>
              </div>

              <button
                type="button"
                className="uf-client-portal-dark-button"
                onClick={bookSelectedSlot}
                disabled={bookingLoading}
              >
                {bookingLoading
                  ? "Reserving..."
                  : "Reserve this time"}
              </button>
            </div>
          )}
        </section>

        {/* =================================================
            PAYMENT REQUIRED
        ================================================== */}
        {booking &&
          booking.status === "pending_payment" && (
            <section className="uf-client-portal-card uf-payment-card">
              <div className="uf-client-portal-section-header">
                <div className="uf-client-portal-section-title">
                  <div className="uf-client-portal-icon warm">₹</div>

                  <div>
                    <span className="uf-client-portal-kicker">
                      One step left
                    </span>
                    <h2>Complete your payment</h2>
                    <p>
                      Your appointment is reserved until payment is
                      confirmed.
                    </p>
                  </div>
                </div>

                <span className="uf-client-portal-warning-pill">
                  Payment pending
                </span>
              </div>

              <div className="uf-client-portal-payment-summary">
                <div>
                  <span>Date</span>
                  <strong>
                    {formatDate(booking.startTime)}
                  </strong>
                </div>

                <div>
                  <span>Time</span>
                  <strong>
                    {formatTime(booking.startTime)} →{" "}
                    {formatTime(booking.endTime)}
                  </strong>
                </div>

                <div>
                  <span>Amount</span>
                  <strong>
                    ₹
                    {Number(
                      booking.payment?.amount ??
                        booking.therapist?.sessionPrice
                    ).toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>

              <div className="uf-client-portal-payment-action">
                <RazorpayCheckout
                  sessionId={booking._id}
                  amount={
                    booking.payment?.amount ??
                    booking.therapist?.sessionPrice
                  }
                  onSuccess={handlePaymentSuccess}
                />

                {paymentChecking && (
                  <div className="uf-client-portal-payment-checking">
                    <span>◷</span>
                    Checking payment confirmation...
                  </div>
                )}
              </div>
            </section>
          )}

        {/* =================================================
            AVAILABLE PACKAGES
        ================================================== */}
        <section className="uf-client-portal-card">
          <div className="uf-client-portal-section-header">
            <div className="uf-client-portal-section-title">
              <div className="uf-client-portal-icon lavender">
                ▣
              </div>

              <div>
                <span className="uf-client-portal-kicker">
                  Flexible care
                </span>
                <h2>Therapy packages</h2>
                <p>
                  Explore package options and choose a plan that fits
                  your ongoing sessions.
                </p>
              </div>
            </div>
          </div>

          {loadingPackages ? (
            <div className="uf-client-portal-inline-loading">
              <span className="uf-client-portal-loading-dot" />
              <p>Loading available packages...</p>
            </div>
          ) : packages.length === 0 ? (
            <div className="uf-client-portal-empty">
              <div className="uf-client-portal-empty-icon">
                ◫
              </div>
              <div>
                <h3>No packages available</h3>
                <p>
                  There are no active therapy packages available at
                  the moment.
                </p>
              </div>
            </div>
          ) : (
            <div className="uf-client-portal-package-grid">
              {packages.map((packageData) => (
                <article
                  key={packageData._id}
                  className="uf-client-portal-package-card"
                >
                  <div className="uf-client-portal-package-top">
                    <div className="uf-client-portal-package-icon">
                      ✦
                    </div>

                    <span className="uf-client-portal-package-badge">
                      {packageData.sessionCount} sessions
                    </span>
                  </div>

                  <h3>{packageData.name}</h3>

                  {packageData.description && (
                    <p className="uf-client-portal-package-description">
                      {packageData.description}
                    </p>
                  )}

                  <div className="uf-client-portal-package-price">
                    <strong>
                      ₹
                      {Number(packageData.price).toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                    <span>total</span>
                  </div>

                  <div className="uf-client-portal-package-details">
                    <div>
                      <span>Session length</span>
                      <strong>
                        {packageData.sessionDuration} min
                      </strong>
                    </div>

                    <div>
                      <span>Per session</span>
                      <strong>
                        ₹
                        {Number(
                          packageData.perSessionRate
                        ).toLocaleString("en-IN")}
                      </strong>
                    </div>

                    <div>
                      <span>Valid for</span>
                      <strong>
                        {packageData.validityDays} days
                      </strong>
                    </div>
                  </div>

                  <div className="uf-client-portal-package-action">
                    <RazorpayPackageCheckout
                      packageId={packageData._id}
                      amount={packageData.price}
                      onSuccess={handlePackagePaymentSuccess}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* =================================================
            MY SESSIONS
        ================================================== */}
        <section className="uf-client-portal-card">
          <div className="uf-client-portal-section-header">
            <div className="uf-client-portal-section-title">
              <div className="uf-client-portal-icon sage">✓</div>

              <div>
                <span className="uf-client-portal-kicker">
                  Your schedule
                </span>
                <h2>My sessions</h2>
                <p>
                  Keep track of upcoming and previous therapy
                  appointments.
                </p>
              </div>
            </div>

            <span className="uf-client-portal-count-pill">
              {sessions.length}{" "}
              {sessions.length === 1 ? "session" : "sessions"}
            </span>
          </div>

          {sessions.length > 0 ? (
            <div className="uf-client-portal-session-list">
              {sessions.map((session) => (
                <article
                  key={session._id}
                  className="uf-client-portal-session-card"
                >
                  <div
                    className={`uf-client-portal-session-mark ${
                      session.status === "confirmed"
                        ? "confirmed"
                        : "pending"
                    }`}
                  >
                    {session.status === "confirmed"
                      ? "✓"
                      : "◷"}
                  </div>

                  <div className="uf-client-portal-session-main">
                    <div className="uf-client-portal-session-heading">
                      <div>
                        <span>
                          {session.status === "confirmed"
                            ? "Confirmed session"
                            : session.status ===
                              "pending_payment"
                            ? "Payment pending"
                            : "Therapy session"}
                        </span>

                        <h3>
                          {formatDate(session.startTime)}
                        </h3>
                      </div>

                      <span
                        className={`uf-client-portal-session-status ${
                          session.status === "confirmed"
                            ? "confirmed"
                            : "pending"
                        }`}
                      >
                        {session.status === "confirmed"
                          ? "Confirmed"
                          : session.status ===
                            "pending_payment"
                          ? "Payment pending"
                          : session.status}
                      </span>
                    </div>

                    <div className="uf-client-portal-session-meta">
                      <span>
                        ◷ {formatTime(session.startTime)} →{" "}
                        {formatTime(session.endTime)}
                      </span>

                      <span>
                        ₹
                        {Number(
                          session.payment?.amount ??
                            session.therapist?.sessionPrice
                        ).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {session.status === "confirmed" &&
                    session.payment?.status === "paid" && (
                      <button
                        type="button"
                        className="uf-client-portal-outline-button"
                        onClick={() =>
                          handleDownloadInvoice(
                            session.payment._id
                          )
                        }
                      >
                        <span>↧</span>
                        Invoice
                      </button>
                    )}
                </article>
              ))}
            </div>
          ) : (
            <div className="uf-client-portal-empty">
              <div className="uf-client-portal-empty-icon">
                ◷
              </div>
              <div>
                <h3>No sessions yet</h3>
                <p>
                  Your booked therapy sessions will appear here.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* =================================================
            SHARED CLINICAL NOTES
        ================================================== */}
        <section className="uf-client-portal-card">
          <div className="uf-client-portal-section-header">
            <div className="uf-client-portal-section-title">
              <div className="uf-client-portal-icon plum">
                ✎
              </div>

              <div>
                <span className="uf-client-portal-kicker">
                  Shared with you
                </span>
                <h2>Clinical notes</h2>
                <p>
                  Notes your therapist has chosen to make visible to
                  you.
                </p>
              </div>
            </div>

            <span className="uf-client-portal-private-pill">
              Shared notes only
            </span>
          </div>

          {sessionNotes.length > 0 ? (
            <div className="uf-client-portal-notes-grid">
              {sessionNotes.map((note) => (
                <article
                  key={note._id}
                  className="uf-client-portal-note-card"
                >
                  <div className="uf-client-portal-note-header">
                    <div>
                      <span>Session note</span>
                      <strong>
                        {note.session?.startTime
                          ? formatDate(note.session.startTime)
                          : "Session date unavailable"}
                      </strong>
                    </div>

                    <span className="uf-client-portal-note-badge">
                      Shared
                    </span>
                  </div>

                  <div className="uf-client-portal-note-divider" />

                  <div
                    className="uf-client-portal-note-content"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        note.content
                      ),
                    }}
                  />
                </article>
              ))}
            </div>
          ) : (
            <div className="uf-client-portal-empty">
              <div className="uf-client-portal-empty-icon">
                ✎
              </div>
              <div>
                <h3>No shared notes yet</h3>
                <p>
                  Shared clinical notes from your therapist will
                  appear here when available.
                </p>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* ===================================================
          RIGHT SIDEBAR
      ==================================================== */}
      <aside className="uf-client-portal-sidebar">
        {/* =================================================
            MY PACKAGES
        ================================================== */}
        <section className="uf-client-portal-card uf-client-portal-mini-card">
          <div className="uf-client-portal-mini-heading">
            <div>
              <span className="uf-client-portal-kicker">
                Your care plan
              </span>
              <h2>My packages</h2>
            </div>

            <div className="uf-client-portal-mini-icon">
              ▣
            </div>
          </div>

          {loadingMyPackages ? (
            <div className="uf-client-portal-inline-loading compact">
              <span className="uf-client-portal-loading-dot" />
              <p>Loading packages...</p>
            </div>
          ) : myPackages.length === 0 ? (
            <div className="uf-client-portal-sidebar-empty">
              <p>
                You don't have any purchased packages yet.
              </p>
            </div>
          ) : (
            <div className="uf-client-portal-my-package-list">
              {myPackages.map((clientPackage) => (
                <article
                  key={clientPackage._id}
                  className="uf-client-portal-my-package"
                >
                  <div className="uf-client-portal-my-package-top">
                    <div>
                      <span>Package</span>
                      <h3>
                        {clientPackage.package?.name ||
                          "Therapy Package"}
                      </h3>
                    </div>

                    <span className="uf-client-portal-package-status">
                      {clientPackage.status}
                    </span>
                  </div>

                  <div className="uf-client-portal-progress">
                    <div className="uf-client-portal-progress-top">
                      <span>Sessions remaining</span>
                      <strong>
                        {clientPackage.sessionsRemaining}
                      </strong>
                    </div>

                    <div className="uf-client-portal-progress-track">
                      <div
                        className="uf-client-portal-progress-fill"
                        style={{
                          width: `${
                            clientPackage.sessionsPurchased > 0
                              ? Math.min(
                                  100,
                                  (clientPackage.sessionsRemaining /
                                    clientPackage.sessionsPurchased) *
                                    100
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="uf-client-portal-my-package-meta">
                    <span>
                      {clientPackage.sessionsUsed} used
                    </span>

                    <span>
                      Expires{" "}
                      {formatDate(clientPackage.expiresAt)}
                    </span>
                  </div>

                  {clientPackage.payment?.status === "paid" && (
                    <button
                      type="button"
                      className="uf-client-portal-text-button"
                      onClick={() =>
                        handleDownloadInvoice(
                          clientPackage.payment._id
                        )
                      }
                    >
                      Download invoice ↗
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* =================================================
            CHAT
        ================================================== */}
        <section className="uf-client-portal-card uf-client-portal-chat-card">
          <div className="uf-client-portal-chat-heading">
            <div>
              <span className="uf-client-portal-kicker">
                Stay connected
              </span>
              <h2>Chat with your therapist</h2>
              <p>
                Send messages securely from your private care space.
              </p>
            </div>

            <div className="uf-client-portal-chat-live">
              <span />
              Live
            </div>
          </div>

          <div className="uf-client-portal-chat-body">
            <ChatWindow
              clientId={user?.id}
              currentUserId={user?.id}
            />
          </div>
        </section>

        {/* =================================================
            PRIVACY NOTE
        ================================================== */}
        <section className="uf-client-portal-privacy">
          <div className="uf-client-portal-privacy-icon">
            🔒
          </div>

          <div>
            <strong>Your care space is private</strong>
            <p>
              Only information intentionally shared with you is
              displayed in this portal.
            </p>
          </div>
        </section>
      </aside>
    </div>
  </div>
);
}

export default ClientPortal;