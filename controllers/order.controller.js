import Stripe from "stripe";
import OrderModel from "../models/order.model.js";
import CartProductModel from "../models/cartproduct.model.js";
import ProductModel from "../models/product.model.js";
import UserModel from "../models/user.model.js";
import AddressModel from "../models/address.model.js";

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
        error: true,
        success: false
      });
    }

    const totalAmt = validItems.reduce(
      (sum, item) => sum + item.productId.price * item.quantity,
      0
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmt * 100),
      currency: "usd",
      metadata: { userId: String(userId) }
    });

    return res.json({
      clientSecret: paymentIntent.client_secret,
      totalAmt,
      success: true,
      error: false
    });

  } catch (error) {
    console.error("createPaymentIntent error:", error);
    return res.status(500).json({
      message: error.message,
      error: true,
      success: false
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
        error: true,
        success: false
      });
    }

    const cartItems = await CartProductModel.find({ userId }).populate("productId");

    const validItems = cartItems.filter(i => i.productId);

    if (validItems.length === 0) {
      return res.status(400).json({
        message: "Cart is empty",
        error: true,
        success: false
      });
    }

    // ✅ SAFE ADDRESS CHECK
    if (!delivery_address?.street || !delivery_address?.city) {
      return res.status(400).json({
        message: "Invalid delivery address",
        error: true,
        success: false
      });
    }

    const user = await UserModel.findById(userId);

    const subTotalAmt = validItems.reduce(
      (sum, item) => sum + item.productId.price * item.quantity,
      0
    );

    const shipping = 5;
    const totalAmt = subTotalAmt + shipping;

    // ✅ CREATE ADDRESS
    const newAddress = await AddressModel.create({
      userId,
      ...delivery_address
    });

    const orders = [];

    for (const item of validItems) {
      const stock = item.productId.countInStock || 0;

      // prevent negative stock
      if (stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${item.productId.name}`,
          error: true,
          success: false
        });
      }

      const order = await OrderModel.create({
        userId,
        orderId: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        productId: item.productId._id,
        product_details: {
          name: item.productId.name,
          image: item.productId.images?.[0] || ""
        },
        paymentId,
        payment_status: "paid",
        delivery_address: newAddress._id,
        subTotalAmt: item.productId.price * item.quantity,
        totalAmt
      });

      orders.push(order);

      await ProductModel.findByIdAndUpdate(
        item.productId._id,
        { $inc: { countInStock: -item.quantity } }
      );
    }

    await CartProductModel.deleteMany({ userId });

    await UserModel.findByIdAndUpdate(userId, {
      $push: { orderHistory: { $each: orders.map(o => o._id) } }
    });

    return res.status(201).json({
      message: "Order placed successfully",
      data: orders,
      success: true,
      error: false
    });

  } catch (error) {
    console.error("placeOrder error:", error);
    return res.status(500).json({
      message: error.message,
      error: true,
      success: false
    });
  }
}

/* ================= GET ORDERS ================= */
export async function getMyOrders(req, res) {
  try {
    const orders = await OrderModel.find({ userId: req.userId })
      .populate("productId")
      .populate("delivery_address")
      .sort({ createdAt: -1 });

    return res.json({
      data: orders,
      success: true,
      error: false
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message,
      error: true,
      success: false
    });
  }
}