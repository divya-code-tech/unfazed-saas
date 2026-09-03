import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
  createSessionNote,
  getSessionNotes,
  updateSessionNote,
  deleteSessionNote,
} from "../controllers/sessionNoteController.js";

const router = express.Router();

router.post("/", authMiddleware, createSessionNote);

router.get("/session/:sessionId", authMiddleware, getSessionNotes);

router.put("/:id", authMiddleware, updateSessionNote);

router.delete("/:id", authMiddleware, deleteSessionNote);

export default router;
