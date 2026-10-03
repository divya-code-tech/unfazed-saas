import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { requireTherapist } from "../middleware/roleMiddleware.js";
import { getMySubscription } from "../controllers/subscriptionController.js";

const router = express.Router();

// Authenticated therapist subscription details
router.get(
  "/me",
  authMiddleware,
  requireTherapist,
  getMySubscription
);

export default router;
