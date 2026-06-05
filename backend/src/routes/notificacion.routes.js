import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import * as notificacionController from "../controllers/notificacion.controller.js";

const r = Router();

r.use(requireAuth);

r.get("/", asyncHandler(notificacionController.list));
r.patch("/:id/leida", asyncHandler(notificacionController.leer));

export default r;
