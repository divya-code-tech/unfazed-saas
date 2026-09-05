import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
  createPackage,
  getPackages,
  updatePackage,
  deletePackage,
} from "../controllers/packageController.js";

const router = express.Router();

router.post("/", authMiddleware, createPackage);
router.get("/", authMiddleware, getPackages);
router.put("/:id", authMiddleware, updatePackage);
router.delete("/:id", authMiddleware, deletePackage);

export default router;