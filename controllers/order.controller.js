import Stripe from "stripe";
import OrderModel from "../models/order.model.js";
import CartProductModel from "../models/cartproduct.model.js";
import UserModel from "../models/user.model.js";
import { sendEmail } from "../config/emailService.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* ================= CREATE PAYMENT INTENT ================= */
export async function createPaymentIntent(req, res) {
  try {
    const userId = req.userId;

    const cartItems = await CartProductModel.find({ userId }).populate("productId");

    const validItems = cartItems.filter(i => i.productId);

    if (validItems.length === 0) {
      return res.status(400).json({
        message: "Cart is empty",
        success: false,
        error: true
      });
    }

    const totalAmt = validItems.reduce(
      (sum, item) => sum + item.productId.price * item.quantity,
      0
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmt * 100),
      currency: "usd",
      metadata: {
        userId: String(userId),
      },
    });

    return res.json({
      clientSecret: paymentIntent.client_secret,
      totalAmt,
      success: true,
      error: false,
    });

  } catch (err) {
    console.error("createPaymentIntent error:", err);
    return res.status(500).json({
      message: err.message,
      success: false,
      error: true,
    });
  }
}

/* ================= PLACE ORDER ================= */
export async function placeOrder(req, res) {
  try {
    const userId = req.userId;
    const { paymentId, delivery_address } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        message: "Missing paymentId",
        success: false,
        error: true,
      });
    }

    const cartItems = await CartProductModel.find({ userId }).populate("productId");

    const validItems = cartItems.filter(i => i.productId);

    if (validItems.length === 0) {
      return res.status(400).json({
        message: "Cart is empty",
        success: false,
        error: true,
      });
    }

    const user = await UserModel.findById(userId);

    const subTotalAmt = validItems.reduce(
      (sum, item) => sum + item.productId.price * item.quantity,
      0
    );

    const shipping = 5;
    const totalAmt = subTotalAmt + shipping;

    const createdOrders = [];

    for (const item of validItems) {
      const order = await OrderModel.create({
        userId,
        orderId: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        productId: item.productId._id,
        product_details: {
          name: item.productId.name,
          image: item.productId.images?.[0] || "",
        },
        paymentId,
        payment_status: "paid",
        delivery_address: delivery_address || {},
        subTotalAmt: item.productId.price * item.quantity,
        totalAmt,
      });

      createdOrders.push(order);
    }

    await CartProductModel.deleteMany({ userId });

    /* ================= EMAIL ================= */
    if (user?.email && createdOrders.length > 0) {
      const orderId = createdOrders[0].orderId;

      const html = `
      <div style="font-family:Arial;max-width:600px;margin:auto">
        <h2>☕ Order Confirmed</h2>
        <p>Hi ${user.name}, your order has been placed successfully.</p>

        <p><b>Order ID:</b> ${orderId}</p>
        <p><b>Total:</b> $${totalAmt.toFixed(2)}</p>

        <hr/>

        <p><b>Delivery Address</b></p>
        <p>
          ${delivery_address?.street || ""}<br/>
          ${delivery_address?.city || ""}<br/>
          ${delivery_address?.zip || ""}<br/>
          ${delivery_address?.country || ""}
        </p>

        <br/>
        <p>Thanks for shopping with Rahila Coffee ☕</p>
      </div>
      `;

      try {
        await sendEmail(
          user.email,
          `Order Confirmed - ${orderId}`,
          `Your order ${orderId} is confirmed.`,
          html
        );
      } catch (emailErr) {
        console.error("Email error:", emailErr.message);
      }
    }

    return res.status(201).json({
      message: "Order placed successfully",
      data: createdOrders,
      success: true,
      error: false,
    });

  } catch (err) {
    console.error("placeOrder error:", err);
    return res.status(500).json({
      message: err.message,
      success: false,
      error: true,
    });
  }
}

/* ================= GET ORDERS ================= */
export async function getMyOrders(req, res) {
  try {
    const orders = await OrderModel.find({ userId: req.userId })
      .sort({ createdAt: -1 });

    return res.json({
      data: orders,
      success: true,
      error: false,
    });

  } catch (err) {
    return res.status(500).json({
      message: err.message,
      success: false,
      error: true,
    });
  }
}