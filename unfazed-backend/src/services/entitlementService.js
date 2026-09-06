import Therapist from "../models/Therapist.js";
import SubscriptionTierConfig from "../models/SubscriptionTierConfig.js";

/**
 * Get the subscription configuration for a therapist.
 */
export const getTherapistEntitlements = async (therapistId) => {
  const therapist = await Therapist.findById(therapistId).select(
    "subscriptionTier"
  );

  if (!therapist) {
    throw new Error("Therapist not found");
  }

  const tierConfig = await SubscriptionTierConfig.findOne({
    tier: therapist.subscriptionTier,
    isActive: true,
  });

  if (!tierConfig) {
    throw new Error(
      `Active subscription configuration not found for tier: ${therapist.subscriptionTier}`
    );
  }

  return tierConfig;
};

/**
 * Check whether a therapist can access a feature.
 */
export const canAccess = async (therapistId, featureKey) => {
  const tierConfig = await getTherapistEntitlements(therapistId);

  const featureAccess = {
    analytics: tierConfig.analyticsEnabled,
    chat: tierConfig.chatEnabled,
    customBranding: tierConfig.customBrandingEnabled,
  };

  if (!(featureKey in featureAccess)) {
    throw new Error(`Unknown feature: ${featureKey}`);
  }

  return featureAccess[featureKey] === true;
};

/**
 * Check whether a therapist is within a subscription limit.
 */
export const checkLimit = async (
  therapistId,
  limitKey,
  currentUsage
) => {
  const tierConfig = await getTherapistEntitlements(therapistId);

  const limits = {
    clients: tierConfig.maxClients,
    sessionsPerMonth: tierConfig.maxSessionsPerMonth,
    packages: tierConfig.maxPackages,
  };

  if (!(limitKey in limits)) {
    throw new Error(`Unknown limit: ${limitKey}`);
  }

  return {
    allowed: currentUsage < limits[limitKey],
    limit: limits[limitKey],
    currentUsage,
    remaining: Math.max(limits[limitKey] - currentUsage, 0),
  };
};