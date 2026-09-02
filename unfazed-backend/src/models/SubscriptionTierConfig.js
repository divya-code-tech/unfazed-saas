import mongoose from "mongoose";

const subscriptionTierConfigSchema = new mongoose.Schema(
  {
    tier: {
      type: String,
      required: true,
      unique: true,
      enum: ["free", "starter", "pro", "premium"],
    },

    displayName: {
      type: String,
      required: true,
      trim: true,
    },

    maxClients: {
      type: Number,
      required: true,
      min: 0,
    },

    maxSessionsPerMonth: {
      type: Number,
      required: true,
      min: 0,
    },

    maxPackages: {
      type: Number,
      required: true,
      min: 0,
    },

    analyticsEnabled: {
      type: Boolean,
      default: false,
    },

    chatEnabled: {
      type: Boolean,
      default: false,
    },

    customBrandingEnabled: {
      type: Boolean,
      default: false,
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

const SubscriptionTierConfig = mongoose.model(
  "SubscriptionTierConfig",
  subscriptionTierConfigSchema
);

export default SubscriptionTierConfig;
