import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    clientName: {
      type: String,
      required: true,
      trim: true,
    },

    clientEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },

    clientPhone: {
      type: String,
      trim: true,
    },

    therapist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      default: null,
    },

    source: {
      type: String,
      enum: [
        "website",
        "therapist_link",
        "referral",
        "manual",
        "other",
      ],
      default: "website",
    },

    status: {
      type: String,
      enum: [
        "new",
        "contacted",
        "qualified",
        "converted",
        "lost",
      ],
      default: "new",
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    convertedClient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

leadSchema.index({ therapist: 1, status: 1 });
leadSchema.index({ clientEmail: 1 });

const Lead = mongoose.model("Lead", leadSchema);

export default Lead;
