import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
  createPayment,
  getPayments,
  getPaymentById,
  updatePaymentStatus,
  updatePaymentDetails,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/", authMiddleware, createPayment);
router.get("/", authMiddleware, getPayments);
router.get("/:id", authMiddleware, getPaymentById);
router.patch("/:id/status", authMiddleware, updatePaymentStatus);
router.patch("/:id/details", authMiddleware, updatePaymentDetails);

export default router;

