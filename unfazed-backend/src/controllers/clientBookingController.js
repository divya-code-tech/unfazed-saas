import Availability from "../models/Availability.js";
import Session from "../models/Session.js";
import Therapist from "../models/Therapist.js";
import Client from "../models/Client.js";

/**
 * Convert a local date/time in a specific IANA timezone to a UTC Date.
 * Example:
 * 2026-09-08 10:00 in Asia/Kolkata
 * corresponding UTC Date
 */
const localDateTimeToUtc = (dateString, timeString, timeZone) => {
  const [year, month, day] = dateString.split("-").map(Number);
  const [hours, minutes] = timeString.split(":").map(Number);

  let utcGuess = new Date(
    Date.UTC(year, month - 1, day, hours, minutes, 0, 0)
  );

  for (let i = 0; i < 3; i += 1) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(utcGuess);

    const values = {};

    for (const part of parts) {
      if (part.type !== "literal") {
        values[part.type] = Number(part.value);
      }
    }

    const localAsUtc = Date.UTC(
      values.year,
      values.month - 1,
      values.day,
      values.hour,
      values.minute,
      values.second
    );

    const offset = localAsUtc - utcGuess.getTime();

    utcGuess = new Date(
      Date.UTC(year, month - 1, day, hours, minutes, 0, 0) - offset
    );
  }

  return utcGuess;
};

const isValidTimeZone = (timeZone) => {
  try {
    Intl.DateTimeFormat("en-US", {
      timeZone,
    }).format();

    return true;
  } catch (error) {
    return false;
  }
};

const formatForClientTimezone = (date, timeZone) => {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(date);
};

const getDayOfWeek = (dateString) => {
  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(
    Date.UTC(year, month - 1, day)
  ).getUTCDay();
};

export const getAvailableSlots = async (req, res, next) => {
  try {
    const { therapistId } = req.params;
    const { date, timezone } = req.query;

    if (!therapistId || !date) {
      return res.status(400).json({
        success: false,
        message: "Therapist ID and date are required",
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Date must use YYYY-MM-DD format",
      });
    }

    const therapist = await Therapist.findOne({
      _id: therapistId,
      isActive: true,
    }).select(
      "name sessionDuration bufferTime timezone sessionPrice"
    );

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: "Therapist not found",
      });
    }

    const therapistTimezone =
      therapist.timezone || "Asia/Kolkata";

    const clientTimezone =
      timezone || therapistTimezone;

    if (!isValidTimeZone(therapistTimezone)) {
      return res.status(500).json({
        success: false,
        message: "Therapist timezone configuration is invalid",
      });
    }

    if (!isValidTimeZone(clientTimezone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid client timezone",
      });
    }

    const dayOfWeek = getDayOfWeek(date);

    // Get the therapist's normal weekly availability.
    const weeklyAvailabilities = await Availability.find({
      therapist: therapist._id,
      type: "weekly",
      dayOfWeek,
      isActive: true,
    }).sort({
      startTime: 1,
    });

    // Get any date-specific override.
    const dateOverrides = await Availability.find({
      therapist: therapist._id,
      type: "override",
      date,
      isActive: true,
    }).sort({
      startTime: 1,
    });

    // Get date-specific blocked periods.
    const blockedPeriods = await Availability.find({
      therapist: therapist._id,
      type: "blocked",
      date,
      isActive: true,
    }).sort({
      startTime: 1,
    });

    /*
      If a date-specific override exists, it replaces the
      normal weekly availability for that date.

      Otherwise, use the normal weekly availability.
    */
    const availabilities =
      dateOverrides.length > 0
        ? dateOverrides
        : weeklyAvailabilities;

    if (availabilities.length === 0) {
      return res.status(200).json({
        success: true,
        date,
        therapistTimezone,
        clientTimezone,
        sessionDuration: therapist.sessionDuration,
        bufferTime: therapist.bufferTime,
        slots: [],
      });
    }

    const dayStart = localDateTimeToUtc(
      date,
      "00:00",
      therapistTimezone
    );

    const dayEnd = localDateTimeToUtc(
      date,
      "23:59",
      therapistTimezone
    );

    // Get sessions already booked for this therapist on this date.
    const existingSessions = await Session.find({
      therapist: therapist._id,
      status: {
        $nin: ["cancelled", "no_show"],
      },
      startTime: {
        $lt: dayEnd,
      },
      endTime: {
        $gt: dayStart,
      },
    }).select("startTime endTime");

    const duration = Number(therapist.sessionDuration);
    const buffer = Number(therapist.bufferTime) || 0;

    const slots = [];

    for (const availability of availabilities) {
      let slotStart = localDateTimeToUtc(
        date,
        availability.startTime,
        therapistTimezone
      );

      const availabilityEnd = localDateTimeToUtc(
        date,
        availability.endTime,
        therapistTimezone
      );

      while (true) {
        const slotEnd = new Date(
          slotStart.getTime() +
            duration * 60 * 1000
        );

        // Stop generating slots when the session
        // would extend beyond the availability window.
        if (slotEnd > availabilityEnd) {
          break;
        }

        // Check whether this slot overlaps
        // with an already booked session.
        const overlapsExistingSession =
          existingSessions.some(
            (session) =>
              slotStart < session.endTime &&
              slotEnd > session.startTime
          );

        // Check whether this slot overlaps
        // with a blocked period.
        const overlapsBlockedPeriod =
          blockedPeriods.some((blocked) => {
            const blockedStart = localDateTimeToUtc(
              date,
              blocked.startTime,
              therapistTimezone
            );

            const blockedEnd = localDateTimeToUtc(
              date,
              blocked.endTime,
              therapistTimezone
            );

            return (
              slotStart < blockedEnd &&
              slotEnd > blockedStart
            );
          });

        // Only expose the slot if it is not booked
        // and not blocked.
        if (
          !overlapsExistingSession &&
          !overlapsBlockedPeriod
        ) {
          slots.push({
            startTime: slotStart.toISOString(),
            endTime: slotEnd.toISOString(),

            displayStart: formatForClientTimezone(
              slotStart,
              clientTimezone
            ),

            displayEnd: formatForClientTimezone(
              slotEnd,
              clientTimezone
            ),

            therapistTimezone,
            clientTimezone,
            duration,
          });
        }

        // Move to the next slot using session duration
        // plus the configured buffer time.
        slotStart = new Date(
          slotStart.getTime() +
            (duration + buffer) * 60 * 1000
        );
      }
    }

    return res.status(200).json({
      success: true,

      therapist: {
        id: therapist._id,
        name: therapist.name,
      },

      date,
      therapistTimezone,
      clientTimezone,

      sessionDuration: duration,
      bufferTime: buffer,
      sessionPrice: therapist.sessionPrice,

      slots,
    });
  } catch (error) {
    next(error);
  }
};

export const bookSession = async (req, res, next) => {
  try {
    const { therapistId } = req.params;
    const { startTime, endTime } = req.body;

    if (!therapistId || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Therapist ID, start time and end time are required",
      });
    }

    const therapist = await Therapist.findOne({
      _id: therapistId,
      isActive: true,
    }).select(
      "sessionDuration bufferTime timezone sessionPrice"
    );

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: "Therapist not found",
      });
    }

    const sessionStart = new Date(startTime);
    const sessionEnd = new Date(endTime);

    if (
      Number.isNaN(sessionStart.getTime()) ||
      Number.isNaN(sessionEnd.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid start time or end time",
      });
    }

    if (sessionEnd <= sessionStart) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time",
      });
    }

    const calculatedDuration = Math.round(
      (sessionEnd.getTime() - sessionStart.getTime()) /
        (1000 * 60)
    );

    if (
      calculatedDuration !==
      Number(therapist.sessionDuration)
    ) {
      return res.status(400).json({
        success: false,
        message: `Session must be ${therapist.sessionDuration} minutes`,
      });
    }

    /*
      Convert the requested session time into the
      therapist's local timezone.
    */

    const therapistDayName =
      sessionStart.toLocaleDateString("en-US", {
        weekday: "short",
        timeZone: therapist.timezone,
      });

    const dayMap = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };

    const therapistDayOfWeek =
      dayMap[therapistDayName];

    const therapistLocalDate =
      new Intl.DateTimeFormat("en-CA", {
        timeZone: therapist.timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(sessionStart);

    const therapistLocalStartTime =
      new Intl.DateTimeFormat("en-GB", {
        timeZone: therapist.timezone,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(sessionStart);

    const therapistLocalEndTime =
      new Intl.DateTimeFormat("en-GB", {
        timeZone: therapist.timezone,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(sessionEnd);

    /*
      Find the therapist's normal weekly availability.
    */

    const weeklyAvailabilities =
      await Availability.find({
        therapist: therapist._id,
        type: "weekly",
        dayOfWeek: therapistDayOfWeek,
        isActive: true,
      }).sort({
        startTime: 1,
      });

    /*
      Find any date-specific override.
    */

    const dateOverrides =
      await Availability.find({
        therapist: therapist._id,
        type: "override",
        date: therapistLocalDate,
        isActive: true,
      }).sort({
        startTime: 1,
      });

    /*
      Find any blocked periods for this date.
    */

    const blockedPeriods =
      await Availability.find({
        therapist: therapist._id,
        type: "blocked",
        date: therapistLocalDate,
        isActive: true,
      }).sort({
        startTime: 1,
      });

    /*
      If an override exists, it replaces the
      normal weekly availability for this date.
    */

    const availabilities =
      dateOverrides.length > 0
        ? dateOverrides
        : weeklyAvailabilities;

    /*
      Check whether the requested session falls
      inside one of the therapist's available periods.
    */

    const isWithinAvailability =
      availabilities.some((availability) => {
        return (
          therapistLocalStartTime >=
            availability.startTime &&
          therapistLocalEndTime <=
            availability.endTime
        );
      });

    if (!isWithinAvailability) {
      return res.status(400).json({
        success: false,
        message:
          "Selected time is outside the therapist's availability",
      });
    }

    /*
      A blocked period must always prevent booking,
      even when the time is inside an availability window.
    */

    const overlapsBlockedPeriod =
      blockedPeriods.some((blocked) => {
        return (
          therapistLocalStartTime <
            blocked.endTime &&
          therapistLocalEndTime >
            blocked.startTime
        );
      });

    if (overlapsBlockedPeriod) {
      return res.status(409).json({
        success: false,
        message:
          "This time slot is blocked by the therapist",
      });
    }

    /*
      Find the client making the booking.
    */

    const client = await Client.findById(req.user.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    /*
      Make sure the client belongs to this therapist.
    */

    if (
      client.therapist.toString() !==
      therapist._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to book with this therapist",
      });
    }

    /*
      Prevent double booking.

      Cancelled, rescheduled and no-show sessions
      do not block the slot.
    */

    const overlappingSession =
      await Session.findOne({
        therapist: therapist._id,
        status: {
          $nin: [
            "cancelled",
            "rescheduled",
            "no_show",
          ],
        },
        startTime: {
          $lt: sessionEnd,
        },
        endTime: {
          $gt: sessionStart,
        },
      });

    if (overlappingSession) {
      return res.status(409).json({
        success: false,
        message:
          "This time slot is no longer available",
      });
    }

    /*
      Prevent the same client from creating
      duplicate pending bookings for the same slot.
    */

    const existingPendingBooking =
      await Session.findOne({
        therapist: therapist._id,
        client: client._id,
        status: "pending_payment",
        startTime: sessionStart,
        endTime: sessionEnd,
      });

    if (existingPendingBooking) {
      return res.status(409).json({
        success: false,
        message:
          "You already have a pending booking for this slot",
        session: existingPendingBooking,
      });
    }

    /*
      Create the session in pending_payment state.

      Payment confirmation will later move it
      to the appropriate confirmed state.
    */

    const session = await Session.create({
      therapist: therapist._id,
      client: client._id,
      startTime: sessionStart,
      endTime: sessionEnd,
      duration: calculatedDuration,
      status: "pending_payment",
      sessionType: "individual",
      package: null,
    });

    return res.status(201).json({
      success: true,
      message: "Session reserved pending payment",
      session,
      amount: therapist.sessionPrice,
      currency: "INR",
    });
  } catch (error) {
    next(error);
  }
};