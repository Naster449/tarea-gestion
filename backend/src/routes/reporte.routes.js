import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/roles.middleware.js";
import * as reporteController from "../controllers/reporte.controller.js";

const r = Router();

r.use(requireAuth, requireRoles("ADMIN"));

r.get("/empleados-activos", asyncHandler(reporteController.empleadosActivos));
r.get("/asistencia-mensual", asyncHandler(reporteController.asistenciaMensual));
r.get("/planillas", asyncHandler(reporteController.planillas));
r.get("/salarios", asyncHandler(reporteController.salarios));
r.get("/areas", asyncHandler(reporteController.areas));

export default r;
