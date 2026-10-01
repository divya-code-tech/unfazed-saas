import mongoose from "mongoose";
import "./Package.js";

const sessionSchema = new mongoose.Schema(
  {
    therapist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      required: true,
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },

    startTime: {
      type: Date,
      required: true,
    },

    endTime: {
      type: Date,
      required: true,
    },

    duration: {
      type: Number,
      required: true,
      min: 15,
    },

    status: {
      type: String,
      enum: [
        "pending_payment",
        "scheduled",
        "confirmed",
        "completed",
        "cancelled",
        "rescheduled",
        "no_show",
      ],
      default: "scheduled",
    },

    sessionType: {
      type: String,
      enum: ["individual", "package"],
      default: "individual",
    },

    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      default: null,
    },

    meetingLink: {
      type: String,
      trim: true,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    reminderSentAt: {
      type: Date,
      default: null,
    },

    followUpSentAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancelledBy: {
      type: String,
      enum: ["therapist", "client", "system", null],
      default: null,
    },

    rescheduledFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

sessionSchema.index({ therapist: 1, startTime: 1 });
sessionSchema.index({ client: 1, startTime: 1 });
sessionSchema.index({ status: 1, startTime: 1 });

const Session = mongoose.model("Session", sessionSchema);

export default Session;
