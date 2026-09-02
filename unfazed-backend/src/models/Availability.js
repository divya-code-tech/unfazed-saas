import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema(
  {
    therapist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      required: true,
    },

    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },

    startTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },

    endTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },

    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

availabilitySchema.index(
  { therapist: 1, dayOfWeek: 1, startTime: 1 },
  { unique: true }
);

const Availability = mongoose.model(
  "Availability",
  availabilitySchema
);

export default Availability;
