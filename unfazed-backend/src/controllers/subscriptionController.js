import Therapist from "../models/Therapist.js";
import SubscriptionTierConfig from "../models/SubscriptionTierConfig.js";

// Get the authenticated therapist's subscription details
export const getMySubscription = async (req, res, next) => {
  try {
    const therapist = await Therapist.findById(req.user.id).select(
      "subscriptionTier"
    );

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: "Therapist not found",
      });
    }

    const currentTier = await SubscriptionTierConfig.findOne({
      tier: therapist.subscriptionTier,
      isActive: true,
    });

    if (!currentTier) {
      return res.status(404).json({
        success: false,
        message: "Active subscription configuration not found",
      });
    }

    const tiers = await SubscriptionTierConfig.find({
      isActive: true,
    })
      .select(
        "tier displayName maxClients maxSessionsPerMonth maxPackages analyticsEnabled chatEnabled customBrandingEnabled"
      )
      .sort({ maxClients: 1 });

    return res.status(200).json({
      success: true,
      subscription: {
        currentTier: therapist.subscriptionTier,
        currentPlan: currentTier,
        availablePlans: tiers,
      },
    });
  } catch (error) {
    next(error);
  }
};
