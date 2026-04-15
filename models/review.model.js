// models/review.model.js
import mongoose from "mongoose"

const reviewSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.ObjectId, ref: "product", required: true },
  user:     { type: mongoose.Schema.ObjectId, ref: "User",    required: true },
  rating:   { type: Number, min: 1, max: 5, required: true },
  comment:  { type: String, required: true, trim: true },
  verified: { type: Boolean, default: false }, // true if user actually bought the product
}, { timestamps: true })

// One review per user per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true })

const ReviewModel = mongoose.model("Review", reviewSchema)
export default ReviewModel