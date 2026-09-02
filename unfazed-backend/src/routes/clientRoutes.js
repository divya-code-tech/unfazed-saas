import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
  getClients,
  getClientById,
  createClient,
} from "../controllers/clientController.js";

const router = express.Router();

router.get("/", authMiddleware, getClients);

router.get("/:id", authMiddleware, getClientById);

router.post("/", authMiddleware, createClient);

export default router;
