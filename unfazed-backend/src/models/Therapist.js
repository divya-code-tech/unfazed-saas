import mongoose from "mongoose";

const therapistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    phone: {
      type: String,
      trim: true,
    },

    avatar: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    languages: {
      type: [String],
      default: [],
    },

    specializations: {
      type: [String],
      default: [],
    },

    sessionDuration: {
      type: Number,
      default: 60,
      min: 15,
    },

    bufferTime: {
      type: Number,
      default: 0,
      min: 0,
    },

    sessionPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },

    slug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },

    subscriptionTier: {
      type: String,
      enum: ["free", "starter", "pro", "premium"],
      default: "free",
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

const Therapist = mongoose.model("Therapist", therapistSchema);

export default Therapist;
