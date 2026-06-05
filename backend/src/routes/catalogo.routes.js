import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/roles.middleware.js";
import * as catalogoController from "../controllers/catalogo.controller.js";

const r = Router();

r.get("/areas", requireAuth, asyncHandler(catalogoController.areasList));
r.post("/areas", requireAuth, requireRoles("ADMIN"), asyncHandler(catalogoController.areasCreate));

r.get("/cargos", requireAuth, asyncHandler(catalogoController.cargosList));
r.post("/cargos", requireAuth, requireRoles("ADMIN"), asyncHandler(catalogoController.cargosCreate));
r.get(
  "/admins",
  requireAuth,
  requireRoles("ADMIN"),
  asyncHandler(catalogoController.adminsList)
);

export default r;
