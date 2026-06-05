import { randomUUID } from "crypto";
import { all, get, run } from "../db/index.js";
import { computeTardanzaMinutes, todayLocalISODate } from "../utils/attendance.js";
import { HttpError } from "../utils/httpError.js";
import * as notificacionService from "./notificacion.service.js";

async function resolveEmpleadoId(authUser, bodyEmpleadoId) {
  if (authUser.rol === "EMPLEADO") {
    if (!authUser.empleadoId) {
      throw new HttpError(400, "Tu usuario no está vinculado a un empleado");
    }
    return authUser.empleadoId;
  }
  if (!bodyEmpleadoId) throw new HttpError(400, "empleadoId requerido");
  if (authUser.rol === "ADMIN") {
    const ownerAdminId = authUser.rol === "ADMIN" ? authUser.id : authUser.ownerAdminId;
    if (!ownerAdminId) throw new HttpError(403, "Usuario sin admin propietario");
    const emp = await get(`SELECT id FROM empleados WHERE id = ? AND ownerAdminId = ?`, [bodyEmpleadoId, ownerAdminId]);
    if (!emp) throw new HttpError(404, "Empleado no encontrado");
  }
  return bodyEmpleadoId;
}

export async function registrarEntrada(authUser, { empleadoId: bodyEmp, fecha, latitud, longitud, validacionFacial, validacionUbicacion, sedeId } = {}) {
  const empleadoId = await resolveEmpleadoId(authUser, bodyEmp);
  const day = fecha || todayLocalISODate();
  const now = new Date().toISOString();
  const tardanza = computeTardanzaMinutes(new Date());

  const existing = await get(
    `SELECT * FROM asistencias WHERE empleadoId = ? AND fecha = ?`,
    [empleadoId, day]
  );
  if (existing?.entradaAt) {
    throw new HttpError(409, "Ya existe entrada registrada para esta fecha");
  }

  const estado = tardanza > 0 ? "TARDANZA" : "PUNTUAL";
  const id = randomUUID();

  if (existing) {
    await run(
      `UPDATE asistencias SET
         entradaAt = ?, minutosTardanza = ?, estado = ?,
         entradaLat = ?, entradaLng = ?,
         validacionFacialEntrada = ?, validacionUbicacionEntrada = ?, sedeId = ?
       WHERE id = ?`,
      [
        now, tardanza, estado,
        latitud ?? null, longitud ?? null,
        validacionFacial || "N/A", validacionUbicacion || "N/A", sedeId || null,
        existing.id,
      ]
    );
  } else {
    await run(
      `INSERT INTO asistencias (
         id, empleadoId, fecha, entradaAt, salidaAt, minutosTardanza, estado, notas,
         entradaLat, entradaLng, validacionFacialEntrada, validacionUbicacionEntrada, sedeId, createdAt
       ) VALUES (?, ?, ?, ?, NULL, ?, ?, NULL, ?, ?, ?, ?, ?, ?)`,
      [
        id, empleadoId, day, now, tardanza, estado,
        latitud ?? null, longitud ?? null,
        validacionFacial || "N/A", validacionUbicacion || "N/A", sedeId || null,
        now,
      ]
    );
  }

  if (tardanza > 0) {
    const emp = await get(`SELECT nombres, apellidos, correo FROM empleados WHERE id = ?`, [empleadoId]);
    const nombre = `${emp?.nombres || ""} ${emp?.apellidos || ""}`.trim();
    await notificacionService.alertaTardanzaRRHH({
      empleadoNombre: nombre,
      minutos: tardanza,
      correoEmpleado: emp?.correo,
    });
  }

  return get(`SELECT * FROM asistencias WHERE empleadoId = ? AND fecha = ?`, [empleadoId, day]);
}

export async function registrarSalida(authUser, { empleadoId: bodyEmp, fecha, latitud, longitud, validacionFacial, validacionUbicacion, sedeId } = {}) {
  const empleadoId = await resolveEmpleadoId(authUser, bodyEmp);
  const day = fecha || todayLocalISODate();
  const now = new Date().toISOString();

  const row = await get(
    `SELECT * FROM asistencias WHERE empleadoId = ? AND fecha = ?`,
    [empleadoId, day]
  );
  if (!row) throw new HttpError(404, "No hay registro de asistencia para esta fecha");
  if (!row.entradaAt) throw new HttpError(400, "Debe registrar entrada primero");
  if (row.salidaAt) throw new HttpError(409, "Salida ya registrada");

  await run(
    `UPDATE asistencias SET
       salidaAt = ?, salidaLat = ?, salidaLng = ?,
       validacionFacialSalida = ?, validacionUbicacionSalida = ?,
       sedeId = COALESCE(?, sedeId)
     WHERE id = ?`,
    [
      now,
      latitud ?? null, longitud ?? null,
      validacionFacial || "N/A", validacionUbicacion || "N/A",
      sedeId || null,
      row.id,
    ]
  );
  return get(`SELECT * FROM asistencias WHERE id = ?`, [row.id]);
}

export async function marcarAusencia(authUser, { empleadoId: bodyEmp, fecha, notas }) {
  if (authUser.rol === "EMPLEADO") {
    throw new HttpError(403, "Solo Admin puede marcar ausencias");
  }
  const empleadoId = bodyEmp;
  if (!empleadoId || !fecha) throw new HttpError(400, "empleadoId y fecha requeridos");
  const ownerAdminId = authUser.rol === "ADMIN" ? authUser.id : authUser.ownerAdminId;
  if (!ownerAdminId) throw new HttpError(403, "Usuario sin admin propietario");
  const emp = await get(`SELECT id FROM empleados WHERE id = ? AND ownerAdminId = ?`, [empleadoId, ownerAdminId]);
  if (!emp) throw new HttpError(404, "Empleado no encontrado");
  const id = randomUUID();
  const now = new Date().toISOString();
  const existing = await get(
    `SELECT id FROM asistencias WHERE empleadoId = ? AND fecha = ?`,
    [empleadoId, fecha]
  );
  if (existing) {
    await run(
      `UPDATE asistencias SET estado = 'AUSENCIA', entradaAt = NULL, salidaAt = NULL, minutosTardanza = 0, notas = ? WHERE id = ?`,
      [notas || null, existing.id]
    );
    return get(`SELECT * FROM asistencias WHERE id = ?`, [existing.id]);
  }
  await run(
    `INSERT INTO asistencias (id, empleadoId, fecha, entradaAt, salidaAt, minutosTardanza, estado, notas, createdAt)
     VALUES (?, ?, ?, NULL, NULL, 0, 'AUSENCIA', ?, ?)`,
    [id, empleadoId, fecha, notas || null, now]
  );
  return get(`SELECT * FROM asistencias WHERE id = ?`, [id]);
}

export async function listAsistencias(query, authUser) {
  const empleadoIdFilter = query.empleadoId ? String(query.empleadoId) : "";
  const desde = query.desde ? String(query.desde) : "";
  const hasta = query.hasta ? String(query.hasta) : "";

  const conditions = [];
  const params = [];

  if (authUser.rol === "EMPLEADO") {
    if (!authUser.empleadoId) return [];
    conditions.push(`a.empleadoId = ?`);
    params.push(authUser.empleadoId);
  } else {
    const ownerAdminId = authUser.rol === "ADMIN" ? authUser.id : authUser.ownerAdminId;
    if (!ownerAdminId) throw new HttpError(403, "Usuario sin admin propietario");
    conditions.push(`e.ownerAdminId = ?`);
    params.push(ownerAdminId);
    if (empleadoIdFilter) {
      conditions.push(`a.empleadoId = ?`);
      params.push(empleadoIdFilter);
    }
  }

  if (desde) {
    conditions.push(`a.fecha >= ?`);
    params.push(desde);
  }
  if (hasta) {
    conditions.push(`a.fecha <= ?`);
    params.push(hasta);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  return all(
    `SELECT a.*, e.nombres, e.apellidos, e.dni, s.nombre AS sedeNombre
     FROM asistencias a
     JOIN empleados e ON e.id = a.empleadoId
     LEFT JOIN sedes s ON s.id = a.sedeId
     ${where}
     ORDER BY a.fecha DESC, datetime(a.createdAt) DESC
     LIMIT 500`,
    params
  );
}

export async function dashboardAsistenciaResumen(authUser) {
  const today = todayLocalISODate();
  const ownerAdminId = authUser?.rol === "ADMIN" ? authUser.id : authUser?.ownerAdminId;
  if (!ownerAdminId) throw new HttpError(403, "Usuario sin admin propietario");
  const totalActivos = await get(
    `SELECT COUNT(*) as c FROM empleados WHERE estado = 'ACTIVO' AND ownerAdminId = ?`,
    [ownerAdminId]
  );
  const presentesHoy = await get(
    `SELECT COUNT(*) as c
     FROM asistencias a
     JOIN empleados e ON e.id = a.empleadoId
     WHERE a.fecha = ? AND a.entradaAt IS NOT NULL AND a.estado != 'AUSENCIA' AND e.ownerAdminId = ?`,
    [today, ownerAdminId]
  );
  const ausentesHoy = Math.max(0, (totalActivos.c || 0) - (presentesHoy.c || 0));
  const tardios = await get(
    `SELECT COUNT(*) as c
     FROM asistencias a
     JOIN empleados e ON e.id = a.empleadoId
     WHERE a.fecha = ? AND a.minutosTardanza > 0 AND e.ownerAdminId = ?`,
    [today, ownerAdminId]
  );
  const puntuales = await get(
    `SELECT COUNT(*) as c
     FROM asistencias a
     JOIN empleados e ON e.id = a.empleadoId
     WHERE a.fecha = ? AND a.estado = 'PUNTUAL' AND e.ownerAdminId = ?`,
    [today, ownerAdminId]
  );

  const pct =
    totalActivos.c > 0 ? Math.round((presentesHoy.c / totalActivos.c) * 1000) / 10 : 0;

  return {
    fecha: today,
    empleadosActivos: totalActivos.c,
    presentesHoy: presentesHoy.c,
    ausentesHoy,
    puntualesHoy: puntuales.c,
    tardiosHoy: tardios.c,
    porcentajeAsistencia: pct,
  };
}

export async function serieAsistenciaSemana(authUser) {
  const ownerAdminId = authUser?.rol === "ADMIN" ? authUser.id : authUser?.ownerAdminId;
  if (!ownerAdminId) throw new HttpError(403, "Usuario sin admin propietario");
  const rows = await all(
    `SELECT a.fecha,
      SUM(CASE WHEN a.entradaAt IS NOT NULL AND a.estado != 'AUSENCIA' THEN 1 ELSE 0 END) as presentes,
      SUM(CASE WHEN a.minutosTardanza > 0 THEN 1 ELSE 0 END) as tardios
     FROM asistencias a
     JOIN empleados e ON e.id = a.empleadoId
     WHERE a.fecha >= date('now', '-6 day') AND e.ownerAdminId = ?
     GROUP BY a.fecha
     ORDER BY a.fecha`,
    [ownerAdminId]
  );
  return rows;
}
