import { randomUUID } from "crypto";
import { all, get, run } from "../db/index.js";
import { HttpError } from "../utils/httpError.js";
import { paginationMeta, parsePagination } from "../utils/pagination.js";
import { encryptJson } from "../utils/crypto.js";
import bcrypt from "bcryptjs";

const SELECT_BASE = `
  SELECT e.*,
    a.nombre AS areaNombre,
    c.nombre AS cargoNombre
  FROM empleados e
  LEFT JOIN areas a ON a.id = e.areaId
  LEFT JOIN cargos c ON c.id = e.cargoId
`;

export async function listEmpleados(query, authUser) {
  const { page, limit, offset } = parsePagination(query);
  const search = query.q ? String(query.q).trim() : "";
  const areaId = query.areaId ? String(query.areaId) : "";
  const estado = query.estado ? String(query.estado) : "";

  const conditions = [];
  const params = [];

  if (authUser.rol === "EMPLEADO") {
    if (!authUser.empleadoId) {
      return { data: [], meta: paginationMeta(0, page, limit) };
    }
    conditions.push(`e.id = ?`);
    params.push(authUser.empleadoId);
  } else {
    const ownerAdminId = authUser.rol === "ADMIN" ? authUser.id : authUser.ownerAdminId;
    if (!ownerAdminId) throw new HttpError(403, "Usuario sin admin propietario");
    conditions.push(`e.ownerAdminId = ?`);
    params.push(ownerAdminId);
  }

  if (areaId) {
    conditions.push(`e.areaId = ?`);
    params.push(areaId);
  }

  if (estado) {
    conditions.push(`e.estado = ?`);
    params.push(estado);
  }

  if (search) {
    conditions.push(
      `(e.nombres LIKE ? OR e.apellidos LIKE ? OR e.dni LIKE ? OR e.correo LIKE ? OR e.telefono LIKE ?)`
    );
    const like = `%${search}%`;
    params.push(like, like, like, like, like);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRow = await get(
    `SELECT COUNT(*) as c FROM empleados e ${where}`,
    params
  );
  const total = countRow.c;

  const rows = await all(
    `${SELECT_BASE} ${where} ORDER BY datetime(e.createdAt) DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return { data: rows, meta: paginationMeta(total, page, limit) };
}

export async function getEmpleadoById(id, authUser) {
  const row = await get(`${SELECT_BASE} WHERE e.id = ?`, [id]);
  if (!row) throw new HttpError(404, "Empleado no encontrado");
  if (authUser.rol === "EMPLEADO" && authUser.empleadoId !== id) {
    throw new HttpError(403, "No autorizado");
  }
  if (authUser.rol !== "EMPLEADO") {
    const ownerAdminId = authUser.rol === "ADMIN" ? authUser.id : authUser.ownerAdminId;
    if (!ownerAdminId) throw new HttpError(403, "Usuario sin admin propietario");
    if (row.ownerAdminId !== ownerAdminId) {
      throw new HttpError(403, "No autorizado");
    }
  }
  return row;
}

export async function createEmpleado(body, fotoPath, facialFotoPath, authUser) {
  const {
    nombres,
    apellidos,
    dni,
    correo,
    telefono,
    direccion,
    cargoId,
    areaId,
    salario,
    fechaIngreso,
    estado = "ACTIVO",
    crearUsuario,
  } = body;

  if (!nombres || !apellidos || !dni) {
    throw new HttpError(400, "Faltan campos obligatorios (nombres, apellidos, dni)");
  }

  const id = randomUUID();
  const now = new Date().toISOString();
  const ownerAdminId = authUser.rol === "ADMIN" ? authUser.id : authUser.ownerAdminId;
  if (!ownerAdminId) throw new HttpError(403, "Usuario sin admin propietario");

  const corr = (body.correo || `${dni.trim()}@empresa.demo`).trim();
  const tel = (body.telefono || "000000000").trim();
  const fIngreso = body.fechaIngreso || now.slice(0, 10);
  const sal = body.salario !== undefined ? Number(body.salario) : 0;
  if (Number.isNaN(sal) || sal < 0) throw new HttpError(400, "Salario inválido");

  // Parse faceDescriptor from JSON string (FormData serialization)
  let parsedDescriptor = body.faceDescriptor;
  if (typeof parsedDescriptor === "string") {
    try { parsedDescriptor = JSON.parse(parsedDescriptor); } catch { parsedDescriptor = null; }
  }

  const encryptedDescriptor = parsedDescriptor && Array.isArray(parsedDescriptor)
    ? encryptJson(parsedDescriptor)
    : null;

  try {
    await run(
      `INSERT INTO empleados (
        id, nombres, apellidos, dni, correo, telefono, direccion,
        cargoId, areaId, salario, fechaIngreso, estado, fotoPath, facialFotoPath, facialDescriptor, sedeId, ownerAdminId, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        nombres.trim(),
        apellidos.trim(),
        dni.trim(),
        corr,
        tel,
        direccion?.trim() || null,
        cargoId || null,
        areaId || null,
        sal,
        fIngreso,
        estado,
        fotoPath || null,
        facialFotoPath || null,
        encryptedDescriptor,
        body.sedeId || null,
        ownerAdminId || null,
        now,
        now,
      ]
    );

    if (crearUsuario === "true" || crearUsuario === true) {
      const username = dni.trim();
      const existingUser = await get(`SELECT id FROM usuarios WHERE username = ?`, [username]);
      if (!existingUser) {
        const userId = randomUUID();
        const hash = await bcrypt.hash(username, 10);
        await run(
          `INSERT INTO usuarios (id, username, email, password, rol, empleadoId, ownerAdminId, createdAt)
           VALUES (?, ?, NULL, ?, 'EMPLEADO', ?, ?, ?)`,
          [userId, username, hash, id, ownerAdminId, now]
        );
      }
    }
  } catch (e) {
    if (String(e.message).includes("UNIQUE")) {
      throw new HttpError(409, "DNI o datos únicos duplicados");
    }
    throw e;
  }
  return get(`${SELECT_BASE} WHERE e.id = ?`, [id]);
}

export async function updateEmpleado(id, body, fotoPath, facialFotoPath, authUser) {
  await getEmpleadoById(id, authUser);
  const row = await get(`SELECT * FROM empleados WHERE id = ?`, [id]);
  const now = new Date().toISOString();

  const merged = {
    nombres: body.nombres ?? row.nombres,
    apellidos: body.apellidos ?? row.apellidos,
    dni: body.dni ?? row.dni,
    correo: body.correo ?? row.correo,
    telefono: body.telefono ?? row.telefono,
    direccion: body.direccion !== undefined ? body.direccion : row.direccion,
    cargoId: body.cargoId !== undefined ? body.cargoId || null : row.cargoId,
    areaId: body.areaId !== undefined ? body.areaId || null : row.areaId,
    salario: body.salario !== undefined ? Number(body.salario) : row.salario,
    fechaIngreso: body.fechaIngreso ?? row.fechaIngreso,
    estado: body.estado ?? row.estado,
    fotoPath: fotoPath ?? row.fotoPath,
    facialFotoPath: facialFotoPath ?? row.facialFotoPath,
    facialDescriptor: (() => {
      let desc = body.faceDescriptor;
      if (typeof desc === "string") {
        try { desc = JSON.parse(desc); } catch { desc = null; }
      }
      return desc && Array.isArray(desc)
        ? encryptJson(desc)
        : row.facialDescriptor;
    })(),
    sedeId: body.sedeId !== undefined ? body.sedeId || null : row.sedeId,
  };

  if (Number.isNaN(merged.salario) || merged.salario < 0) {
    throw new HttpError(400, "Salario inválido");
  }

  try {
    await run(
      `UPDATE empleados SET
        nombres = ?, apellidos = ?, dni = ?, correo = ?, telefono = ?, direccion = ?,
        cargoId = ?, areaId = ?, salario = ?, fechaIngreso = ?, estado = ?, fotoPath = ?, facialFotoPath = ?, facialDescriptor = ?, sedeId = ?, updatedAt = ?
      WHERE id = ?`,
      [
        merged.nombres,
        merged.apellidos,
        merged.dni,
        merged.correo,
        merged.telefono,
        merged.direccion,
        merged.cargoId,
        merged.areaId,
        merged.salario,
        merged.fechaIngreso,
        merged.estado,
        merged.fotoPath,
        merged.facialFotoPath,
        merged.facialDescriptor,
        merged.sedeId,
        now,
        id,
      ]
    );
  } catch (e) {
    if (String(e.message).includes("UNIQUE")) {
      throw new HttpError(409, "DNI duplicado");
    }
    throw e;
  }
  return get(`${SELECT_BASE} WHERE e.id = ?`, [id]);
}

export async function deleteEmpleado(id, authUser) {
  await getEmpleadoById(id, authUser);
  await run(`DELETE FROM empleados WHERE id = ?`, [id]);
  return { ok: true };
}

/** Registra descriptor biométrico facial (128D) encriptado — sin almacenar imágenes. */
export async function registerFacialDescriptor(id, faceDescriptor, authUser) {
  await getEmpleadoById(id, authUser);
  if (!faceDescriptor || !Array.isArray(faceDescriptor) || faceDescriptor.length < 64) {
    throw new HttpError(400, "Descriptor facial inválido");
  }
  const encrypted = encryptJson(faceDescriptor);
  const now = new Date().toISOString();
  await run(
    `UPDATE empleados SET facialDescriptor = ?, updatedAt = ? WHERE id = ?`,
    [encrypted, now, id]
  );
  return { ok: true, hasFacialDescriptor: true };
}
