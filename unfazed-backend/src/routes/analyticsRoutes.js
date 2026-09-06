import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import entitlementMiddleware from "../middleware/entitlementMiddleware.js";
import { getAnalytics } from "../controllers/analyticsController.js";

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  entitlementMiddleware("analytics"),
  getAnalytics
);

export default router;