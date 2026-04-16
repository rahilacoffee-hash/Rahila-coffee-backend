import UserModel from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import sendEmail from "../config/sendEmail.js";
import verifyEmailTemplate from "../utils/verifyEmailTemplate.js";
import generatedAccessToken from "../utils/generatedAccessToken.js";
import generatedRefreshToken from "../utils/generatedRefreshToken.js";


// REGISTER
export async function registerUserController(req, res) {
  try {
    const { name, email, password, role } = req.body; // <-- accept role
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Provide all fields", error: true, success: false });
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({
          message: "Email already registered",
          error: true,
          success: false,
        });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcryptjs.hash(password, 10);

    const user = new UserModel({
      name,
      email,
      password: hashedPassword,
      otp: otpCode,
      otpExpiry: Date.now() + 10 * 60 * 1000,
      role: role === "ADMIN" ? "ADMIN" : "USER", // <-- assign role safely
    });

    await user.save();

    await sendEmail({
      sendTo: email,
      subject: "Verify your Rahila coffee account",
      text: `Your OTP is ${otpCode}`,
      html: verifyEmailTemplate(name, otpCode),
    });

    return res.status(200).json({
      message: "Registered successfully. Check your email for OTP.",
      success: true,
      error: false,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message, error: true, success: false });
  }
}
// VERIFY EMAIL
export async function verifyEmailController(req, res) {
  try {
    const { email, otp } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user)
      return res
        .status(400)
        .json({ message: "User not found", error: true, success: false });
    if (user.otp !== otp)
      return res
        .status(400)
        .json({ message: "Invalid OTP", error: true, success: false });
    if (user.otpExpiry < Date.now())
      return res
        .status(400)
        .json({ message: "OTP expired", error: true, success: false });
    user.verify_email = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();
    return res
      .status(200)
      .json({ message: "Email verified", success: true, error: false });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message, error: true, success: false });
  }
}

// LOGIN
export async function loginUserController(req, res) {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user)
      return res
        .status(400)
        .json({ message: "User not found", error: true, success: false });
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch)
      return res
        .status(400)
        .json({ message: "Invalid password", error: true, success: false });
    const accessToken = await generatedAccessToken(user._id);
    const refreshToken = await generatedRefreshToken(user._id);
    await UserModel.findByIdAndUpdate(user._id, {
      last_login_date: new Date(),
    });
    const cookiesOption = { httpOnly: true, secure: false, sameSite: "Lax" };
    res.cookie("accessToken", accessToken, cookiesOption);
    res.cookie("refreshToken", refreshToken, cookiesOption);
    return res.status(200).json({
      message: "Login successful",
      data: { accessToken, refreshToken },
      success: true,
      error: false,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message, error: true, success: false });
  }
}

// LOGOUT
export async function logoutController(req, res) {
  try {
    const userId = req.userId;
    const cookiesOption = { httpOnly: true, secure: false, sameSite: "Lax" };
    res.clearCookie("accessToken", cookiesOption);
    res.clearCookie("refreshToken", cookiesOption);
    if (userId) {
      await UserModel.findByIdAndUpdate(userId, { refresh_token: "" });
    }
    return res
      .status(200)
      .json({ message: "Logout successful", success: true, error: false });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message, error: true, success: false });
  }
}

// GET USER DETAILS
export async function userDetails(req, res) {
  try {
    const user = await UserModel.findById(req.userId).select(
      "-password -refresh_token",
    );
    return res.json({ data: user, success: true, error: false });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message, error: true, success: false });
  }
}

// UPDATE USER
export async function updateUserDetails(req, res) {
  try {
    const { name, email, mobile } = req.body;
    const updatedUser = await UserModel.findByIdAndUpdate(
      req.userId,
      { name, email, mobile },
      { new: true },
    ).select("-password");
    return res.json({
      message: "Updated successfully",
      data: updatedUser,
      success: true,
      error: false,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message, error: true, success: false });
  }
}

// ================= FORGOT PASSWORD =================
export async function forgotPasswordController(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required", error: true, success: false });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No account found with this email", error: true, success: false });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // ← FIX: was user.save(0) which crashes — now using findByIdAndUpdate only
    await UserModel.findByIdAndUpdate(user._id, {
      otp,
      otpExpiry: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    // Send OTP email
    await sendEmailFun({
      sendTo:  email,
      subject: "Reset Your Password — Rahila Coffee",
      text:    `Your password reset OTP is: ${otp}. It expires in 10 minutes.`,
      html:    verifyEmailTemplate(user.name, otp),
    });

    return res.status(200).json({
      message: "OTP sent to your email",
      error:   false,
      success: true,
    });
  } catch (error) {
    console.error("Forgot password error:", error.message);
    return res.status(500).json({ message: error.message, error: true, success: false });
  }
}

// ================= VERIFY FORGOT PASSWORD OTP =================
export async function verifyforgotPasswordOtp(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required", error: true, success: false });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found", error: true, success: false });
    }

    if (otp !== user.otp) {
      return res.status(400).json({ message: "Invalid OTP", error: true, success: false });
    }

    if (Date.now() > user.otpExpiry) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one.", error: true, success: false });
    }

    // Clear OTP after successful verification
    await UserModel.findByIdAndUpdate(user._id, { otp: null, otpExpiry: null });

    return res.status(200).json({
      message: "OTP verified successfully",
      error:   false,
      success: true,
    });
  } catch (error) {
    console.error("Verify OTP error:", error.message);
    return res.status(500).json({ message: error.message, error: true, success: false });
  }
}

// ================= RESET PASSWORD =================
export async function resetPassword(req, res) {
  try {
    // ← FIX: backend had typo "confrimPassword" — now accepts both spellings
    const { email, newPassword, confirmPassword, confrimPassword } = req.body;
    const confirmedPass = confirmPassword || confrimPassword;

    if (!email || !newPassword || !confirmedPass) {
      return res.status(400).json({ message: "Email, new password, and confirm password are required", error: true, success: false });
    }

    if (newPassword !== confirmedPass) {
      return res.status(400).json({ message: "Passwords do not match", error: true, success: false });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters", error: true, success: false });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found", error: true, success: false });
    }

    const salt         = await bcryptjs.genSalt(10);
    const hashPassword = await bcryptjs.hash(newPassword, salt);

    await UserModel.findByIdAndUpdate(user._id, { password: hashPassword });

    return res.json({ message: "Password updated successfully", error: false, success: true });
  } catch (error) {
    console.error("Reset password error:", error.message);
    return res.status(500).json({ message: error.message, error: true, success: false });
  }
}

// REFRESH TOKEN
export async function refreshToken(req, res) {
  try {
    const token =
      req.cookies.refreshToken || req?.headers?.authorization?.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ message: "Invalid token", error: true, success: false });
    }
    const verifyToken = jwt.verify(token, process.env.SECRET_KEY_REFRESH_TOKEN);
    if (!verifyToken) {
      return res
        .status(401)
        .json({ message: "Token expired", error: true, success: false });
    }
    const newAccessToken = await generatedAccessToken(verifyToken.id);
    const cookiesOption = { httpOnly: true, secure: false, sameSite: "Lax" };
    res.cookie("accessToken", newAccessToken, cookiesOption);
    return res.json({
      message: "New token generated",
      data: { accessToken: newAccessToken },
      success: true,
      error: false,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message, error: true, success: false });
  }
}
