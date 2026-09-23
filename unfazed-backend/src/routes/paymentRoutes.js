import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { requireClient } from "../middleware/roleMiddleware.js";


import {
  createPayment,
  getPayments,
  getPaymentById,
  updatePaymentStatus,
  updatePaymentDetails,
  createPaymentOrder,
  createClientPaymentOrder,
  verifyPayment,
 } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/", authMiddleware, createPayment);
router.get("/", authMiddleware, getPayments);
router.post("/create-order", authMiddleware, createPaymentOrder);
router.post(
  "/client/create-order",
  authMiddleware,
  requireClient,
  createClientPaymentOrder
);
router.post("/verify", authMiddleware, verifyPayment);
router.get("/:id", authMiddleware, getPaymentById);
router.patch("/:id/status", authMiddleware, updatePaymentStatus);
router.patch("/:id/details", authMiddleware, updatePaymentDetails);


export default router;

