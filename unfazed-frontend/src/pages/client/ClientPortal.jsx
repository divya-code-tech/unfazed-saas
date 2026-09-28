import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import RazorpayCheckout from "../../components/payment/RazorpayCheckout";
import RazorpayPackageCheckout from "../../components/payment/RazorpayPackageCheckout";


const therapistId = "6a9d4ff2896432582ca940c4";

function ClientPortal() {
  const [date, setDate] = useState("2026-09-08");

  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [sessions, setSessions] = useState([]);
  const [booking, setBooking] = useState(null);

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
      setLoadingSessions(false);
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
    <div
      style={{
        padding: "30px",
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      <h1>Client Portal</h1>

      <p>
        Select a date and choose an available therapy
        session.
      </p>

      {/* ----------------------------------------------
          SESSION LOADING
      ---------------------------------------------- */}
      {loadingSessions && (
        <p>Loading your sessions...</p>
      )}

      {/* ----------------------------------------------
          DATE + AVAILABLE SLOTS
      ---------------------------------------------- */}
      <div style={{ marginBottom: "20px" }}>
        <label htmlFor="appointment-date">
          <strong>Date: </strong>
        </label>

        <input
          id="appointment-date"
          type="date"
          value={date}
          onChange={(event) =>
            setDate(event.target.value)
          }
        />

        <button
          type="button"
          onClick={loadSlots}
          disabled={loadingSlots}
          style={{ marginLeft: "10px" }}
        >
          {loadingSlots
            ? "Loading..."
            : "Find Available Slots"}
        </button>
      </div>

{/* ----------------------------------------------
          AVAILABLE SLOTS
---------------------------------------------- */}
{
slots.length > 0 && (
   <div>
     <h2>Available Slots</h2>

    { 
    slots.map((slot) => {
      const isSelected =
      selectedSlot?.startTime === slot.startTime &&
      selectedSlot?.endTime === slot.endTime;

    return (
      <button
        key={`${slot.startTime}-${slot.endTime}`}
        type="button"
        onClick={() =>
        setSelectedSlot(slot)
         }
           style={{
           display: "block",
           width: "100%",
           maxWidth: "350px",
           marginBottom: "10px",
           padding: "12px",
           cursor: "pointer",
           fontWeight: isSelected
           ? "bold"
           : "normal",
            }}
            >
            {slot.displayStart} →{" "}
            {slot.displayEnd}
            </button>
            );
          })}
        </div>
      )}

{/* ----------------------------------------------
          NO SLOT
 ---------------------------------------------- */}
      {!loadingSlots &&
        slots.length === 0 &&
        date && (
          <p>
            No available slots loaded for this date.
          </p>
        )}

{/* ----------------------------------------------
          SELECTED SLOT
---------------------------------------------- */}
      {selectedSlot && (
        <div style={{ marginTop: "20px" }}>
          <h3>Selected Slot</h3>

          <p>
            {selectedSlot.displayStart} →{" "}
            {selectedSlot.displayEnd}
          </p>

          <button
            type="button"
            onClick={bookSelectedSlot}
            disabled={bookingLoading}
          >
            {bookingLoading
              ? "Reserving..."
              : "Reserve This Slot"}
          </button>
        </div>
      )}

{/* ----------------------------------------------
    AVAILABLE PACKAGES
---------------------------------------------- */}
<div style={{ marginTop: "40px" }}>
  <h2>Available Packages</h2>

  {loadingPackages ? (
    <p>Loading available packages...</p>
  ) : packages.length === 0 ? (
    <p>No packages are currently available.</p>
  ) : (
    <div>
      {packages.map((packageData) => (
        <div
          key={packageData._id}
          style={{
            marginTop: "15px",
            padding: "18px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            maxWidth: "500px",
          }}
        >
          <h3>{packageData.name}</h3>

          {packageData.description && (
            <p>{packageData.description}</p>
          )}

          <p>
            Sessions:{" "}
            <strong>{packageData.sessionCount}</strong>
          </p>

          <p>
            Session duration:{" "}
            <strong>
              {packageData.sessionDuration} minutes
            </strong>
          </p>

          <p>
            Total price:{" "}
            <strong>
              ₹
              {Number(packageData.price).toLocaleString(
                "en-IN"
              )}
            </strong>
          </p>

          <p>
            Per-session rate:{" "}
            <strong>
              ₹
              {Number(
                packageData.perSessionRate
              ).toLocaleString("en-IN")}
            </strong>
          </p>

          <p>
            Valid for:{" "}
            <strong>
              {packageData.validityDays} days
            </strong>
          </p>

          <RazorpayPackageCheckout
            packageId={packageData._id}
            amount={packageData.price}
            onSuccess={handlePackagePaymentSuccess}
         />
        </div>
      ))}
    </div>
  )}
</div>

{/* ----------------------------------------------
    MY PACKAGES
---------------------------------------------- */}
<div style={{ marginTop: "40px" }}>
  <h2>My Packages</h2>

  {loadingMyPackages ? (
    <p>Loading your packages...</p>
  ) : myPackages.length === 0 ? (
    <p>You don't have any purchased packages yet.</p>
  ) : (
    <div>
      {myPackages.map((clientPackage) => (
        <div
          key={clientPackage._id}
          style={{
            marginTop: "15px",
            padding: "18px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            maxWidth: "500px",
          }}
        >
          <h3>
            {clientPackage.package?.name ||
              "Therapy Package"}
          </h3>

          <p>
            Sessions purchased:{" "}
            <strong>
              {clientPackage.sessionsPurchased}
            </strong>
          </p>

          <p>
            Sessions used:{" "}
            <strong>
              {clientPackage.sessionsUsed}
            </strong>
          </p>

          <p>
            Sessions remaining:{" "}
            <strong>
              {clientPackage.sessionsRemaining}
            </strong>
          </p>

          <p>
            Purchased on:{" "}
            <strong>
              {formatDate(clientPackage.purchasedAt)}
            </strong>
          </p>

          <p>
            Expires on:{" "}
            <strong>
              {formatDate(clientPackage.expiresAt)}
            </strong>
          </p>

          <p>
            Status:{" "}
            <strong>
              {clientPackage.status}
            </strong>
          </p>

          {clientPackage.payment?.status ===
            "paid" && (
            <button
              type="button"
              onClick={() =>
                handleDownloadInvoice(
                  clientPackage.payment._id
                )
              }
            >
              📄 Download Invoice
            </button>
          )}
        </div>
      ))}
    </div>
  )}
</div>

{/* ----------------------------------------------
          PAYMENT REQUIRED
---------------------------------------------- */}
      {booking &&
        booking.status === "pending_payment" && (
          <div
            style={{
              marginTop: "30px",
              padding: "20px",
              border: "1px solid #ddd",
              borderRadius: "8px",
            }}
          >
            <h2>Payment Required</h2>

            <p>
              Date:{" "}
              <strong>
                {formatDate(booking.startTime)}
              </strong>
            </p>

            <p>
              Time:{" "}
              <strong>
                {formatTime(booking.startTime)} →{" "}
                {formatTime(booking.endTime)}
              </strong>
            </p>

            <p>
              Session status:{" "}
              <strong>{booking.status}</strong>
            </p>

            <p>
              Amount:{" "}
              <strong>
                ₹
                {Number(
                  booking.payment?.amount || 1500
                ).toLocaleString("en-IN")}
              </strong>
            </p>

            {/* Razorpay payment button */}
            <RazorpayCheckout
              sessionId={booking._id}
              amount={
                booking.payment?.amount || 1500
              }
              onSuccess={handlePaymentSuccess}
            />

            {paymentChecking && (
              <p>
                Checking payment confirmation...
              </p>
            )}
          </div>
        )}

{/* ----------------------------------------------
          MY SESSIONS
---------------------------------------------- */}
  {
      sessions.length > 0 && (
        <div style={{ marginTop: "40px" }}>
          <h2>My Sessions</h2>

          {sessions.map((session) => (
            <div
              key={session._id}
              style={{
                marginBottom: "15px",
                padding: "18px",
                border: "1px solid #ddd",
                borderRadius: "8px",
              }}
            >
          <h3>
             {session.status === "confirmed"
              ? "✅ Confirmed Session"
              : session.status ===
                 "pending_payment"
                   ? "⏳ Payment Pending"
                   : `Session: ${session.status}`}
              </h3>

              <p>
                Date:{" "}
                <strong>
                  {formatDate(session.startTime)}
                </strong>
              </p>

              <p>
                Time:{" "}
                <strong>
                  {formatTime(session.startTime)} →{" "}
                  {formatTime(session.endTime)}
                </strong>
              </p>

              <p>
                Status:{" "}
                <strong>{session.status}</strong>
              </p>

              <p>
                Amount:{" "}
                <strong>
                  ₹
                  {Number(
                    session.payment?.amount ||
                      session.therapist?.sessionPrice ||
                      1500
                  ).toLocaleString("en-IN")}
                </strong>
              </p>

              {/* Invoice is available only for
                  confirmed paid sessions */}
              {session.status === "confirmed" &&
                session.payment?.status === "paid" && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDownloadInvoice(
                        session.payment._id
                      )
                    }
                  >
                    📄 Download Invoice
                  </button>
                )}
            </div>
          ))}
        </div>
      )}

      {/* ----------------------------------------------
          EMPTY SESSION STATE
      ---------------------------------------------- */}
      {!loadingSessions &&
        sessions.length === 0 && (
          <p style={{ marginTop: "30px" }}>
            You don't have any sessions yet.
          </p>
        )}

      {/* ----------------------------------------------
          MESSAGES / ERRORS
      ---------------------------------------------- */}
      {message && (
        <p style={{ marginTop: "20px" }}>
          {message}
        </p>
      )}

      {error && (
        <p style={{ marginTop: "20px" }}>
          {error}
        </p>
      )}
    </div>
  );
}

export default ClientPortal;
