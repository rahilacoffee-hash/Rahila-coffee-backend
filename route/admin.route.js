import { Router } from "express"
import auth from "../middlewares/auth.js"
import adminAuth from "../middlewares/adminAuth.js"
import ProductModel from "../models/product.model.js"
import OrderModel from "../models/order.model.js"
import UserModel from "../models/user.model.js"

const adminRouter = Router()

adminRouter.get("/products", auth, adminAuth, async (req, res) => {
  const products = await ProductModel.find().sort("-createdAt")
  res.json({ data: products, success: true })
})

adminRouter.get("/orders", auth, adminAuth, async (req, res) => {
  const orders = await OrderModel.find().populate("userId", "name email").sort("-createdAt")
  res.json({ data: orders, success: true })
})

adminRouter.get("/users", auth, adminAuth, async (req, res) => {
  const users = await UserModel.find().select("-password").sort("-createdAt")
  res.json({ data: users, success: true })
})

adminRouter.put("/orders/:id", auth, adminAuth, async (req, res) => {
  const order = await OrderModel.findByIdAndUpdate(req.params.id, { payment_status: req.body.status }, { new: true })
  res.json({ data: order, success: true })
})

adminRouter.delete("/products/:id", auth, adminAuth, async (req, res) => {
  await ProductModel.findByIdAndDelete(req.params.id)
  res.json({ message: "Deleted", success: true })
})

export default adminRouter