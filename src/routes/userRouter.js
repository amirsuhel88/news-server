import express from "express";
import {
  getUserDetails,
  login,
  signup,
} from "../controllers/userControllers.js";
import { authenticateUser } from "../middleware/authMiddlware.js";
const router = express.Router();

router.route("/signup").post(signup);
router.route("/login").post(login);
router.route("/user-details").get(authenticateUser, getUserDetails);

export default router;
