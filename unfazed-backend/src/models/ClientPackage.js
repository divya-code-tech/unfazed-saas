import mongoose from "mongoose";

const clientPackageSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },

    therapist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      required: true,
    },

    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: true,
    },

    sessionsPurchased: {
      type: Number,
      required: true,
      min: 1,
    },

    sessionsUsed: {
      type: Number,
      default: 0,
      min: 0,
    },

    purchasedAt: {
      type: Date,
      default: Date.now,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "expired", "completed", "cancelled"],
      default: "active",
    },

    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

clientPackageSchema.index({ client: 1, status: 1 });
clientPackageSchema.index({ therapist: 1, client: 1 });

const ClientPackage = mongoose.model(
  "ClientPackage",
  clientPackageSchema
);

export default ClientPackage;
