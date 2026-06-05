import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/roles.middleware.js";
import * as auditoriaService from "../services/auditoria.service.js";

const r = Router();

r.use(requireAuth);
r.use(requireRoles("ADMIN", "RRHH"));

r.get("/", asyncHandler(async (req, res) => {
  const rows = await auditoriaService.listAuditoria(req.query, req.user);
  res.json(rows);
}));

export default r;
