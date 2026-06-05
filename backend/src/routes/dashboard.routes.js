import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/roles.middleware.js";
import * as dashboardController from "../controllers/dashboard.controller.js";

const r = Router();

r.get("/", requireAuth, requireRoles("ADMIN"), asyncHandler(dashboardController.index));

export default r;
