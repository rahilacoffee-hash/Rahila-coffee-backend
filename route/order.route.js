import { Router } from "express";
import {
  createPaymentIntent,
  placeOrder,
  getMyOrders,
} from "../controllers/order.controller.js";
import auth from "../middlewares/auth.js";

const orderRouter = Router();

orderRouter.post("/create-payment-intent", auth, createPaymentIntent);
orderRouter.post("/place", auth, placeOrder);
orderRouter.get("/my-orders", auth, getMyOrders);

export default orderRouter;
