import { randomUUID } from "crypto";
import { all, run } from "../db/index.js";

export async function registrarAuditoria({
  userId,
  empleadoId,
  accion,
  detalles,
  latitud,
  longitud,
  validacionFacial,
  validacionUbicacion,
}) {
  const id = randomUUID();
  const now = new Date().toISOString();
  await run(
    `INSERT INTO auditoria_marcaciones
     (id, userId, empleadoId, accion, detalles, latitud, longitud, validacionFacial, validacionUbicacion, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      empleadoId,
      accion,
      detalles || null,
      latitud ?? null,
      longitud ?? null,
      validacionFacial || null,
      validacionUbicacion || null,
      now,
    ]
  );
  return id;
}

export async function listAuditoria(query, authUser) {
  const ownerAdminId = authUser.rol === "ADMIN" ? authUser.id : authUser.ownerAdminId;
  if (!ownerAdminId) return [];

  const desde = query.desde ? String(query.desde) : "";
  const hasta = query.hasta ? String(query.hasta) : "";
  const conditions = [`e.ownerAdminId = ?`];
  const params = [ownerAdminId];

  if (desde) {
    conditions.push(`date(a.createdAt) >= ?`);
    params.push(desde);
  }
  if (hasta) {
    conditions.push(`date(a.createdAt) <= ?`);
    params.push(hasta);
  }

  return all(
    `SELECT a.*, u.email, u.username, e.nombres, e.apellidos
     FROM auditoria_marcaciones a
     JOIN usuarios u ON u.id = a.userId
     JOIN empleados e ON e.id = a.empleadoId
     WHERE ${conditions.join(" AND ")}
     ORDER BY datetime(a.createdAt) DESC
     LIMIT 500`,
    params
  );
}
