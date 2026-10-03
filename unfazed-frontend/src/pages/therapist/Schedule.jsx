import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";

const DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

const DURATIONS = [30, 45, 60, 90];

function isValidTime(time) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
}

function isEndAfterStart(startTime, endTime) {
  if (!isValidTime(startTime) || !isValidTime(endTime)) {
    return false;
  }

  const [startHours, startMinutes] = startTime
    .split(":")
    .map(Number);

  const [endHours, endMinutes] = endTime
    .split(":")
    .map(Number);

  const startTotalMinutes =
    startHours * 60 + startMinutes;

  const endTotalMinutes =
    endHours * 60 + endMinutes;

  return endTotalMinutes > startTotalMinutes;
}

function Schedule() {
  const [availabilities, setAvailabilities] = useState([]);
  const [sessions, setSessions] = useState([]);

  // Weekly availability
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");

  const [duration, setDuration] = useState(60);
  const [bufferTime, setBufferTime] = useState(0);

  // One-time availability
  const [overrideDate, setOverrideDate] = useState("");
  const [overrideStartTime, setOverrideStartTime] =
    useState("14:00");
  const [overrideEndTime, setOverrideEndTime] =
    useState("17:00");
 const [blockedDate, setBlockedDate] = useState("");
const [blockedStartTime, setBlockedStartTime] = useState("10:00");
const [blockedEndTime, setBlockedEndTime] = useState("11:00");
const [blockedSaving, setBlockedSaving] = useState(false);

  const [overrideSaving, setOverrideSaving] =
    useState(false);

  // Weekly editing
  const [editingId, setEditingId] = useState(null);
  const [editingDay, setEditingDay] = useState(1);
  const [editingStart, setEditingStart] =
    useState("09:00");
  const [editingEnd, setEditingEnd] =
    useState("12:00");

  // One-time editing
  const [editingOverrideId, setEditingOverrideId] =
    useState(null);

  const [editingOverrideDate, setEditingOverrideDate] =
    useState("");

  const [editingOverrideStart, setEditingOverrideStart] =
    useState("14:00");

  const [editingOverrideEnd, setEditingOverrideEnd] =
    useState("17:00");

  const [editingOverrideSaving, setEditingOverrideSaving] =
    useState(false);

  // General state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadSchedule = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axiosInstance.get(
        "/availability"
      );

      setAvailabilities(
        response.data.availabilities || []
      );

      const sessionsResponse = await axiosInstance.get("/sessions");

       setSessions(sessionsResponse.data.sessions || []);

       

    } catch (err) {
      console.error(
        "Failed to load availability:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load your availability."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  // -----------------------------
  // ADD WEEKLY AVAILABILITY
  // -----------------------------
  const handleSave = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      setError("Please enter valid times in HH:MM format.");
      return;
    }

    if (!isEndAfterStart(startTime, endTime)) {
      setError("End time must be after start time.");
      return;
    }

    try {
      setSaving(true);

      await axiosInstance.post("/availability", {
        dayOfWeek,
        startTime,
        endTime,
        timezone: "Asia/Kolkata",
        type: "weekly",
        isActive: true,
      });

      setMessage(
        "Weekly availability saved successfully."
      );

      await loadSchedule();
    } catch (err) {
      console.error(
        "Failed to save availability:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to save availability."
      );
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------
  // ADD ONE-TIME AVAILABILITY
  // -----------------------------
  const handleAddOverride = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!overrideDate) {
      setError(
        "Please select a date for the override."
      );
      return;
    }

    if (
      !isValidTime(overrideStartTime) ||
      !isValidTime(overrideEndTime)
    ) {
      setError(
        "Please enter valid times in HH:MM format."
      );
      return;
    }

    if (
      !isEndAfterStart(
        overrideStartTime,
        overrideEndTime
      )
    ) {
      setError("End time must be after start time.");
      return;
    }

    try {
      setOverrideSaving(true);

      await axiosInstance.post("/availability", {
        date: overrideDate,
        startTime: overrideStartTime,
        endTime: overrideEndTime,
        timezone: "Asia/Kolkata",
        type: "override",
        isActive: true,
      });

      setMessage(
        "One-time availability saved successfully."
      );

      await loadSchedule();
    } catch (err) {
      console.error(
        "Failed to save one-time availability:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to save one-time availability."
      );
    } finally {
      setOverrideSaving(false);
    }
  };

  const handleAddBlockedSlot = async (event) => {
  event.preventDefault();

  setMessage("");
  setError("");

  if (!blockedDate) {
    setError("Please select a date for the blocked slot.");
    return;
  }

  if (blockedStartTime >= blockedEndTime) {
    setError("End time must be after start time.");
    return;
  }

  try {
    setBlockedSaving(true);

    await axiosInstance.post("/availability", {
      date: blockedDate,
      startTime: blockedStartTime,
      endTime: blockedEndTime,
      timezone: "Asia/Kolkata",
      type: "blocked",
      isActive: true,
    });

    setMessage("Blocked time saved successfully.");

    await loadSchedule();
  } catch (err) {
    console.error("Failed to save blocked time:", err);

    setError(
      err.response?.data?.message ||
        "Failed to save blocked time."
    );
  } finally {
    setBlockedSaving(false);
  }
};

  // -----------------------------
  // START WEEKLY EDITING
  // -----------------------------
  const startEditing = (availability) => {
    setMessage("");
    setError("");

    setEditingId(availability._id);
    setEditingDay(availability.dayOfWeek);
    setEditingStart(availability.startTime);
    setEditingEnd(availability.endTime);

    setEditingOverrideId(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  // -----------------------------
  // UPDATE WEEKLY AVAILABILITY
  // -----------------------------
  const handleUpdate = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (
      !isValidTime(editingStart) ||
      !isValidTime(editingEnd)
    ) {
      setError("Please enter valid times in HH:MM format.");
      return;
    }

    if (
      !isEndAfterStart(editingStart, editingEnd)
    ) {
      setError("End time must be after start time.");
      return;
    }

    try {
      setEditing(true);

      await axiosInstance.put(
        `/availability/${editingId}`,
        {
          dayOfWeek: editingDay,
          startTime: editingStart,
          endTime: editingEnd,
          type: "weekly",
        }
      );

      setMessage(
        "Availability updated successfully."
      );

      setEditingId(null);

      await loadSchedule();
    } catch (err) {
      console.error(
        "Failed to update availability:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to update availability."
      );
    } finally {
      setEditing(false);
    }
  };

  // -----------------------------
  // START ONE-TIME EDITING
  // -----------------------------
  const startEditingOverride = (availability) => {
    setMessage("");
    setError("");

    setEditingOverrideId(availability._id);

    setEditingOverrideDate(
      availability.date
    );

    setEditingOverrideStart(
      availability.startTime
    );

    setEditingOverrideEnd(
      availability.endTime
    );

    setEditingId(null);
  };

  const cancelEditingOverride = () => {
    setEditingOverrideId(null);
  };

  // -----------------------------
  // UPDATE ONE-TIME AVAILABILITY
  // -----------------------------
  const handleUpdateOverride = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!editingOverrideDate) {
      setError("Please select a date.");
      return;
    }

    if (
      !isValidTime(editingOverrideStart) ||
      !isValidTime(editingOverrideEnd)
    ) {
      setError(
        "Please enter valid times in HH:MM format."
      );
      return;
    }

    if (
      !isEndAfterStart(
        editingOverrideStart,
        editingOverrideEnd
      )
    ) {
      setError("End time must be after start time.");
      return;
    }

    try {
      setEditingOverrideSaving(true);

      await axiosInstance.put(
        `/availability/${editingOverrideId}`,
        {
          date: editingOverrideDate,
          startTime: editingOverrideStart,
          endTime: editingOverrideEnd,
          timezone: "Asia/Kolkata",
          type: "override",
        }
      );

      setMessage(
        "One-time availability updated successfully."
      );

      setEditingOverrideId(null);

      await loadSchedule();
    } catch (err) {
      console.error(
        "Failed to update one-time availability:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to update one-time availability."
      );
    } finally {
      setEditingOverrideSaving(false);
    }
  };

  // -----------------------------
  // DELETE AVAILABILITY
  // -----------------------------
  const handleDelete = async (id) => {
    try {
      setMessage("");
      setError("");

      await axiosInstance.delete(
        `/availability/${id}`
      );

      setMessage(
        "Availability removed successfully."
      );

      await loadSchedule();
    } catch (err) {
      console.error(
        "Failed to delete availability:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to remove availability."
      );
    }
  };

  const getDayName = (day) => {
    return (
      DAYS.find((item) => item.value === day)
        ?.label || "Unknown"
    );
  };

   return (
    <div className="uf-schedule-page">
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}
      <section className="uf-page-header uf-schedule-header">
        <div>
          <span className="uf-eyebrow">Practice calendar</span>

          <h1>Schedule</h1>

          <p>
            Shape your availability, manage booking windows,
            and keep your upcoming sessions organized.
          </p>
        </div>

        <div className="uf-schedule-header-badge">
          <span className="uf-schedule-header-dot" />
          <div>
            <strong>Availability</strong>
            <span>Your booking hours</span>
          </div>
        </div>
      </section>

      {/* =====================================================
          MESSAGES
      ====================================================== */}
      {message && (
        <div className="uf-schedule-alert success">
          <span>✓</span>
          <p>{message}</p>
        </div>
      )}

      {error && (
        <div className="uf-schedule-alert error">
          <span>!</span>
          <p>{error}</p>
        </div>
      )}

      {/* =====================================================
          AVAILABILITY SETUP
      ====================================================== */}
      <section className="uf-schedule-builder">
        <div className="uf-schedule-builder-intro">
          <div className="uf-schedule-section-icon">◷</div>

          <div>
            <span className="uf-section-kicker">
              Booking setup
            </span>

            <h2>Set your availability</h2>

            <p>
              Create the regular hours clients can book with
              you each week.
            </p>
          </div>
        </div>

        <form
          className="uf-schedule-form"
          onSubmit={handleSave}
        >
          <div className="uf-schedule-form-grid">
            <label className="uf-schedule-field">
              <span>Day</span>

              <select
                value={dayOfWeek}
                onChange={(event) =>
                  setDayOfWeek(Number(event.target.value))
                }
              >
                {DAYS.map((day) => (
                  <option
                    key={day.value}
                    value={day.value}
                  >
                    {day.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="uf-schedule-field">
              <span>Start time</span>

              <input
                type="time"
                value={startTime}
                onChange={(event) =>
                  setStartTime(event.target.value)
                }
              />
            </label>

            <label className="uf-schedule-field">
              <span>End time</span>

              <input
                type="time"
                value={endTime}
                onChange={(event) =>
                  setEndTime(event.target.value)
                }
              />
            </label>

            <label className="uf-schedule-field">
              <span>Session duration</span>

              <select
                value={duration}
                onChange={(event) =>
                  setDuration(Number(event.target.value))
                }
              >
                {DURATIONS.map((minutes) => (
                  <option
                    key={minutes}
                    value={minutes}
                  >
                    {minutes} minutes
                  </option>
                ))}
              </select>
            </label>

            <label className="uf-schedule-field">
              <span>Buffer between sessions</span>

              <select
                value={bufferTime}
                onChange={(event) =>
                  setBufferTime(Number(event.target.value))
                }
              >
                <option value={0}>No buffer</option>
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
              </select>
            </label>

            <div className="uf-schedule-form-action">
              <button
                type="submit"
                className="uf-schedule-primary-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Add availability"}
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* =====================================================
          SPECIAL AVAILABILITY
      ====================================================== */}
      <section className="uf-schedule-special-grid">
        {/* One-time availability */}
        <article className="uf-schedule-card">
          <div className="uf-schedule-card-heading">
            <div className="uf-schedule-card-icon rose">
              +
            </div>

            <div>
              <h2>One-time availability</h2>

              <p>
                Open a special booking window for a
                particular date.
              </p>
            </div>
          </div>

          <form
            className="uf-schedule-card-form"
            onSubmit={handleAddOverride}
          >
            <label className="uf-schedule-field">
              <span>Date</span>

              <input
                type="date"
                value={overrideDate}
                onChange={(event) =>
                  setOverrideDate(event.target.value)
                }
              />
            </label>

            <div className="uf-schedule-two-fields">
              <label className="uf-schedule-field">
                <span>Start</span>

                <input
                  type="time"
                  value={overrideStartTime}
                  onChange={(event) =>
                    setOverrideStartTime(
                      event.target.value
                    )
                  }
                />
              </label>

              <label className="uf-schedule-field">
                <span>End</span>

                <input
                  type="time"
                  value={overrideEndTime}
                  onChange={(event) =>
                    setOverrideEndTime(
                      event.target.value
                    )
                  }
                />
              </label>
            </div>

            <button
              type="submit"
              className="uf-schedule-secondary-button"
              disabled={overrideSaving}
            >
              {overrideSaving
                ? "Saving..."
                : "Add one-time availability"}
            </button>
          </form>
        </article>

        {/* Blocked time */}
        <article className="uf-schedule-card">
          <div className="uf-schedule-card-heading">
            <div className="uf-schedule-card-icon dark">
              −
            </div>

            <div>
              <h2>Blocked time</h2>

              <p>
                Prevent clients from booking a specific
                time period.
              </p>
            </div>
          </div>

          <form
            className="uf-schedule-card-form"
            onSubmit={handleAddBlockedSlot}
          >
            <label className="uf-schedule-field">
              <span>Date</span>

              <input
                type="date"
                value={blockedDate}
                onChange={(event) =>
                  setBlockedDate(event.target.value)
                }
              />
            </label>

            <div className="uf-schedule-two-fields">
              <label className="uf-schedule-field">
                <span>Start</span>

                <input
                  type="time"
                  value={blockedStartTime}
                  onChange={(event) =>
                    setBlockedStartTime(
                      event.target.value
                    )
                  }
                />
              </label>

              <label className="uf-schedule-field">
                <span>End</span>

                <input
                  type="time"
                  value={blockedEndTime}
                  onChange={(event) =>
                    setBlockedEndTime(
                      event.target.value
                    )
                  }
                />
              </label>
            </div>

            <button
              type="submit"
              className="uf-schedule-dark-button"
              disabled={blockedSaving}
            >
              {blockedSaving
                ? "Blocking..."
                : "Block this time"}
            </button>
          </form>
        </article>
      </section>

      {/* =====================================================
          UPCOMING APPOINTMENTS
      ====================================================== */}
      <section className="uf-schedule-list-section">
        <div className="uf-schedule-list-heading">
          <div>
            <span className="uf-section-kicker">
              Your calendar
            </span>

            <h2>Upcoming appointments</h2>

            <p>
              Sessions currently scheduled with your
              clients.
            </p>
          </div>

          <div className="uf-schedule-count">
            {sessions.length}
            <span>
              {sessions.length === 1
                ? "session"
                : "sessions"}
            </span>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="uf-schedule-empty">
            <div className="uf-schedule-empty-icon">
              ◷
            </div>

            <h3>No upcoming appointments</h3>

            <p>
              Your scheduled client sessions will appear
              here.
            </p>
          </div>
        ) : (
          <div className="uf-appointment-grid">
            {sessions.map((session) => (
              <article
                key={session._id}
                className="uf-appointment-card"
              >
                <div className="uf-appointment-top">
                  <div className="uf-appointment-avatar">
                    {session.client?.name
                      ?.charAt(0)
                      .toUpperCase() || "C"}
                  </div>

                  <span className="uf-appointment-status">
                    {session.status.replace("_", " ")}
                  </span>
                </div>

                <div className="uf-appointment-client">
                  <h3>
                    {session.client?.name || "Client"}
                  </h3>

                  <p>Therapy session</p>
                </div>

                <div className="uf-appointment-details">
                  <div>
                    <span>DATE</span>
                    <strong>
                      {new Date(
                        session.startTime
                      ).toLocaleDateString()}
                    </strong>
                  </div>

                  <div>
                    <span>TIME</span>
                    <strong>
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
                    </strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* =====================================================
          CURRENT ONE-TIME AVAILABILITY
      ====================================================== */}
      <section className="uf-schedule-list-section">
        <div className="uf-schedule-list-heading">
          <div>
            <span className="uf-section-kicker">
              Special hours
            </span>

            <h2>Current one-time availability</h2>

            <p>
              Date-specific booking windows currently
              available to clients.
            </p>
          </div>
        </div>

        {availabilities.filter(
          (item) => item.type === "override"
        ).length === 0 ? (
          <div className="uf-schedule-inline-empty">
            No one-time availability added yet.
          </div>
        ) : (
          <div className="uf-availability-list">
            {availabilities
              .filter(
                (item) => item.type === "override"
              )
              .map((item) => (
                <article
                  key={item._id}
                  className="uf-availability-row"
                >
                  {editingOverrideId === item._id ? (
                    <form
                      className="uf-edit-availability"
                      onSubmit={handleUpdateOverride}
                    >
                      <label className="uf-schedule-field">
                        <span>Date</span>

                        <input
                          type="date"
                          value={editingOverrideDate}
                          onChange={(event) =>
                            setEditingOverrideDate(
                              event.target.value
                            )
                          }
                          required
                        />
                      </label>

                      <label className="uf-schedule-field">
                        <span>Start</span>

                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="HH:MM"
                          maxLength={5}
                          value={editingOverrideStart}
                          onChange={(event) =>
                            setEditingOverrideStart(
                              event.target.value
                                .replace(
                                  /[^0-9:]/g,
                                  ""
                                )
                                .slice(0, 5)
                            )
                          }
                          required
                        />
                      </label>

                      <label className="uf-schedule-field">
                        <span>End</span>

                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="HH:MM"
                          maxLength={5}
                          value={editingOverrideEnd}
                          onChange={(event) =>
                            setEditingOverrideEnd(
                              event.target.value
                                .replace(
                                  /[^0-9:]/g,
                                  ""
                                )
                                .slice(0, 5)
                            )
                          }
                          required
                        />
                      </label>

                      <div className="uf-inline-actions">
                        <button
                          type="submit"
                          className="uf-schedule-primary-button"
                          disabled={
                            editingOverrideSaving
                          }
                        >
                          {editingOverrideSaving
                            ? "Saving..."
                            : "Save changes"}
                        </button>

                        <button
                          type="button"
                          className="uf-schedule-cancel-button"
                          onClick={
                            cancelEditingOverride
                          }
                          disabled={
                            editingOverrideSaving
                          }
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="uf-availability-date">
                        <span className="uf-availability-calendar">
                          ◷
                        </span>

                        <div>
                          <strong>{item.date}</strong>
                          <span>
                            {item.startTime} –{" "}
                            {item.endTime}
                          </span>
                        </div>
                      </div>

                      <div className="uf-inline-actions">
                        <button
                          type="button"
                          className="uf-schedule-edit-button"
                          onClick={() =>
                            startEditingOverride(item)
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="uf-schedule-remove-button"
                          onClick={() =>
                            handleDelete(item._id)
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </>
                  )}
                </article>
              ))}
          </div>
        )}
      </section>

      {/* =====================================================
          CURRENT WEEKLY AVAILABILITY
      ====================================================== */}
      <section className="uf-schedule-list-section">
        <div className="uf-schedule-list-heading">
          <div>
            <span className="uf-section-kicker">
              Recurring hours
            </span>

            <h2>Current weekly availability</h2>

            <p>
              Your regular weekly booking schedule.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="uf-schedule-inline-empty">
            Loading availability...
          </div>
        ) : availabilities.filter(
            (item) => item.type === "weekly"
          ).length === 0 ? (
          <div className="uf-schedule-inline-empty">
            No weekly availability added yet.
          </div>
        ) : (
          <div className="uf-weekly-list">
            {availabilities
              .filter(
                (item) => item.type === "weekly"
              )
              .map((item) => (
                <article
                  key={item._id}
                  className="uf-weekly-row"
                >
                  {editingId === item._id ? (
                    <form
                      className="uf-edit-availability"
                      onSubmit={handleUpdate}
                    >
                      <label className="uf-schedule-field">
                        <span>Day</span>

                        <select
                          value={editingDay}
                          onChange={(event) =>
                            setEditingDay(
                              Number(
                                event.target.value
                              )
                            )
                          }
                        >
                          {DAYS.map((day) => (
                            <option
                              key={day.value}
                              value={day.value}
                            >
                              {day.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="uf-schedule-field">
                        <span>Start</span>

                        <input
                          type="time"
                          value={editingStart}
                          onChange={(event) =>
                            setEditingStart(
                              event.target.value
                            )
                          }
                        />
                      </label>

                      <label className="uf-schedule-field">
                        <span>End</span>

                        <input
                          type="time"
                          value={editingEnd}
                          onChange={(event) =>
                            setEditingEnd(
                              event.target.value
                            )
                          }
                        />
                      </label>

                      <div className="uf-inline-actions">
                        <button
                          type="submit"
                          className="uf-schedule-primary-button"
                          disabled={editing}
                        >
                          {editing
                            ? "Saving..."
                            : "Save changes"}
                        </button>

                        <button
                          type="button"
                          className="uf-schedule-cancel-button"
                          onClick={cancelEditing}
                          disabled={editing}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="uf-weekly-day">
                        <span className="uf-weekly-day-icon">
                          ◷
                        </span>

                        <div>
                          <strong>
                            {getDayName(
                              item.dayOfWeek
                            )}
                          </strong>

                          <span>
                            {item.startTime} –{" "}
                            {item.endTime}
                          </span>
                        </div>
                      </div>

                      <div className="uf-inline-actions">
                        <button
                          type="button"
                          className="uf-schedule-edit-button"
                          onClick={() =>
                            startEditing(item)
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="uf-schedule-remove-button"
                          onClick={() =>
                            handleDelete(item._id)
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </>
                  )}
                </article>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Schedule;