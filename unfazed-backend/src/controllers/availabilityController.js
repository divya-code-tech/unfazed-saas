import Availability from "../models/Availability.js";

export const createAvailability = async (req, res, next) => {
  try {
    const {
      dayOfWeek,
      date,
      startTime,
      endTime,
      timezone,
      type = "weekly",
      isActive,
    } = req.body;

    // Validate availability type
    if (!["weekly", "override", "blocked"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid availability type",
      });
    }

    // Weekly availability needs a dayOfWeek.
    if (type === "weekly" && dayOfWeek === undefined) {
      return res.status(400).json({
        success: false,
        message: "Day of week is required for weekly availability",
      });
    }

    // One-time override/blocked availability needs a date.
    if (type !== "weekly" && !date) {
      return res.status(400).json({
        success: false,
        message: "Date is required for one-time availability",
      });
    }

    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Start time and end time are required",
      });
    }

    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time",
      });
    }

    // Prevent overlapping records of the same type.
    const overlapQuery = {
      therapist: req.user.id,
      type,
      isActive: true,
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    };

    if (type === "weekly") {
      overlapQuery.dayOfWeek = dayOfWeek;
    } else {
      overlapQuery.date = date;
    }

    const overlappingAvailability = await Availability.findOne(
      overlapQuery
    );

    if (overlappingAvailability) {
      return res.status(409).json({
        success: false,
        message: "Availability overlaps with an existing time slot",
      });
    }

    const availability = await Availability.create({
      therapist: req.user.id,
      dayOfWeek: type === "weekly" ? dayOfWeek : undefined,
      date: type !== "weekly" ? date : undefined,
      startTime,
      endTime,
      timezone: timezone || "Asia/Kolkata",
      type,
      isActive: isActive ?? true,
    });

    res.status(201).json({
      success: true,
      message: "Availability created successfully",
      availability,
    });
  } catch (error) {
    next(error);
  }
};

export const getAvailabilities = async (req, res, next) => {
  try {
    const availabilities = await Availability.find({
      therapist: req.user.id,
    }).sort({
      type: 1,
      dayOfWeek: 1,
      date: 1,
      startTime: 1,
    });

    res.status(200).json({
      success: true,
      count: availabilities.length,
      availabilities,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAvailability = async (req, res, next) => {
  try {
    const {
      dayOfWeek,
      date,
      startTime,
      endTime,
      timezone,
      type,
      isActive,
    } = req.body;

    const availability = await Availability.findOne({
      _id: req.params.id,
      therapist: req.user.id,
    });

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: "Availability not found",
      });
    }

    const newType =
      type !== undefined ? type : availability.type || "weekly";

    const newDayOfWeek =
      dayOfWeek !== undefined ? dayOfWeek : availability.dayOfWeek;

    const newDate =
      date !== undefined ? date : availability.date;

    const newStartTime =
      startTime !== undefined ? startTime : availability.startTime;

    const newEndTime =
      endTime !== undefined ? endTime : availability.endTime;

    if (newStartTime >= newEndTime) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time",
      });
    }

    // Build the overlap query according to availability type.
    const overlapQuery = {
      _id: { $ne: availability._id },
      therapist: req.user.id,
      isActive: true,
      startTime: { $lt: newEndTime },
      endTime: { $gt: newStartTime },
      type: newType,
    };

    // Weekly availability overlaps are checked by day.
    if (newType === "weekly") {
      overlapQuery.dayOfWeek = newDayOfWeek;
    }

    // One-time availability overlaps are checked by date.
    if (newType === "override") {
      overlapQuery.date = newDate;
    }

    // Blocked slots are date-specific when a date exists.
    if (newType === "blocked" && newDate) {
      overlapQuery.date = newDate;
    }

    const overlappingAvailability = await Availability.findOne(
      overlapQuery
    );

    if (overlappingAvailability) {
      return res.status(409).json({
        success: false,
        message: "Availability overlaps with an existing time slot",
      });
    }

    availability.startTime = newStartTime;
    availability.endTime = newEndTime;
    availability.type = newType;

    if (newType === "weekly") {
      availability.dayOfWeek = newDayOfWeek;
    }

    if (newType === "override" || newType === "blocked") {
      availability.date = newDate;
    }

    if (timezone !== undefined) {
      availability.timezone = timezone;
    }

    if (isActive !== undefined) {
      availability.isActive = isActive;
    }

    await availability.save();

    res.status(200).json({
      success: true,
      message: "Availability updated successfully",
      availability,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAvailability = async (req, res, next) => {
  try {
    const availability = await Availability.findOneAndDelete({
      _id: req.params.id,
      therapist: req.user.id,
    });

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: "Availability not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Availability deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};