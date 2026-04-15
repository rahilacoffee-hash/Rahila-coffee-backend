// routes/review.route.js
import { Router } from "express"
import ReviewModel  from "../models/review.model.js"
import OrderModel   from "../models/order.model.js"
import auth         from "../middlewares/auth.js"

const reviewRouter = Router()

// ── GET all reviews for a product ──────────────────────────────
reviewRouter.get("/:productId", async (req, res) => {
  try {
    const reviews = await ReviewModel
      .find({ product: req.params.productId })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 })

    const avgRating = reviews.length
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0

    return res.json({
      data: reviews,
      avgRating: Number(avgRating),
      total: reviews.length,
      success: true,
      error: false,
    })
  } catch (err) {
    return res.status(500).json({ message: err.message, error: true, success: false })
  }
})

// ── POST a review (auth required) ─────────────────────────────
reviewRouter.post("/:productId", auth, async (req, res) => {
  try {
    const { rating, comment } = req.body
    const productId = req.params.productId
    const userId    = req.userId

    if (!rating || !comment) {
      return res.status(400).json({ message: "Rating and comment are required", error: true })
    }

    // Check if already reviewed
    const existing = await ReviewModel.findOne({ product: productId, user: userId })
    if (existing) {
      return res.status(400).json({
        message: "You have already reviewed this product",
        error: true, success: false,
      })
    }

    // Check if verified purchase
    const purchased = await OrderModel.findOne({
      userId,
      productId,
      payment_status: { $in: ["paid", "delivered"] },
    })

    const review = await ReviewModel.create({
      product:  productId,
      user:     userId,
      rating:   Number(rating),
      comment:  comment.trim(),
      verified: !!purchased,
    })

    // Populate user info before returning
    await review.populate("user", "name avatar")

    return res.status(201).json({
      message: "Review submitted successfully",
      data: review,
      success: true,
      error: false,
    })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "You already reviewed this product", error: true })
    }
    return res.status(500).json({ message: err.message, error: true, success: false })
  }
})

// ── DELETE own review ──────────────────────────────────────────
reviewRouter.delete("/:reviewId", auth, async (req, res) => {
  try {
    const review = await ReviewModel.findOne({
      _id:  req.params.reviewId,
      user: req.userId,
    })
    if (!review) {
      return res.status(404).json({ message: "Review not found", error: true })
    }
    await review.deleteOne()
    return res.json({ message: "Review deleted", success: true, error: false })
  } catch (err) {
    return res.status(500).json({ message: err.message, error: true, success: false })
  }
})

export default reviewRouter