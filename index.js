import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./config/connectDb.js";

import userRouter from "./route/user.route.js";
import productRouter from "./route/products.route.js";
import cartRouter from "./route/cart.route.js";
import orderRouter from "./route/order.route.js";
import adminRouter from "./route/admin.route.js";
import authRouter from "./route/authRouter.js";
import reviewRouter from "./route/review.route.js";

dotenv.config();

const app = express();

/* ---------------- FIXED CORS ---------------- */

app.use(
  cors({
    origin: true, // ✅ allows all origins (best for deployment debugging)
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* IMPORTANT: preflight support */
app.options("*", cors());

app.use(express.json());
app.use(cookieParser());

/* ---------------- ROUTES ---------------- */
app.use("/api/user", userRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/admin", adminRouter);
app.use("/api/auth", authRouter);
app.use("/api/reviews", reviewRouter);

app.get("/", (req, res) => {
  res.send("Rahila API running 🚀");
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});