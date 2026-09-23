import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getMyProfile,
  updateMyProfile,
  getPublicProfile,
} from "../controllers/therapistController.js";

const router = express.Router();

// Authenticated therapist profile
router.get("/me", authMiddleware, getMyProfile);
router.patch("/me", authMiddleware, updateMyProfile);

// Public branded therapist profile
router.get("/:slug", getPublicProfile);

export default router;