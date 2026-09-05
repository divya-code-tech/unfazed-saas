import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  convertLeadToClient
} from "../controllers/leadController.js";

const router = express.Router();

router.post("/", authMiddleware, createLead);
router.get("/", authMiddleware, getLeads);
router.post("/:id/convert", authMiddleware, convertLeadToClient);
router.get("/:id", authMiddleware, getLeadById);
router.put("/:id", authMiddleware, updateLead);
router.delete("/:id", authMiddleware, deleteLead);


export default router;
