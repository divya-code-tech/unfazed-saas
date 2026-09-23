import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import { requireClient } from "../middleware/roleMiddleware.js";

import {
  getAvailableSlots,
   bookSession,
} from "../controllers/clientBookingController.js";

const router = express.Router();

router.get(
  "/therapist/:therapistId/slots",
  authMiddleware,
  requireClient,
  getAvailableSlots
);

router.post(
  "/therapist/:therapistId/book",
  authMiddleware,
  requireClient,
  bookSession
);

export default router;