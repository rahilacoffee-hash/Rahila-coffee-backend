import Stripe from "stripe";
import OrderModel from "../models/order.model.js";
import CartProductModel from "../models/cartproduct.model.js";
import UserModel from "../models/user.model.js";
import sendEmail from "../config/sendEmail.js";
import orderConfirmationEmail from "../utils/orderConfirmationEmail.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* ─────────────────────────────
   CREATE PAYMENT INTENT
───────────────────────────── */
export async function createPaymentIntent(req, res) {
  try {
    const userId = req.userId;

    const cartItems = await CartProductModel
      .find({ userId })
      .populate("productId");

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        message: "Cart is empty",
        error: true,
        success: false,
      });
    }

    const validItems = cartItems.filter(
      item => item.productId && item.productId.price
    );

    const totalAmt = validItems.reduce(
      (sum, item) => sum + item.productId.price * item.quantity,
      0
    );

    const shipping = 5;
    const grandTotal = totalAmt + shipping;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(grandTotal * 100), // Stripe expects cents
      currency: "usd",
      metadata: {
        userId: userId.toString(),
      },
    });

    return res.json({
      clientSecret: paymentIntent.client_secret,
      totalAmt: grandTotal,
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

/* ─────────────────────────────
   PLACE ORDER (FIXED STRUCTURE)
───────────────────────────── */
export async function placeOrder(req, res) {
  try {
    const userId = req.userId;
    const { paymentId, delivery_address } = req.body;

    const cartItems = await CartProductModel
      .find({ userId })
      .populate("productId");

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        message: "Cart is empty",
        error: true,
        success: false,
      });
    }

    const user = await UserModel.findById(userId);

    const validItems = cartItems.filter(
      item => item.productId && item.productId.price
    );

    const totalAmt = validItems.reduce(
      (sum, item) => sum + item.productId.price * item.quantity,
      0
    );

    const shipping = 5;
    const grandTotal = totalAmt + shipping;

    // 🔥 SINGLE ORDER (FIXED DESIGN)
    const orderId = `ORD-${Date.now()}`;

    const order = await OrderModel.create({
      userId,
      orderId,
      products: validItems.map(item => ({
        productId: item.productId._id,
        quantity: item.quantity,
        price: item.productId.price,
      })),
      paymentId,
      payment_status: "paid",
      delivery_address,
      subTotalAmt: totalAmt,
      totalAmt: grandTotal,
    });

    // Clear cart
    await CartProductModel.deleteMany({ userId });

    // Send email (safe)
    if (user?.email) {
      try {
        await sendEmail({
          sendTo: user.email,
          subject: `✅ Order Confirmed — ${orderId}`,
          html: orderConfirmationEmail({
            userName: user.name,
            orderId,
            productName: validItems[0]?.productId?.name || "",
            productImage: validItems[0]?.productId?.images?.[0] || "",
            totalAmt: grandTotal,
            deliveryAddress: delivery_address,
          }),
        });
      } catch (err) {
        console.error("Email error:", err.message);
      }
    }

    return res.json({
      message: "Order placed successfully",
      data: order,
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

/* ─────────────────────────────
   GET MY ORDERS
───────────────────────────── */
export async function getMyOrders(req, res) {
  try {
    const orders = await OrderModel
      .find({ userId: req.userId })
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