import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as authController from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const r = Router();

r.post("/login", asyncHandler(authController.login));
r.post("/register", asyncHandler(authController.register));
r.get("/me", requireAuth, asyncHandler(authController.me));

export default r;
