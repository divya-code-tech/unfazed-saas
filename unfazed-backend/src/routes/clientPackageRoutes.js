import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
  createClientPackage,
  getClientPackages,
  updateClientPackage, 
  getClientPackageById, 
   cancelClientPackage,
} from "../controllers/clientPackageController.js";

const router = express.Router();

router.post("/", authMiddleware, createClientPackage);
router.get("/", authMiddleware, getClientPackages);
router.put("/:id", authMiddleware, updateClientPackage);
router.get("/:id", authMiddleware, getClientPackageById);
router.patch("/:id/cancel", authMiddleware, cancelClientPackage);

export default router;
