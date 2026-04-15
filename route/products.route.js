import { Router } from "express";
import {
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";
import auth from "../middlewares/auth.js";
import upload from "../middlewares/multer.js";
import ProductModel from "../models/product.model.js";

const productRouter = Router();

// Public routes
productRouter.get("/", async (req, res) => {
  try {
    const { roast, search } = req.query;
    let query = {};
    if (roast) query.roastLevel = roast;
    if (search) query.name = new RegExp(search, "i");
    const products = await ProductModel.find(query).sort("-createdAt");
    res.json({ data: products, success: true, error: false });
  } catch (error) {
    res.status(500).json({ message: error.message, error: true });
  }
});

productRouter.get("/:id", async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Not found" });
    res.json({ data: product, success: true, error: false });
  } catch (error) {
    res.status(500).json({ message: error.message, error: true });
  }
});

// Protected routes — auth required
productRouter.post("/", auth, upload.array("images"), createProduct);
productRouter.put("/:id", auth, upload.array("images"), updateProduct);
productRouter.delete("/:id", auth, deleteProduct);

export default productRouter;
