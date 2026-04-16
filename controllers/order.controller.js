// controllers/order.controller.js
import Stripe from "stripe";
import OrderModel from "../models/order.model.js";
import CartProductModel from "../models/cartproduct.model.js";
import UserModel from "../models/user.model.js";
import AddressModel from "../models/address.model.js"; // ✅ IMPORTANT
import { sendEmail } from "../config/emailService.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ─────────────────────────────────────────────
// CREATE PAYMENT INTENT
// ─────────────────────────────────────────────
export async function createPaymentIntent(req, res) {
  try {
    const userId = req.userId;

    const cartItems = await CartProductModel.find({ userId }).populate("productId");

    if (!cartItems.length) {
      return res.status(400).json({
        message: "Your cart is empty",
        error: true,
        success: false,
      });
    }

    const validItems = cartItems.filter(item => item.productId);

    const totalAmt = validItems.reduce(
      (sum, item) => sum + item.productId.price * item.quantity,
      0
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
    return res.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}

// ─────────────────────────────────────────────
// PLACE ORDER
// ─────────────────────────────────────────────
export async function placeOrder(req, res) {
  try {
    const userId = req.userId;
    const { paymentId, delivery_address } = req.body;

    // ✅ VALIDATION
    if (!paymentId) {
      return res.status(400).json({
        message: "Payment not completed",
        error: true,
      });
    }

    if (!delivery_address) {
      return res.status(400).json({
        message: "Delivery address required",
        error: true,
      });
    }

    // ✅ FETCH ADDRESS (FIXES YOUR ERROR)
    const addressDoc = await AddressModel.findById(delivery_address);

    if (!addressDoc) {
      return res.status(400).json({
        message: "Invalid address",
        error: true,
      });
    }

    // GET CART
    const cartItems = await CartProductModel.find({ userId }).populate("productId");

    if (!cartItems.length) {
      return res.status(400).json({
        message: "Cart is empty",
        error: true,
      });
    }

    const user = await UserModel.findById(userId);

    const validItems = cartItems.filter(item => item.productId);

    const totalAmt = validItems.reduce(
      (sum, item) => sum + item.productId.price * item.quantity,
      0
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
        delivery_address: addressDoc._id, // ✅ FIXED
        subTotalAmt: item.productId.price * item.quantity,
        totalAmt: totalAmt + 5,
      });

      createdOrders.push(order);
    }

    // CLEAR CART
    await CartProductModel.deleteMany({ userId });

    // ── SEND EMAIL ─────────────────────────────
    if (user?.email) {
      const firstItem = validItems[0];
      const orderId = createdOrders[0]?.orderId || "";
      const totalFinal = (totalAmt + 5).toFixed(2);

      const html = `
        <div style="font-family:Arial,sans-serif;">
          <h2>Order Confirmed ✅</h2>
          <p>Hello ${user.name},</p>
          <p>Your order <b>${orderId}</b> has been placed successfully.</p>
          
          <p><b>Product:</b> ${firstItem?.productId?.name}</p>
          <p><b>Total:</b> $${totalFinal}</p>

          <h4>Delivery Address</h4>
          <p>
            ${addressDoc.street}<br/>
            ${addressDoc.city} ${addressDoc.zip}<br/>
            ${addressDoc.country}
          </p>

          <p>🚚 Delivery in 2–4 days</p>
        </div>
      `;

      try {
        await sendEmail(
          user.email,
          `Order Confirmed — ${orderId}`,
          `Your order ${orderId} is successful`,
          html
        );
      } catch (err) {
        console.error("Email failed:", err.message);
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
    return res.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}

// ─────────────────────────────────────────────
// GET MY ORDERS
// ─────────────────────────────────────────────
export async function getMyOrders(req, res) {
  try {
    const orders = await OrderModel.find({ userId: req.userId })
      .populate("delivery_address") // ✅ OPTIONAL (shows address)
      .sort({ createdAt: -1 });

    return res.json({
      data: orders,
      success: true,
      error: false,
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}