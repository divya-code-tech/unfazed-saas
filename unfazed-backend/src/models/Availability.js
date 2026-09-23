import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema(
  {
    therapist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      required: true,
    },

    // Recurring weekly availability uses dayOfWeek.
    // Date-specific exceptions use date instead.
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
    },

    // Used for one-time overrides and blocked periods.
    date: {
      type: String,
      match: /^\d{4}-\d{2}-\d{2}$/,
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

    type: {
      type: String,
      enum: ["weekly", "override", "blocked"],
      default: "weekly",
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
  { therapist: 1, dayOfWeek: 1, startTime: 1, type: 1 },
  { unique: true }
);

availabilitySchema.index({
  therapist: 1,
  date: 1,
  startTime: 1,
  type: 1,
});

const Availability = mongoose.model(
  "Availability",
  availabilitySchema
);

export default Availability;