import Availability from "../models/Availability.js";

export const createAvailability = async (req, res, next) => {
  try {
    const {
      dayOfWeek,
      startTime,
      endTime,
      timezone,
      isActive,
    } = req.body;

    if (
      dayOfWeek === undefined ||
      !startTime ||
      !endTime
    ) {
      return res.status(400).json({
        success: false,
        message: "Day, start time and end time are required",
      });
    }

    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time",
      });
    }

    // Check for overlapping availability
    const overlappingAvailability = await Availability.findOne({
      therapist: req.user.id,
      dayOfWeek,
      isActive: true,
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });

    if (overlappingAvailability) {
      return res.status(409).json({
        success: false,
        message: "Availability overlaps with an existing time slot",
      });
    }

    const availability = await Availability.create({
      therapist: req.user.id,
      dayOfWeek,
      startTime,
      endTime,
      timezone: timezone || "Asia/Kolkata",
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
      dayOfWeek: 1,
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
    const { dayOfWeek, startTime, endTime, timezone, isActive } = req.body;

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

    const newDayOfWeek =
      dayOfWeek !== undefined ? dayOfWeek : availability.dayOfWeek;

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

    const overlappingAvailability = await Availability.findOne({
      _id: { $ne: availability._id },
      therapist: req.user.id,
      dayOfWeek: newDayOfWeek,
      isActive: true,
      startTime: { $lt: newEndTime },
      endTime: { $gt: newStartTime },
    });

    if (overlappingAvailability) {
      return res.status(409).json({
        success: false,
        message: "Availability overlaps with an existing time slot",
      });
    }

    availability.dayOfWeek = newDayOfWeek;
    availability.startTime = newStartTime;
    availability.endTime = newEndTime;

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