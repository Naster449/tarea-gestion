import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/roles.middleware.js";
import { uploadFotoEmpleado } from "../middlewares/upload.middleware.js";
import * as empleadoController from "../controllers/empleado.controller.js";

const r = Router();

r.use(requireAuth);

r.get("/", asyncHandler(empleadoController.list));
r.get("/:id", asyncHandler(empleadoController.getOne));

r.post(
  "/",
  requireRoles("ADMIN", "RRHH"),
  uploadFotoEmpleado.fields([
    { name: "foto", maxCount: 1 },
    { name: "facialFoto", maxCount: 1 },
  ]),
  asyncHandler(empleadoController.create)
);

r.put(
  "/:id",
  requireRoles("ADMIN", "RRHH"),
  uploadFotoEmpleado.fields([
    { name: "foto", maxCount: 1 },
    { name: "facialFoto", maxCount: 1 },
  ]),
  asyncHandler(empleadoController.update)
);

r.post(
  "/:id/facial-descriptor",
  requireRoles("ADMIN", "RRHH"),
  asyncHandler(empleadoController.registerFacial)
);

r.delete("/:id", requireRoles("ADMIN", "RRHH"), asyncHandler(empleadoController.remove));

export default r;
