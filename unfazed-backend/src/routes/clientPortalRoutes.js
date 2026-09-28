import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import { requireClient } from "../middleware/roleMiddleware.js";

import {
  getMyProfile,
  getMyAvailablePackages,
  getMyPackages,
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
  "/packages",
  authMiddleware,
  requireClient,
  getMyAvailablePackages
);

router.get(
  "/my-packages",
  authMiddleware,
  requireClient,
  getMyPackages
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