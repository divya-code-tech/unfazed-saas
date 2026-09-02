import express from "express";
import {
  registerTherapist,
  loginTherapist,
  registerClient,
  loginClient,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/therapist/register", registerTherapist);
router.post("/therapist/login", loginTherapist);

router.post("/client/register", registerClient);
router.post("/client/login", loginClient);

export default router;
