import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/roles.middleware.js";
import * as asistenciaController from "../controllers/asistencia.controller.js";

const r = Router();

// Rutas públicas (No requieren token)
r.post("/entrada-automatica", asyncHandler(asistenciaController.entradaAutomatica));
r.post("/salida-automatica", asyncHandler(asistenciaController.salidaAutomatica));

r.use(requireAuth);

r.post("/entrada", asyncHandler(asistenciaController.entrada));
r.post("/salida", asyncHandler(asistenciaController.salida));
r.post("/ausencia", requireRoles("ADMIN", "RRHH"), asyncHandler(asistenciaController.ausencia));

r.get("/", asyncHandler(asistenciaController.list));
r.get("/resumen", requireRoles("ADMIN", "RRHH"), asyncHandler(asistenciaController.resumen));
r.get("/mi-sede", asyncHandler(asistenciaController.miSede));

export default r;
