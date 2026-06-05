import { randomUUID } from "crypto";
import { all, get, run } from "../db/index.js";
import { HttpError } from "../utils/httpError.js";

function resolveOwnerAdminId(authUser) {
  const ownerAdminId = authUser.rol === "ADMIN" ? authUser.id : authUser.ownerAdminId;
  if (!ownerAdminId) throw new HttpError(403, "Usuario sin admin propietario");
  return ownerAdminId;
}

export async function listSedes(authUser) {
  const ownerAdminId = resolveOwnerAdminId(authUser);
  return all(
    `SELECT * FROM sedes WHERE ownerAdminId = ? ORDER BY nombre`,
    [ownerAdminId]
  );
}

export async function getSedeById(id, authUser) {
  const ownerAdminId = resolveOwnerAdminId(authUser);
  const row = await get(`SELECT * FROM sedes WHERE id = ? AND ownerAdminId = ?`, [id, ownerAdminId]);
  if (!row) throw new HttpError(404, "Sede no encontrada");
  return row;
}

export async function createSede(body, authUser) {
  const ownerAdminId = resolveOwnerAdminId(authUser);
  const { nombre, latitud, longitud, radioMetros } = body;
  if (!nombre || latitud == null || longitud == null) {
    throw new HttpError(400, "nombre, latitud y longitud son requeridos");
  }
  const id = randomUUID();
  const now = new Date().toISOString();
  await run(
    `INSERT INTO sedes (id, nombre, latitud, longitud, radioMetros, ownerAdminId, activo, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [id, nombre, Number(latitud), Number(longitud), Number(radioMetros) || 100, ownerAdminId, now, now]
  );
  return get(`SELECT * FROM sedes WHERE id = ?`, [id]);
}

export async function updateSede(id, body, authUser) {
  await getSedeById(id, authUser);
  const now = new Date().toISOString();
  const row = await get(`SELECT * FROM sedes WHERE id = ?`, [id]);
  await run(
    `UPDATE sedes SET
       nombre = ?, latitud = ?, longitud = ?, radioMetros = ?, activo = ?, updatedAt = ?
     WHERE id = ?`,
    [
      body.nombre ?? row.nombre,
      body.latitud != null ? Number(body.latitud) : row.latitud,
      body.longitud != null ? Number(body.longitud) : row.longitud,
      body.radioMetros != null ? Number(body.radioMetros) : row.radioMetros,
      body.activo != null ? (body.activo ? 1 : 0) : row.activo,
      now,
      id,
    ]
  );
  return get(`SELECT * FROM sedes WHERE id = ?`, [id]);
}

export async function deleteSede(id, authUser) {
  await getSedeById(id, authUser);
  await run(`DELETE FROM sedes WHERE id = ?`, [id]);
}

/** Resuelve la sede autorizada para un empleado (sede asignada o la única activa del tenant). */
export async function resolveSedeForEmpleado(empleadoId, ownerAdminId) {
  const emp = await get(`SELECT sedeId FROM empleados WHERE id = ?`, [empleadoId]);
  if (emp?.sedeId) {
    const sede = await get(
      `SELECT * FROM sedes WHERE id = ? AND ownerAdminId = ? AND activo = 1`,
      [emp.sedeId, ownerAdminId]
    );
    if (sede) return sede;
  }
  const sedes = await all(
    `SELECT * FROM sedes WHERE ownerAdminId = ? AND activo = 1 ORDER BY nombre LIMIT 1`,
    [ownerAdminId]
  );
  return sedes[0] || null;
}
