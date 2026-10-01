import Session from "../models/Session.js";
import Client from "../models/Client.js";
import Package from "../models/Package.js";
import {sendPostSessionFollowUp,} from "../services/notificationService.js";

export const getSessions = async (req, res, next) => {
  try {
    const sessions = await Session.find({
      therapist: req.user.id,
    })
      .populate("client", "name email")
      .populate("package", "name price")
      .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    next(error);
  }
};

export const getSessionById = async (req, res, next) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      therapist: req.user.id,
    })
      .populate("client", "name email")
      .populate("package", "name price");

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

        const previousStatus = session.status;

    res.status(200).json({
      success: true,
      session,
    });
  } catch (error) {
    next(error);
  }
};

export const createSession = async (req, res, next) => {
  try {
    const {
      client,
      startTime,
      endTime,
      duration,
      status,
      sessionType,
      package: packageId,
      meetingLink,
      notes,
    } = req.body;

    if (!client || !startTime || !endTime || !duration) {
      return res.status(400).json({
        success: false,
        message: "Client, start time, end time and duration are required",
      });
    }

    const existingClient = await Client.findOne({
      _id: client,
      therapist: req.user.id,
    });

    if (!existingClient) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    if (packageId) {
  const existingPackage = await Package.findOne({
    _id: packageId,
    therapist: req.user.id,
  });

  if (!existingPackage) {
    return res.status(404).json({
      success: false,
      message: "Package not found",
    });
  }
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
  (sessionEnd.getTime() - sessionStart.getTime()) / (1000 * 60)
);

if (Number(duration) !== calculatedDuration) {
  return res.status(400).json({
    success: false,
    message: `Duration must be ${calculatedDuration} minutes`,
  });
}

    const overlappingSession = await Session.findOne({
      therapist: req.user.id,
      status: {
        $nin: ["cancelled", "no_show"],
      },
      startTime: { $lt: sessionEnd },
      endTime: { $gt: sessionStart },
    });

    if (overlappingSession) {
      return res.status(409).json({
        success: false,
        message: "Therapist already has a session during this time",
      });
    }

    const session = await Session.create({
      therapist: req.user.id,
      client,
      startTime: sessionStart,
      endTime: sessionEnd,
      duration,
      status,
      sessionType,
      package: packageId || null,
      meetingLink,
      notes,
    });

    const populatedSession = await Session.findById(session._id)
      .populate("client", "name email")
      .populate("package", "name price");

    res.status(201).json({
      success: true,
      message: "Session created successfully",
      session: populatedSession,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSession = async (req, res, next) => {
  try {
    const {
      client,
      startTime,
      endTime,
      duration,
      status,
      sessionType,
      package: packageId,
      meetingLink,
      notes,
    } = req.body;

    const session = await Session.findOne({
      _id: req.params.id,
      therapist: req.user.id,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    if (client !== undefined) {
      const existingClient = await Client.findOne({
        _id: client,
        therapist: req.user.id,
      });

      if (!existingClient) {
        return res.status(404).json({
          success: false,
          message: "Client not found",
        });
      }

      session.client = client;
    }

    if (packageId !== undefined) {
      if (packageId === null || packageId === "") {
        session.package = null;
      } else {
        const existingPackage = await Package.findOne({
          _id: packageId,
          therapist: req.user.id,
        });

        if (!existingPackage) {
          return res.status(404).json({
            success: false,
            message: "Package not found",
          });
        }

        session.package = packageId;
      }
    }

    if (startTime !== undefined) {
      session.startTime = new Date(startTime);
    }

    if (endTime !== undefined) {
      session.endTime = new Date(endTime);
    }

    if (session.startTime >= session.endTime) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time",
      });
    }

    const calculatedDuration = Math.round(
      (session.endTime.getTime() - session.startTime.getTime()) /
        (1000 * 60)
    );

    if (duration !== undefined && Number(duration) !== calculatedDuration) {
      return res.status(400).json({
        success: false,
        message: `Duration must be ${calculatedDuration} minutes`,
      });
    }


    session.duration = calculatedDuration;

    const previousStatus = session.status;

    if (status !== undefined) {
      session.status = status;
    }

    if (sessionType !== undefined) {
      session.sessionType = sessionType;
    }

    if (meetingLink !== undefined) {
      session.meetingLink = meetingLink;
    }

    if (notes !== undefined) {
      session.notes = notes;
    }

    const overlappingSession = await Session.findOne({
      _id: { $ne: session._id },
      therapist: req.user.id,
      status: {
        $nin: ["cancelled", "no_show"],
      },
      startTime: { $lt: session.endTime },
      endTime: { $gt: session.startTime },
    });

    if (overlappingSession) {
      return res.status(409).json({
        success: false,
        message: "Therapist already has a session during this time",
      });
    }


    await session.save();

    const updatedSession = await Session.findById(session._id)
      .populate("client", "name email phone")
      .populate("package", "name price");

    // ----------------------------------------------
    // Post-session follow-up notification
    // ----------------------------------------------
    if (
      previousStatus !== "completed" &&
      session.status === "completed" &&
      !session.followUpSentAt &&
      updatedSession.client
    ) {
      try {
        await sendPostSessionFollowUp({
          clientName: updatedSession.client.name,
          clientEmail: updatedSession.client.email,
          clientPhone: updatedSession.client.phone,
        });

        session.followUpSentAt = new Date();
        await session.save();
      } catch (notificationError) {
        console.error(
          `[Notification] Failed post-session follow-up for session ${session._id}:`,
          notificationError
        );
      }
    }

    res.status(200).json({
      success: true,
      message: "Session updated successfully",
      session: updatedSession,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelSession = async (req, res, next) => {
  try {
    const { cancellationReason } = req.body;

    const session = await Session.findOne({
      _id: req.params.id,
      therapist: req.user.id,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    if (session.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Session is already cancelled",
      });
    }

    session.status = "cancelled";
    session.cancelledAt = new Date();
    session.cancelledBy = "therapist";

    if (cancellationReason !== undefined) {
      session.cancellationReason = cancellationReason;
    }

    await session.save();

    const cancelledSession = await Session.findById(session._id)
      .populate("client", "name email")
      .populate("package", "name price");

    res.status(200).json({
      success: true,
      message: "Session cancelled successfully",
      session: cancelledSession,
    });
  } catch (error) {
    next(error);
  }
};

export const rescheduleSession = async (req, res, next) => {
  try {
    const { startTime, endTime, duration } = req.body;

    if (!startTime || !endTime || !duration) {
      return res.status(400).json({
        success: false,
        message: "Start time, end time and duration are required",
      });
    }

    const originalSession = await Session.findOne({
      _id: req.params.id,
      therapist: req.user.id,
    });

    if (!originalSession) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    if (originalSession.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cancelled sessions cannot be rescheduled",
      });
    }

    const newStartTime = new Date(startTime);
    const newEndTime = new Date(endTime);

    if (
      Number.isNaN(newStartTime.getTime()) ||
      Number.isNaN(newEndTime.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid start time or end time",
      });
    }

    if (newEndTime <= newStartTime) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time",
      });
    }

    const calculatedDuration = Math.round(
      (newEndTime.getTime() - newStartTime.getTime()) /
        (1000 * 60)
    );

    if (Number(duration) !== calculatedDuration) {
      return res.status(400).json({
        success: false,
        message: `Duration must be ${calculatedDuration} minutes`,
      });
    }

    const overlappingSession = await Session.findOne({
      _id: { $ne: originalSession._id },
      therapist: req.user.id,
      status: {
        $nin: ["cancelled", "no_show"],
      },
      startTime: { $lt: newEndTime },
      endTime: { $gt: newStartTime },
    });

    if (overlappingSession) {
      return res.status(409).json({
        success: false,
        message: "Therapist already has a session during this time",
      });
    }

    const newSession = await Session.create({
      therapist: originalSession.therapist,
      client: originalSession.client,
      startTime: newStartTime,
      endTime: newEndTime,
      duration: calculatedDuration,
      status: "scheduled",
      sessionType: originalSession.sessionType,
      package: originalSession.package,
      meetingLink: originalSession.meetingLink,
      notes: originalSession.notes,
      rescheduledFrom: originalSession._id,
    });

    originalSession.status = "rescheduled";
    await originalSession.save();

    const populatedSession = await Session.findById(newSession._id)
      .populate("client", "name email")
      .populate("package", "name price");

    res.status(201).json({
      success: true,
      message: "Session rescheduled successfully",
      session: populatedSession,
    });
  } catch (error) {
    next(error);
  }
};