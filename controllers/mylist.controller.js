import MyListModel from "../models/myList.model.js"

export const addToMyListController = async (req, res) => {
  try {
    const userId = req.userId
    const { productId, productTitle, image, rating, price } = req.body
    const checkItem = await MyListModel.findOne({ userId, productId })
    if (checkItem) return res.status(400).json({ message: "Already in list", error: true, success: false })
    const saved = await new MyListModel({ productId, userId, productTitle, image, rating, price }).save()
    return res.status(200).json({ data: saved, message: "Added to list", success: true, error: false })
  } catch (error) {
    return res.status(500).json({ message: error.message, error: true, success: false })
  }
}

export const getMyListController = async (req, res) => {
  try {
    const items = await MyListModel.find({ userId: req.userId })
    return res.status(200).json({ data: items, success: true, error: false })
  } catch (error) {
    return res.status(500).json({ message: error.message, error: true, success: false })
  }
}

export const deleteMyListController = async (req, res) => {
  try {
    const item = await MyListModel.findById(req.params.id)
    if (!item) return res.status(404).json({ message: "Item not found", error: true, success: false })
    await MyListModel.findByIdAndDelete(req.params.id)
    return res.status(200).json({ message: "Removed from list", success: true, error: false })
  } catch (error) {
    return res.status(500).json({ message: error.message, error: true, success: false })
  }
}