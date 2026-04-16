// controllers/order.controller.js
import Stripe from "stripe";
import OrderModel from "../models/order.model.js";
import CartProductModel from "../models/cartproduct.model.js";
import UserModel from "../models/user.model.js";
import { sendEmail } from "../config/emailService.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createPaymentIntent(req, res) {
  try {
    const userId = req.userId;
    const cartItems = await CartProductModel.find({ userId }).populate(
      "productId",
    );

    if (!cartItems || cartItems.length === 0) {
      return res
        .status(400)
        .json({ message: "Your cart is empty", error: true, success: false });
    }

    const validItems = cartItems.filter((item) => item.productId);
    const totalAmt = validItems.reduce(
      (sum, item) => sum + item.productId.price * item.quantity,
      0,
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmt * 100),
      currency: "usd",
      metadata: { userId: userId.toString() },
    });

    return res.json({
      clientSecret: paymentIntent.client_secret,
      totalAmt,
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Payment intent error:", error.message);
    return res
      .status(500)
      .json({ message: error.message, error: true, success: false });
  }
}

export async function placeOrder(req, res) {
  try {
    const userId = req.userId;
    const { paymentId, delivery_address } = req.body;

    const cartItems = await CartProductModel.find({ userId }).populate(
      "productId",
    );
    if (!cartItems || cartItems.length === 0) {
      return res
        .status(400)
        .json({ message: "Cart is empty", error: true, success: false });
    }

    const user = await UserModel.findById(userId);
    const validItems = cartItems.filter((item) => item.productId);
    const totalAmt = validItems.reduce(
      (sum, item) => sum + item.productId.price * item.quantity,
      0,
    );
    const createdOrders = [];

    for (const item of validItems) {
      const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const order = await OrderModel.create({
        userId,
        orderId,
        productId: item.productId._id,
        product_details: {
          name: item.productId.name,
          image: item.productId.images,
        },
        paymentId,
        payment_status: "paid",
        delivery_address,
        subTotalAmt: item.productId.price * item.quantity,
        totalAmt: totalAmt + 5,
      });
      createdOrders.push(order);
    }

    await CartProductModel.deleteMany({ userId });

    // ── Send confirmation email ───────────────────────────────
    if (user?.email) {
      const firstItem = validItems[0];
      const productName = firstItem?.productId?.name || "Your Order";
      const orderId = createdOrders[0]?.orderId || "";
      const totalFinal = (totalAmt + 5).toFixed(2);

      const html = `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          <div style="background:#1A0F0A;padding:24px 32px;text-align:center;">
            <h1 style="margin:0;color:#D4A853;font-size:24px;font-weight:800;">☕ Rahila Coffee</h1>
            <p style="margin:4px 0 0;color:#B8A99A;font-size:12px;">Order Confirmation</p>
          </div>
          <div style="background:#D1FAE5;padding:12px 32px;text-align:center;">
            <p style="margin:0;color:#065F46;font-size:14px;font-weight:700;">✅ Order placed successfully!</p>
          </div>
          <div style="padding:28px 32px;">
            <p style="font-size:15px;color:#1A0F0A;">Hi <strong>${user.name}</strong>,</p>
            <p style="font-size:13px;color:#6B5B4E;line-height:1.6;">Thank you! Your coffee is being prepared and will ship soon.</p>
            <div style="background:#FEF3C7;border-radius:10px;padding:14px 18px;margin:16px 0;">
              <p style="margin:0;font-size:11px;color:#92400E;font-weight:700;text-transform:uppercase;">Order ID</p>
              <p style="margin:4px 0 0;font-size:16px;font-weight:800;color:#1A0F0A;font-family:monospace;">${orderId}</p>
            </div>
            <p style="font-size:14px;font-weight:700;color:#1A0F0A;">${productName}</p>
            <p style="font-size:16px;font-weight:800;color:#92400E;">Total: $${totalFinal}</p>
            ${
              delivery_address
                ? `
            <div style="background:#f9f9f9;border:1px solid #e8e0d8;border-radius:10px;padding:12px 16px;margin:16px 0;">
              <p style="margin:0;font-size:11px;color:#9CA3AF;text-transform:uppercase;font-weight:700;">Delivery Address</p>
              <p style="margin:6px 0 0;font-size:13px;color:#4B3832;line-height:1.6;">
                ${delivery_address.street || ""}<br/>${delivery_address.city || ""} ${delivery_address.zip || ""}<br/>${delivery_address.country || ""}
              </p>
            </div>`
                : ""
            }
            <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;padding:12px 16px;margin:16px 0;">
              <p style="margin:0;font-size:13px;color:#1E40AF;">🚚 <strong>Estimated delivery:</strong> 2–4 business days</p>
            </div>
            <div style="text-align:center;margin-top:20px;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/order-tracking"
                style="display:inline-block;background:#92400E;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 28px;border-radius:12px;">
                Track My Order →
              </a>
            </div>
          </div>
          <div style="padding:16px 32px;text-align:center;border-top:1px solid #f0e8e0;">
            <p style="margin:0;font-size:11px;color:#9CA3AF;">Questions? Email <a href="mailto:hello@rahilacoffee.com" style="color:#92400E;">hello@rahilacoffee.com</a></p>
            <p style="margin:6px 0 0;font-size:11px;color:#C4B5A8;">© ${new Date().getFullYear()} Rahila Coffee · Abuja, Nigeria</p>
          </div>
        </div>
      `;

      try {
        // ← positional args matching your emailService.js: sendEmail(to, subject, text, html)
        await sendEmail(
          user.email,
          `✅ Order Confirmed — ${orderId}`,
          `Order ${orderId} placed. Total: $${totalFinal}`,
          html,
        );
        console.log("✅ Confirmation email sent to:", user.email);
      } catch (emailErr) {
        console.error("❌ Email failed (order still saved):", emailErr.message);
      }
    }

    return res.json({
      message: "Order placed successfully",
      data: createdOrders,
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Place order error:", error.message);
    return res
      .status(500)
      .json({ message: error.message, error: true, success: false });
  }
}

export async function getMyOrders(req, res) {
  try {
    const orders = await OrderModel.find({ userId: req.userId }).sort({
      createdAt: -1,
    });
    return res.json({ data: orders, success: true, error: false });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message, error: true, success: false });
  }
}
