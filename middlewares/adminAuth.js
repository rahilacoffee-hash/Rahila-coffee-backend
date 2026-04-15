import UserModel from "../models/user.model.js"

const adminAuth = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.userId)
    if (user?.role === "ADMIN") return next()
    return res.status(403).json({
      message: "Admin access only",
      error: true,
      success: false
    })
  } catch (error) {
    return res.status(500).json({ message: error.message, error: true })
  }
}

export default adminAuth