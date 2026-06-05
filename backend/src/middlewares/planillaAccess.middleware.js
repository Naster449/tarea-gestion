import { get } from "../db/index.js";
import { HttpError } from "../utils/httpError.js";

/**
 * Si el usuario es EMPLEADO y tiene planillaAccessUntil:
 * - Permite acceso SOLO hasta esa fecha/hora.
 * Si es ADMIN/RRHH: permite siempre.
 */
export async function requirePlanillaAccess(req, _res, next) {
  try {
    const rol = req.user?.rol;
    if (rol === "ADMIN" || rol === "RRHH") return next();
    if (rol !== "EMPLEADO") {
      return next(new HttpError(403, "No autorizado para planillas"));
    }

    const row = await get(`SELECT planillaAccessUntil FROM usuarios WHERE id = ?`, [req.user.id]);
    if (!row) return next(new HttpError(401, "Usuario no encontrado"));
    if (!row.planillaAccessUntil) return next(); // empleado normal (sin límite)

    const until = new Date(row.planillaAccessUntil);
    if (Number.isNaN(until.getTime())) {
      return next(new HttpError(500, "Configuración de acceso inválida"));
    }
    if (new Date() > until) {
      return next(new HttpError(403, "Acceso a planillas vencido"));
    }
    return next();
  } catch (e) {
    return next(e);
  }
}

