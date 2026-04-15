// ── product.model.js ─────────────────────────────────────────────
import mongoose from "mongoose"

const productSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Product name is required"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Description is required"],
  },
  images: [{ type: String }],  // ← FIX: removed required:true so product saves without image

  catName: { type: String, default: "" },
  catId:   { type: String, default: "" },

  // ← FIX: category is now OPTIONAL — was blocking every product creation
  category: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      "Category",
    required: false,   // ← CHANGED from true to false
    default:  null,
  },

  price: {
    type:     Number,
    required: [true, "Price is required"],
    default:  0,
  },

  // ← FIX: countInStock is now OPTIONAL with default — was blocking creation
  countInStock: {
    type:    Number,
    required: false,
    default: 0,
    min: 0,
  },

  rating: {
    type:    Number,
    default: 0,
  },

  isFeatured: {
    type:    Boolean,
    default: false,
  },

  // ← ADDED: roastLevel and grindType for filtering
  roastLevel: {
    type:    String,
    enum:    ["light", "medium", "dark"],
    default: "medium",
  },

  grindType: {
    type:    String,
    enum:    ["whole bean", "coarse", "medium", "fine"],
    default: "whole bean",
  },

  origin: {
    type:    String,
    default: "",
  },

  productWeight: [{ type: String }],

  dateCreated: {
    type:    Date,
    default: Date.now,
  },

}, { timestamps: true })

// Text index for search
productSchema.index({ name: "text", origin: "text" })

const ProductModel = mongoose.model("product", productSchema)

export default ProductModel