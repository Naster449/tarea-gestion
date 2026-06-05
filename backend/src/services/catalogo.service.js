import { randomUUID } from "crypto";
import { all, get, run } from "../db/index.js";
import { HttpError } from "../utils/httpError.js";

export async function listAreas() {
  return all(`SELECT * FROM areas ORDER BY nombre`);
}

export async function createArea(nombre) {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  await run(`INSERT INTO areas (id, nombre, createdAt) VALUES (?, ?, ?)`, [id, nombre.trim(), createdAt]);
  return get(`SELECT * FROM areas WHERE id = ?`, [id]);
}

export async function listCargos(areaId) {
  if (areaId) {
    return all(`SELECT * FROM cargos WHERE areaId = ? ORDER BY nombre`, [areaId]);
  }
  return all(`SELECT * FROM cargos ORDER BY nombre`);
}

export async function createCargo({ nombre, areaId }) {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  if (areaId) {
    const a = await get(`SELECT id FROM areas WHERE id = ?`, [areaId]);
    if (!a) throw new HttpError(404, "Área no encontrada");
  }
  await run(`INSERT INTO cargos (id, nombre, areaId, createdAt) VALUES (?, ?, ?, ?)`, [
    id,
    nombre.trim(),
    areaId || null,
    createdAt,
  ]);
  return get(`SELECT * FROM cargos WHERE id = ?`, [id]);
}

export async function listAdmins(authUser) {
  const ownerAdminId = authUser?.rol === "ADMIN" ? authUser.id : authUser?.ownerAdminId;
  if (!ownerAdminId) throw new HttpError(403, "Usuario sin admin propietario");

  return all(
    `SELECT id, username, email, createdAt
     FROM usuarios
     WHERE rol = 'ADMIN' AND id = ?
     ORDER BY datetime(createdAt) ASC`,
    [ownerAdminId]
  );
}
