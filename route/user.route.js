import { Router } from "express";
import {
  registerUserController,
  verifyEmailController,
  loginUserController,
  logoutController,
  userDetails,
  updateUserDetails,
  forgotPasswordController,
  verifyforgotPasswordOtp,
  resetPassword,
  refreshToken,
} from "../controllers/user.controller.js";
import auth from "../middlewares/auth.js";
import upload from "../middlewares/multer.js";

const userRouter = Router();

userRouter.post("/register", registerUserController);
userRouter.post("/verifyEmail", verifyEmailController);
userRouter.post("/login", loginUserController);
userRouter.get("/logout", auth, logoutController);
userRouter.get("/user-details", auth, userDetails);
userRouter.put("/update", auth, updateUserDetails);
userRouter.post("/forgot-password", forgotPasswordController);
userRouter.post("/verify-forgot-password-otp", verifyforgotPasswordOtp);
userRouter.post("/reset-password", resetPassword);
userRouter.post("/refresh-token", refreshToken);

export default userRouter;
