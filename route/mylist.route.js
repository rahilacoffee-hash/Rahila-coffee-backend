import { Router } from "express";
import auth from "../middlewares/auth.js";
import { addToMyListController, deleteMyListController, getMyListController } from "../controllers/mylist.controller.js";

const myListRouter = Router();

myListRouter.post("/add",auth, addToMyListController);
myListRouter.get("/get",auth, getMyListController);
myListRouter.delete("/delete",auth, deleteMyListController);



export default myListRouter;