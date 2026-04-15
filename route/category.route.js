import { Router } from "express";
import auth from "../middlewares/auth.js";
import upload from "../middlewares/multer.js";
import { createCategoryController, uploadImages } from "../controllers/category.controller.js";

const categoryRouter = Router();
categoryRouter.post("/uploadImages",auth,upload.array('images'), uploadImages);
categoryRouter.post("/create",auth,createCategoryController);

export default categoryRouter;