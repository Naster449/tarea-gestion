import { HttpError } from "../utils/httpError.js";

const ROLES = ["ADMIN", "RRHH", "EMPLEADO"];

export function requireRoles(...allowed) {
  const set = new Set(allowed);
  return (req, _res, next) => {
    if (!req.user?.rol) {
      return next(new HttpError(401, "No autenticado"));
    }
    if (!set.has(req.user.rol)) {
      return next(new HttpError(403, "No tienes permiso para esta acción"));
    }
    next();
  };
}

export { ROLES };
