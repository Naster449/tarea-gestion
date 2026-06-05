import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new HttpError(401, "Token no proporcionado"));
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = {
      id: payload.sub,
      rol: payload.rol,
      empleadoId: payload.empleadoId || null,
      ownerAdminId: payload.ownerAdminId || null,
    };
    next();
  } catch {
    next(new HttpError(401, "Token inválido o expirado"));
  }
}
