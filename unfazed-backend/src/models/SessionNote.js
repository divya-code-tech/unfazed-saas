import mongoose from "mongoose";

const sessionNoteSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },

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

    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },

    isClientVisible: {
      type: Boolean,
      default: false,
    },

    attachments: [
      {
        name: {
          type: String,
          trim: true,
        },
        url: {
          type: String,
          trim: true,
        },
        type: {
          type: String,
          trim: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

sessionNoteSchema.index({ session: 1 });
sessionNoteSchema.index({ therapist: 1, client: 1 });

const SessionNote = mongoose.model("SessionNote", sessionNoteSchema);

export default SessionNote;
