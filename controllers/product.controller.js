// ── product.controller.js ─────────────────────────────────────────
import ProductModel from "../models/product.model.js"
import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// ── CREATE PRODUCT ──────────────────────────────────────────────
export async function createProduct(req, res) {
  try {
    const images = []

    // Upload to Cloudinary if files provided
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        try {
          const result = await cloudinary.uploader.upload(req.files[i].path)
          images.push(result.secure_url)
          // Delete temp file after upload
          if (fs.existsSync(req.files[i].path)) {
            fs.unlinkSync(req.files[i].path)
          }
        } catch (uploadErr) {
          console.error("Cloudinary upload error:", uploadErr.message)
        }
      }
    }

    // Use default image if nothing uploaded
    if (images.length === 0) {
      images.push("https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=300&fit=crop")
    }

    // ← FIX: use ProductModel.create() not new ProductModel().save()
    // ← FIX: category is no longer required — removed from required fields
    const product = await ProductModel.create({
      name:         req.body.name,
      description:  req.body.description || "",
      images,
      price:        Number(req.body.price) || 0,
      countInStock: Number(req.body.countInStock) || 0,
      roastLevel:   req.body.roastLevel  || "medium",
      grindType:    req.body.grindType   || "whole bean",
      origin:       req.body.origin      || "",
      rating:       Number(req.body.rating) || 0,
      isFeatured:   req.body.isFeatured  === "true" || false,
      catName:      req.body.catName     || "",
    })

    return res.status(201).json({
      message: "Product created successfully",
      data:    product,
      success: true,
      error:   false,
    })
  } catch (error) {
    // ← FIX: empty catch was hiding all errors — now we return the real message
    console.error("Create product error:", error.message)
    return res.status(500).json({
      message: error.message,
      error:   true,
      success: false,
    })
  }
}

// ── UPDATE PRODUCT ──────────────────────────────────────────────
export async function updateProduct(req, res) {
  try {
    const product = await ProductModel.findByIdAndUpdate(
      req.params.id,
      {
        name:         req.body.name,
        description:  req.body.description,
        price:        Number(req.body.price),
        countInStock: Number(req.body.countInStock),
        roastLevel:   req.body.roastLevel,
        grindType:    req.body.grindType,
        origin:       req.body.origin,
        isFeatured:   req.body.isFeatured,
      },
      { new: true }
    )
    if (!product) return res.status(404).json({ message: "Product not found", error: true })
    return res.json({ message: "Product updated", data: product, success: true, error: false })
  } catch (error) {
    console.error("Update product error:", error.message)
    return res.status(500).json({ message: error.message, error: true, success: false })
  }
}

// ── DELETE PRODUCT ──────────────────────────────────────────────
export async function deleteProduct(req, res) {
  try {
    const product = await ProductModel.findByIdAndDelete(req.params.id)
    if (!product) return res.status(404).json({ message: "Product not found", error: true })
    return res.json({ message: "Product deleted", success: true, error: false })
  } catch (error) {
    console.error("Delete product error:", error.message)
    return res.status(500).json({ message: error.message, error: true, success: false })
  }
}