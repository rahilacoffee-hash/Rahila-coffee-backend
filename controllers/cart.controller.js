import CartProductModel from "../models/cartproduct.model.js"
import UserModel from "../models/user.model.js"

export const addToCartItemController = async (req, res) => {
  try {
    const { productId } = req.body
    const userId = req.userId
    if (!productId) return res.status(400).json({ message: "Provide product ID", error: true, success: false })
    const checkItemCart = await CartProductModel.findOne({ userId, productId })
    if (checkItemCart) return res.status(400).json({ message: "Item already in cart", error: true, success: false })
    const cartItem = new CartProductModel({ productId, quantity: 1, userId })
    const saved = await cartItem.save()
    await UserModel.updateOne({ _id: userId }, { $push: { shopping_cart: productId } })
    return res.status(200).json({ data: saved, message: "Item added", success: true, error: false })
  } catch (error) {
    return res.status(500).json({ message: error.message, error: true, success: false })
  }
}

export const getCartItemController = async (req, res) => {
  try {
    const userId = req.userId
    const cartItems = await CartProductModel.find({ userId }).populate("productId")
    return res.json({ data: cartItems, success: true, error: false })
  } catch (error) {
    return res.status(500).json({ message: error.message, error: true, success: false })
  }
}

export const updateCartItemQuantityController = async (req, res) => {
  try {
    const userId = req.userId
    const { id, quantity } = req.body
    if (!id || !quantity) return res.status(400).json({ message: "Provide ID and quantity", error: true, success: false })
    const updated = await CartProductModel.updateOne({ _id: id, userId }, { quantity })
    return res.json({ data: updated, message: "Cart updated", success: true, error: false })
  } catch (error) {
    return res.status(500).json({ message: error.message, error: true, success: false })
  }
}

export const deleteCartItemController = async (req, res) => {
  try {
    const userId = req.userId
    const { id, productId } = req.body
    if (!id) return res.status(400).json({ message: "Provide ID", error: true, success: false })
    const deleted = await CartProductModel.deleteOne({ _id: id, userId })
    if (deleted.deletedCount === 0) return res.status(404).json({ message: "Item not found", error: true, success: false })
    const user = await UserModel.findById(userId)
    if (user) {
      const index = user.shopping_cart.indexOf(productId)
      if (index > -1) { user.shopping_cart.splice(index, 1); await user.save() }
    }
    return res.json({ message: "Item removed", success: true, error: false })
  } catch (error) {
    return res.status(500).json({ message: error.message, error: true, success: false })
  }
}