import Stripe from "stripe"
import OrderModel from "../models/order.model.js"
import CartProductModel from "../models/cartproduct.model.js"
import ProductModel from "../models/product.model.js"
import UserModel from "../models/user.model.js"
import AddressModel from "../models/address.model.js"
import sendEmail from "../config/sendEmail.js"
import orderConfirmationEmail from "../utils/orderConfirmationEmail.js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// ── PLACE ORDER ─────────────────────────────────────────────
export async function placeOrder(req, res) {
  try {
    const userId = req.userId
    const { paymentId, delivery_address } = req.body

    // ✅ validate address (IMPORTANT FIX)
    const address = await AddressModel.findById(delivery_address)

    if (!address) {
      return res.status(400).json({
        message: "Invalid delivery address",
        error: true,
        success: false
      })
    }

    // Get cart items
    const cartItems = await CartProductModel.find({ userId }).populate("productId")

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        message: "Cart is empty",
        error: true,
        success: false
      })
    }

    const validItems = cartItems.filter(item => item.productId)

    const totalAmt = validItems.reduce(
      (sum, item) => sum + item.productId.price * item.quantity,
      0
    )

    const createdOrders = []

    for (const item of validItems) {
      const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`

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

        // ✅ FIXED: store ObjectId only
        delivery_address: address._id,

        subTotalAmt: item.productId.price * item.quantity,
        totalAmt: totalAmt + 5,
      })

      createdOrders.push(order)
    }

    // Clear cart
    await CartProductModel.deleteMany({ userId })

    // Send email
    const user = await UserModel.findById(userId)

    if (user?.email && createdOrders.length > 0) {
      await sendEmail({
        sendTo: user.email,
        subject: `Order Confirmed — ${createdOrders[0].orderId}`,
        html: orderConfirmationEmail({
          userName: user.name,
          orderId: createdOrders[0].orderId,
          productName: validItems[0].productId.name,
          productImage: validItems[0].productId.images?.[0] || "",
          totalAmt: totalAmt + 5,
          deliveryAddress: `${address.street}, ${address.city}, ${address.country}`
        }),
      })
    }

    return res.json({
      message: "Order placed successfully",
      data: createdOrders,
      success: true,
      error: false,
    })

  } catch (error) {
    console.error("Place order error:", error)
    return res.status(500).json({
      message: error.message,
      error: true,
      success: false
    })
  }
}