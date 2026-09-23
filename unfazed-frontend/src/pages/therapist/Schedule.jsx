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
    <div>
      <h1>Schedule</h1>

      <p>
        Set your weekly availability so clients can
        book sessions with you.
      </p>

      {message && (
        <p style={{ color: "green" }}>
          {message}
        </p>
      )}

      {error && (
        <p style={{ color: "crimson" }}>
          {error}
        </p>
      )}

      {/* =========================
          WEEKLY AVAILABILITY
      ========================= */}

      <form onSubmit={handleSave}>
        <h2>Weekly Availability</h2>

        <div>
          <label>
            Day
            <br />

            <select
              value={dayOfWeek}
              onChange={(event) =>
                setDayOfWeek(
                  Number(event.target.value)
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
        </div>

        <br />

        <div>
          <label>
            Start time
            <br />

            <input
              type="time"
              value={startTime}
              onChange={(event) =>
                setStartTime(event.target.value)
              }
            />
          </label>
        </div>

        <br />

        <div>
          <label>
            End time
            <br />

            <input
              type="time"
              value={endTime}
              onChange={(event) =>
                setEndTime(event.target.value)
              }
            />
          </label>
        </div>

        <br />

        <div>
          <label>
            Session duration
            <br />

            <select
              value={duration}
              onChange={(event) =>
                setDuration(
                  Number(event.target.value)
                )
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
        </div>

        <br />

        <div>
          <label>
            Buffer between sessions
            <br />

            <select
              value={bufferTime}
              onChange={(event) =>
                setBufferTime(
                  Number(event.target.value)
                )
              }
            >
              <option value={0}>
                No buffer
              </option>

              <option value={5}>
                5 minutes
              </option>

              <option value={10}>
                10 minutes
              </option>

              <option value={15}>
                15 minutes
              </option>

              <option value={30}>
                30 minutes
              </option>
            </select>
          </label>
        </div>

        <br />

        <button
          type="submit"
          disabled={saving}
        >
          {saving
            ? "Saving..."
            : "Add Availability"}
        </button>
      </form>

      <hr />

      {/* =========================
          ONE-TIME AVAILABILITY
      ========================= */}

      <h2>One-Time Availability</h2>

      <p>
        Add a date-specific availability period
        for a single day.
      </p>

      <form onSubmit={handleAddOverride}>
        <div>
          <label>
            Date
            <br />

            <input
              type="date"
              value={overrideDate}
              onChange={(event) =>
                setOverrideDate(
                  event.target.value
                )
              }
            />
          </label>
        </div>

        <br />

        <div>
          <label>
            Start time
            <br />

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
        </div>

        <br />

        <div>
          <label>
            End time
            <br />

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

        <br />

        <button
          type="submit"
          disabled={overrideSaving}
        >
          {overrideSaving
            ? "Saving..."
            : "Add One-Time Availability"}
        </button>
      </form>

      <hr />

      <h2>Blocked Time</h2>

<p>
  Block a specific time so clients cannot book during that period.
</p>

<form onSubmit={handleAddBlockedSlot}>
  <div>
    <label>
      Date
      <br />
      <input
        type="date"
        value={blockedDate}
        onChange={(event) =>
          setBlockedDate(event.target.value)
        }
      />
    </label>
  </div>

  <br />

  <div>
    <label>
      Start time
      <br />
      <input
        type="time"
        value={blockedStartTime}
        onChange={(event) =>
          setBlockedStartTime(event.target.value)
        }
      />
    </label>
  </div>

  <br />

  <div>
    <label>
      End time
      <br />
      <input
        type="time"
        value={blockedEndTime}
        onChange={(event) =>
          setBlockedEndTime(event.target.value)
        }
      />
    </label>
  </div>

  <br />

  <button
    type="submit"
    disabled={blockedSaving}
  >
    {blockedSaving ? "Blocking..." : "Block This Time"}
  </button>
</form>

<hr />

<h2>Upcoming Appointments</h2>

{sessions.length === 0 ? (
  <p>No upcoming appointments yet.</p>
) : (
  <div
    style={{
      display: "grid",
      gap: "12px",
      marginTop: "16px",
    }}
  >
    {sessions.map((session) => (
       <div
         key={session._id}
         style={{
         padding: "18px",
         border: "1px solid #e5e7eb",
         borderRadius: "12px",
         backgroundColor: "#ffffff",
         boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
      }}
>
          <strong
            style={{
                fontSize: "17px",
                color: "#1f2937",
          }}
        >
           {session.client?.name || "Client"}
        </strong>


          <p style={{ margin: "8px 0 4px" }}>
            📅{" "}
            {new Date(session.startTime).toLocaleDateString()}
          </p>

          <p style={{ margin: "4px 0" }}>
            🕐{" "}
            {new Date(session.startTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            –{" "}
            {new Date(session.endTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>

 <p style={{ margin: "8px 0 0" }}>
   Status:{" "}
   <strong
     style={{
       textTransform: "capitalize",
       color: "#2563eb",
    }}
  >
    {session.status.replace("_", " ")}
  </strong>
</p>
      </div>
      ))}
  </div>
)}

<hr />

      {/* ===============================
          CURRENT ONE-TIME AVAILABILITY
         ================================= */}

      <h2>Current One-Time Availability</h2>

      {availabilities.filter(
        (item) => item.type === "override"
      ).length === 0 ? (
        <p>
          No one-time availability added yet.
        </p>
      ) : (
        <ul>
          {availabilities
            .filter(
              (item) => item.type === "override"
            )
            .map((item) => (
              <li key={item._id}>
                {editingOverrideId === item._id ? (
                  <form
                    onSubmit={
                      handleUpdateOverride
                    }
                  >
                    <div>
                      <label>
                        Date
                        <br />

                        <input
                          type="date"
                          value={
                            editingOverrideDate
                          }
                          onChange={(event) =>
                            setEditingOverrideDate(
                              event.target.value
                            )
                          }
                          required
                        />
                      </label>
                    </div>

                    <br />

                    <div>
                      <label>
                        Start time
                        <br />

                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="HH:MM"
                          maxLength={5}
                          value={
                            editingOverrideStart
                          }
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
                    </div>

                    <br />

                    <div>
                      <label>
                        End time
                        <br />

                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="HH:MM"
                          maxLength={5}
                          value={
                            editingOverrideEnd
                          }
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
                    </div>

                    <br />

                    <button
                      type="submit"
                      disabled={
                        editingOverrideSaving
                      }
                    >
                      {editingOverrideSaving
                        ? "Saving..."
                        : "Save Changes"}
                    </button>

                    {" "}

                    <button
                      type="button"
                      onClick={
                        cancelEditingOverride
                      }
                      disabled={
                        editingOverrideSaving
                      }
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <strong>
                      {item.date}
                    </strong>{" "}
                    — {item.startTime} to{" "}
                    {item.endTime}{" "}

                    <button
                      type="button"
                      onClick={() =>
                        startEditingOverride(
                          item
                        )
                      }
                    >
                      Edit
                    </button>

                    {" "}

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(item._id)
                      }
                    >
                      Remove
                    </button>
                  </>
                )}
              </li>
            ))}
        </ul>
      )}

      <hr />

      {/* =========================
          CURRENT WEEKLY AVAILABILITY
      ========================= */}

      <h2>Current Weekly Availability</h2>

      {loading ? (
        <p>Loading availability...</p>
      ) : availabilities.filter(
          (item) => item.type === "weekly"
        ).length === 0 ? (
        <p>
          No weekly availability added yet.
        </p>
      ) : (
        <ul>
          {availabilities
            .filter(
              (item) => item.type === "weekly"
            )
            .map((item) => (
              <li key={item._id}>
                {editingId === item._id ? (
                  <form onSubmit={handleUpdate}>
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

                    {" "}

                    <input
                      type="time"
                      value={editingStart}
                      onChange={(event) =>
                        setEditingStart(
                          event.target.value
                        )
                      }
                    />

                    {" to "}

                    <input
                      type="time"
                      value={editingEnd}
                      onChange={(event) =>
                        setEditingEnd(
                          event.target.value
                        )
                      }
                    />

                    {" "}

                    <button
                      type="submit"
                      disabled={editing}
                    >
                      {editing
                        ? "Saving..."
                        : "Save"}
                    </button>

                    {" "}

                    <button
                      type="button"
                      onClick={cancelEditing}
                      disabled={editing}
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <strong>
                      {getDayName(
                        item.dayOfWeek
                      )}
                    </strong>{" "}
                    — {item.startTime} to{" "}
                    {item.endTime}{" "}

                    <button
                      type="button"
                      onClick={() =>
                        startEditing(item)
                      }
                    >
                      Edit
                    </button>

                    {" "}

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(item._id)
                      }
                    >
                      Remove
                    </button>
                  </>
                )}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

export default Schedule;