import { useState } from "react";
import axiosInstance from "../../api/axiosInstance";

function BookingPage() {
    
  const [therapistId, setTherapistId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booking, setBooking] = useState(null);
const [bookingLoading, setBookingLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
    
  const handleLoadSlots = async () => {
    setError("");
    setMessage("");
    setSlots([]);

    if (!therapistId) {
      setError("Please enter the therapist ID.");
      return;
    }

    if (!selectedDate) {
      setError("Please select a date.");
      return;
    }

    try {
      setLoading(true);

      const response = await axiosInstance.get(
        `/client-booking/therapist/${therapistId}/slots`,
        {
          params: {
            date: selectedDate,
          },
        }
      );

      setSlots(response.data?.slots || []);
    } catch (err) {
      console.error("Failed to load available slots:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load available slots."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlot = async () => {
  if (!selectedSlot || !therapistId) {
    return;
  }

  try {
    setBookingLoading(true);
    setError("");
    setMessage("");

    const response = await axiosInstance.post(
      `/client-booking/therapist/${therapistId}/book`,
      {
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      }
    );

    setBooking(response.data.session);
    setMessage("Slot reserved successfully. Please complete payment.");

    setSlots((currentSlots) =>
      currentSlots.filter(
        (slot) => slot.startTime !== selectedSlot.startTime
      )
    );

    setSelectedSlot(null);
  } catch (err) {
    console.error("Failed to book slot:", err);

    setError(
      err.response?.data?.message ||
        "Failed to book the selected slot."
    );
  } finally {
    setBookingLoading(false);
  }
};

  return (
    <div>
      <h1>Book a Therapy Session</h1>

      <p>Select a date to view available therapy slots.</p>

      <div>
        <label>
          Therapist ID
          <br />
          <input
            type="text"
            value={therapistId}
            onChange={(event) =>
              setTherapistId(event.target.value)
            }
            placeholder="Enter therapist ID"
          />
        </label>
      </div>

      <br />

      <div>
        <label>
          Date
          <br />
          <input
            type="date"
            value={selectedDate}
            onChange={(event) =>
              setSelectedDate(event.target.value)
            }
          />
        </label>
      </div>
          
            <button
        type="button"
        onClick={handleLoadSlots}
        disabled={loading}
      >
        {loading ? "Loading..." : "View Available Slots"}
      </button>

      <br />
      <br />

      {loading && <p>Loading available slots...</p>}

      {error && <p>{error}</p>}

      {message && <p>{message}</p>}

{booking && (
  <div
    style={{
      marginTop: "20px",
      padding: "20px",
      border: "1px solid #ddd",
      borderRadius: "12px",
    }}
  >
    <h2>Booking Confirmed</h2>

    <p>
      <strong>Status:</strong> {booking.status}
    </p>

    <p>
      Your session has been reserved successfully.
    </p>

    <p>
      Please complete payment to confirm your appointment.
    </p>
  </div>
)}
       
      {selectedSlot && (
  <div>
    <p>
      Selected: {selectedSlot.displayStart} - {selectedSlot.displayEnd}
    </p>

    <button
  type="button"
  onClick={handleBookSlot}
  disabled={bookingLoading}
>
  {bookingLoading ? "Booking..." : "Book This Slot"}
</button>
  </div>
)}

      {slots.length > 0 && (
        <div>
          <h2>Available Slots</h2>

          {slots.map((slot) => (
  <button
  key={slot.startTime}
  type="button"
 onClick={() => setSelectedSlot(slot)}
  style={{
    display: "block",
    marginBottom: "10px",
    padding: "10px 16px",
    cursor: "pointer",
  }}
>
  {slot.displayStart} - {slot.displayEnd}
</button>
          ))}
        </div>
      )}
    </div>
  );
}

export default BookingPage;