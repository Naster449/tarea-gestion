import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/roles.middleware.js";
import { requirePlanillaAccess } from "../middlewares/planillaAccess.middleware.js";
import * as planillaController from "../controllers/planilla.controller.js";

const r = Router();

r.use(requireAuth);

// ADMIN/RRHH: ver todo. EMPLEADO: solo si tiene acceso vigente (si aplica).
r.get("/", asyncHandler(requirePlanillaAccess), asyncHandler(planillaController.list));
r.post("/", requireRoles("ADMIN"), asyncHandler(planillaController.create));
r.get("/:id/boleta", asyncHandler(requirePlanillaAccess), asyncHandler(planillaController.boletaPdf));

export default r;
