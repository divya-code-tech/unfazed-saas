import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import entitlementMiddleware from "../middleware/entitlementMiddleware.js";

import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
} from "../controllers/clientController.js";

const router = express.Router();

router.get("/", authMiddleware, getClients);

router.get("/:id", authMiddleware, getClientById);

router.post( "/", authMiddleware, entitlementMiddleware("clientCreation"),createClient );

router.put("/:id", authMiddleware, updateClient);

router.delete("/:id", authMiddleware, deleteClient);

export default router;
