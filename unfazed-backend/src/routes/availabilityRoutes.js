import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
  createAvailability,
  getAvailabilities,
  updateAvailability,
  deleteAvailability,
} from "../controllers/availabilityController.js";

const router = express.Router();

router.post("/", authMiddleware, createAvailability);
router.get("/", authMiddleware, getAvailabilities);
router.put("/:id", authMiddleware, updateAvailability);
router.delete("/:id", authMiddleware, deleteAvailability);

export default router;