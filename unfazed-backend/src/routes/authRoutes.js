import authMiddleware from "../middleware/authMiddleware.js";
import express from "express";
import {
  registerTherapist,
  loginTherapist,
  registerClient,
  loginClient,
  changeClientPassword,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/therapist/register", registerTherapist);
router.post("/therapist/login", loginTherapist);

router.post("/client/register", registerClient);
router.post("/client/login", loginClient);

router.get("/me", authMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Authenticated user",
    user: req.user,
  });
});

router.patch(
  "/client/change-password",
  authMiddleware,
  changeClientPassword
);

export default router;
