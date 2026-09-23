import dotenv from "dotenv";
import mongoose from "mongoose";
import SubscriptionTierConfig from "../src/models/SubscriptionTierConfig.js";

dotenv.config();

const subscriptionTiers = [
  {
    tier: "free",
    displayName: "Free",
    maxClients: 5,
    maxSessionsPerMonth: 10,
    maxPackages: 1,
    analyticsEnabled: false,
    chatEnabled: false,
    customBrandingEnabled: false,
    isActive: true,
  },
  {
    tier: "starter",
    displayName: "Starter",
    maxClients: 25,
    maxSessionsPerMonth: 50,
    maxPackages: 3,
    analyticsEnabled: true,
    chatEnabled: false,
    customBrandingEnabled: false,
    isActive: true,
  },
  {
    tier: "pro",
    displayName: "Pro",
    maxClients: 100,
    maxSessionsPerMonth: 200,
    maxPackages: 10,
    analyticsEnabled: true,
    chatEnabled: true,
    customBrandingEnabled: true,
    isActive: true,
  },
  {
    tier: "premium",
    displayName: "Premium",
    maxClients: 500,
    maxSessionsPerMonth: 1000,
    maxPackages: 50,
    analyticsEnabled: true,
    chatEnabled: true,
    customBrandingEnabled: true,
    isActive: true,
  },
];

const seedSubscriptionTiers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected for subscription tier seeding");

    for (const tier of subscriptionTiers) {
      await SubscriptionTierConfig.findOneAndUpdate(
        { tier: tier.tier },
        tier,
        { upsert: true, new: true }
      );

      console.log(`Seeded ${tier.tier} tier`);
    }

    console.log("Subscription tiers seeded successfully");
  } catch (error) {
    console.error("Subscription tier seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedSubscriptionTiers();
