// controllers/order.controller.js
import Stripe           from "stripe"
import OrderModel       from "../models/order.model.js"
import CartProductModel from "../models/cartproduct.model.js"
import ProductModel     from "../models/product.model.js"
import UserModel        from "../models/user.model.js"
import sendEmail        from "../config/sendEmail.js"
import orderConfirmationEmail from "../utils/orderConfirmationEmail.js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// ── CREATE PAYMENT INTENT ──────────────────────────────────────
export async function createPaymentIntent(req, res) {
  try {
    const userId    = req.userId
    const cartItems = await CartProductModel.find({ userId }).populate("productId")

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        message: "Your cart is empty. Add products before checkout.",
        error: true, success: false,
      })
    }

    const validItems = cartItems.filter(item => item.productId)
    const totalAmt   = validItems.reduce(
      (sum, item) => sum + item.productId.price * item.quantity, 0
    )

    const paymentIntent = await stripe.paymentIntents.create({
      amount:   Math.round(totalAmt * 100),
      currency: "usd",
      metadata: { userId: userId.toString() },
    })

    return res.json({
      clientSecret: paymentIntent.client_secret,
      totalAmt,
      success: true,
      error:   false,
    })
  } catch (error) {
    console.error("Payment intent error:", error.message)
    return res.status(500).json({ message: error.message, error: true, success: false })
  }
}

// ── PLACE ORDER + SEND CONFIRMATION EMAIL ─────────────────────
export async function placeOrder(req, res) {
  try {
    const userId          = req.userId
    const { paymentId, delivery_address } = req.body

    // Get cart items
    const cartItems = await CartProductModel.find({ userId }).populate("productId")
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty", error: true, success: false })
    }

    // Get user details for email
    const user = await UserModel.findById(userId)

    const validItems = cartItems.filter(item => item.productId)
    const totalAmt   = validItems.reduce(
      (sum, item) => sum + item.productId.price * item.quantity, 0
    )

    // Create one order per cart item
    const createdOrders = []
    for (const item of validItems) {
      const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`

      const order = await OrderModel.create({
        userId,
        orderId,
        productId:       item.productId._id,
        product_details: {
          name:  item.productId.name,
          image: item.productId.images,
        },
        paymentId,
        payment_status:  "paid",
        delivery_address,
        subTotalAmt:     item.productId.price * item.quantity,
        totalAmt:        totalAmt + 5, // +$5 shipping
      })

      createdOrders.push(order)
    }

    // Clear cart
    await CartProductModel.deleteMany({ userId })

    // ── Send confirmation email to user ───────────────────────
    if (user?.email) {
      const firstItem = validItems[0]
      try {
        await sendEmail({
          sendTo:  user.email,
          subject: `✅ Order Confirmed — ${createdOrders[0].orderId}`,
          html:    orderConfirmationEmail({
            userName:        user.name,
            orderId:         createdOrders[0].orderId,
            productName:     firstItem.productId.name,
            productImage:    firstItem.productId.images?.[0] || "",
            totalAmt:        totalAmt + 5,
            deliveryAddress: delivery_address,
          }),
        })
        console.log("✅ Order confirmation email sent to:", user.email)
      } catch (emailErr) {
        // Don't fail the order if email fails — just log
        console.error("❌ Failed to send confirmation email:", emailErr.message)
      }
    }

    return res.json({
      message: "Order placed successfully",
      data:    createdOrders,
      success: true,
      error:   false,
    })
  } catch (error) {
    console.error("Place order error:", error.message)
    return res.status(500).json({ message: error.message, error: true, success: false })
  }
}

// ── GET MY ORDERS ──────────────────────────────────────────────
export async function getMyOrders(req, res) {
  try {
    const orders = await OrderModel
      .find({ userId: req.userId })
      .sort({ createdAt: -1 })

    return res.json({ data: orders, success: true, error: false })
  } catch (error) {
    return res.status(500).json({ message: error.message, error: true, success: false })
  }
}