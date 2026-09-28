import mongoose from "mongoose";

const packageSchema = new mongoose.Schema(
  {
    therapist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    sessionCount: {
      type: Number,
      required: true,
      enum: [3, 6, 12],
   },

    sessionDuration: {
      type: Number,
      required: true,
      min: 15,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
    },

    validityDays: {
      type: Number,
      required: true,
      min: 1,
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

packageSchema.index({ therapist: 1, name: 1 }, { unique: true });

const Package = mongoose.model("Package", packageSchema);

export default Package;
