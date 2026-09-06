import { canAccess } from "../services/entitlementService.js";

const entitlementMiddleware = (featureKey) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const allowed = await canAccess(req.user.id, featureKey);

      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: "This feature is not available on your current plan.",
          feature: featureKey,
          upgradeRequired: true,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default entitlementMiddleware;