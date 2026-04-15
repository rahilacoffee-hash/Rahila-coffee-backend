import { Router } from "express";
import {
  addToCartItemController,
  getCartItemController,
  updateCartItemQuantityController,
  deleteCartItemController,
} from "../controllers/cart.controller.js";
import auth from "../middlewares/auth.js";

const cartRouter = Router();

cartRouter.post("/add", auth, addToCartItemController);
cartRouter.get("/", auth, getCartItemController);
cartRouter.put("/update", auth, updateCartItemQuantityController);
cartRouter.delete("/delete", auth, deleteCartItemController);

export default cartRouter;
