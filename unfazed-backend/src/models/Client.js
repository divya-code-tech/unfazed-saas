import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
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
    },

    email: {
      type: String,
      required: true,
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

    dateOfBirth: {
      type: Date,
    },

    gender: {
      type: String,
      trim: true,
    },

    languages: {
      type: [String],
      default: [],
    },

    tags: {
      type: [String],
      default: [],
   },

    intake: {
      presentingConcern: {
        type: String,
        trim: true,
     },

      history: {
        type: String,
        trim: true,
     },
    },

      consent: {
        given: {
          type: Boolean,
          default: false,
      },
      givenAt: {
        type: Date,
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    mustChangePassword: {
      type: Boolean,
      default: false,
    },

    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

clientSchema.index({ therapist: 1, email: 1 }, { unique: true });

const Client = mongoose.model("Client", clientSchema);

export default Client;
