import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import { requireClient } from "../middleware/roleMiddleware.js";

import {
  getMyProfile,
  getMySessions,
  getMyPendingPayment,
  downloadMyInvoice,
} from "../controllers/clientPortalController.js";

const router = express.Router();

router.get(
  "/me",
  authMiddleware,
  requireClient,
  getMyProfile
);

router.get(
  "/sessions",
  authMiddleware,
  requireClient,
  getMySessions
);

router.get(
  "/pending-payment",
  authMiddleware,
  requireClient,
  getMyPendingPayment
);

router.get(
  "/invoices/:paymentId",
  authMiddleware,
  requireClient,
  downloadMyInvoice
);

export default router;