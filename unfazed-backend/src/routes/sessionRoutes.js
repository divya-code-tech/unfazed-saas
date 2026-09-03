import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
  getSessions,
  getSessionById,
  createSession,
  updateSession ,
  cancelSession,
  rescheduleSession,
} from "../controllers/sessionController.js";

const router = express.Router();

router.get("/", authMiddleware, getSessions);

router.get("/:id", authMiddleware, getSessionById);

router.post("/", authMiddleware, createSession);

router.put("/:id", authMiddleware, updateSession);

router.patch("/:id/cancel", authMiddleware, cancelSession);

router.patch("/:id/reschedule", authMiddleware, rescheduleSession);

export default router;