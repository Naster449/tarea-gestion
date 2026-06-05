import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/roles.middleware.js";
import * as sedeController from "../controllers/sede.controller.js";

const r = Router();

r.use(requireAuth);

r.get("/", asyncHandler(sedeController.list));
r.get("/:id", asyncHandler(sedeController.getOne));
r.post("/", requireRoles("ADMIN", "RRHH"), asyncHandler(sedeController.create));
r.put("/:id", requireRoles("ADMIN", "RRHH"), asyncHandler(sedeController.update));
r.delete("/:id", requireRoles("ADMIN", "RRHH"), asyncHandler(sedeController.remove));

export default r;
