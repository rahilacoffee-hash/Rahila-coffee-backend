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

/* ---------------- TRUST PROXY (IMPORTANT for Render) ---------------- */
app.set("trust proxy", 1);

app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://rahila-coffee-frontend-dusky.vercel.app", // your main domain
      ];

      // Allow any Vercel preview deployment for your project
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        /https:\/\/rahila-coffee.*\.vercel\.app/.test(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("*", cors());

/* ---------------- BODY PARSER ---------------- */
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

/* ---------------- HEALTH CHECK (CRITICAL) ---------------- */
app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "API is running" });
});

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

/* ---------------- ERROR HANDLER (IMPORTANT) ---------------- */
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

/* ---------------- START SERVER SAFELY ---------------- */
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
};

startServer();