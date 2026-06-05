import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/roles.middleware.js";
import * as usuarioController from "../controllers/usuario.controller.js";

const r = Router();

r.use(requireAuth, requireRoles("ADMIN"));

r.get("/", asyncHandler(usuarioController.list));
r.post("/", asyncHandler(usuarioController.create));

export default r;
