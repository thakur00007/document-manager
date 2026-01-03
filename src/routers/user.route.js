import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  refreshAccessToken,
} from "../controllers/user.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const userRouter = express.Router();

userRouter.route("/create").post(registerUser);
userRouter.route("/login").post(loginUser);
userRouter.route("/logout").post(authMiddleware, logoutUser);
userRouter.route("/profile").get(authMiddleware, getUserProfile);
userRouter.route("/refresh-token").post(refreshAccessToken);

export default userRouter;
