import Stripe from "stripe"
import OrderModel from "../models/order.model.js"
import CartProductModel from "../models/cartproduct.model.js"
import ProductModel from "../models/product.model.js"
import UserModel from "../models/user.model.js"
import AddressModel from "../models/address.model.js"  // ✅ Import Address model

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// ────────────── CREATE PAYMENT INTENT ──────────────
export async function createPaymentIntent(req, res) {
  try {
    const userId = req.userId
    const cartItems = await CartProductModel.find({ userId }).populate("productId")
    if (!cartItems.length)
      return res.status(400).json({ message: "Cart is empty", error: true, success: false })

    const totalAmt = cartItems.reduce((sum, item) => sum + (item.productId.price * item.quantity), 0)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmt * 100),
      currency: "usd",
      metadata: { userId: userId.toString() }
    })

    return res.json({ clientSecret: paymentIntent.client_secret, totalAmt, success: true, error: false })
  } catch (error) {
    return res.status(500).json({ message: error.message, error: true, success: false })
  }
}

// ────────────── PLACE ORDER ──────────────
export async function placeOrder(req, res) {
  try {
    const userId = req.userId
    const { paymentId, delivery_address } = req.body

    const cartItems = await CartProductModel.find({ userId }).populate("productId")
    if (!cartItems.length)
      return res.status(400).json({ message: "Cart is empty", error: true, success: false })

    // ✅ STEP 1: Save address first
    const newAddress = await AddressModel.create({
      userId,
      ...delivery_address
    })

    const subTotalAmt = cartItems.reduce((sum, item) => sum + item.productId.price * item.quantity, 0)
    const orders = []

    // ✅ STEP 2: Save each order with address _id
    for (const item of cartItems) {
      const order = new OrderModel({
        userId,
        orderId: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        productId: item.productId._id,
        product_details: { name: item.productId.name, image: item.productId.images },
        paymentId,
        payment_status: "paid",
        delivery_address: newAddress._id, // 👈 store ObjectId
        subTotalAmt,
        totalAmt: subTotalAmt
      })

      const saved = await order.save()
      orders.push(saved)

      await ProductModel.findByIdAndUpdate(item.productId._id, { $inc: { countInStock: -item.quantity } })
    }

    await UserModel.findByIdAndUpdate(userId, { $push: { orderHistory: { $each: orders.map(o => o._id) } } })
    await CartProductModel.deleteMany({ userId })

    return res.status(201).json({ message: "Order placed", data: orders, success: true })
  } catch (error) {
    return res.status(500).json({ message: error.message, error: true })
  }
}

// ────────────── GET MY ORDERS ──────────────
export async function getMyOrders(req, res) {
  try {
    const orders = await OrderModel.find({ userId: req.userId })
      .populate("productId")
      .populate("delivery_address") // ✅ This now populates the saved address
      .sort({ createdAt: -1 })

    return res.json({ data: orders, success: true, error: false })
  } catch (error) {
    return res.status(500).json({ message: error.message, error: true, success: false })
  }
}

