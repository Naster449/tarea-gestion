import { get, all } from "../db/index.js";
import { HttpError } from "../utils/httpError.js";
import { decryptJson } from "../utils/crypto.js";
import { compareDescriptors } from "../utils/facial.js";
import { isWithinRadius } from "../utils/geo.js";
import * as asistenciaService from "../services/asistencia.service.js";
import * as sedeService from "../services/sede.service.js";
import * as auditoriaService from "../services/auditoria.service.js";

async function resolveOwnerAdminId(user) {
  if (user.rol === "ADMIN") return user.id;
  if (user.ownerAdminId) return user.ownerAdminId;
  throw new HttpError(403, "Usuario sin admin propietario");
}

async function verificarFacial(user, faceDescriptor) {
  if (user.rol !== "EMPLEADO" && user.rol !== "RRHH") {
    return { ok: true, estado: "N/A" };
  }

  const empleadoId = user.empleadoId;
  if (!empleadoId) {
    throw new HttpError(400, "Tu usuario no está vinculado a un empleado.");
  }

  const emp = await get(
    "SELECT facialDescriptor, facialFotoPath FROM empleados WHERE id = ?",
    [empleadoId]
  );

  if (!emp?.facialDescriptor) {
    throw new HttpError(
      400,
      "No tienes un perfil biométrico registrado. Solicita a RRHH que registre tus puntos faciales."
    );
  }

  if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
    throw new HttpError(400, "Se requieren los puntos biométricos faciales para verificar identidad.");
  }

  const stored = decryptJson(emp.facialDescriptor);
  const { match, distance } = compareDescriptors(stored, faceDescriptor);

  if (!match) {
    await auditoriaService.registrarAuditoria({
      userId: user.id,
      empleadoId,
      accion: "FACIAL_RECHAZADO",
      detalles: `Distancia euclidiana: ${distance}`,
      validacionFacial: "FALLO",
    });
    throw new HttpError(400, "Reconocimiento facial fallido. Tu rostro no coincide con el perfil registrado.");
  }

  return { ok: true, estado: "OK", distance };
}

async function verificarUbicacion(user, empleadoId, latitud, longitud) {
  if (user.rol !== "EMPLEADO" && user.rol !== "RRHH") {
    return { ok: true, estado: "N/A", sedeId: null };
  }

  if (latitud == null || longitud == null) {
    throw new HttpError(400, "Se requiere permiso de ubicación GPS para marcar asistencia.");
  }

  const ownerAdminId = await resolveOwnerAdminId(user);
  const sede = await sedeService.resolveSedeForEmpleado(empleadoId, ownerAdminId);

  if (!sede) {
    throw new HttpError(
      400,
      "No hay sede autorizada configurada. Contacta a RRHH para configurar el centro de trabajo."
    );
  }

  const { valid, distanciaMetros } = isWithinRadius(
    Number(latitud),
    Number(longitud),
    sede.latitud,
    sede.longitud,
    sede.radioMetros
  );

  if (!valid) {
    await auditoriaService.registrarAuditoria({
      userId: user.id,
      empleadoId,
      accion: "UBICACION_RECHAZADA",
      detalles: `Distancia: ${distanciaMetros}m (máx ${sede.radioMetros}m) — Sede: ${sede.nombre}`,
      latitud: Number(latitud),
      longitud: Number(longitud),
      validacionUbicacion: "FALLO",
    });
    throw new HttpError(
      403,
      `No te encuentras en una ubicación válida. Estás a ${distanciaMetros}m de "${sede.nombre}" (máximo permitido: ${sede.radioMetros}m).`
    );
  }

  return { ok: true, estado: "OK", sedeId: sede.id, distanciaMetros, sedeNombre: sede.nombre };
}

export async function identificarEmpleadoPorRostro(faceDescriptor) {
  if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
    throw new HttpError(400, "Se requieren los puntos biométricos faciales para verificar identidad.");
  }

  const empleados = await all("SELECT id, nombres, apellidos, facialDescriptor, ownerAdminId FROM empleados WHERE facialDescriptor IS NOT NULL");
  
  let bestMatch = null;
  let bestDistance = 1.0;

  for (const emp of empleados) {
    const stored = decryptJson(emp.facialDescriptor);
    if (!stored || !Array.isArray(stored)) continue;
    
    const { match, distance } = compareDescriptors(stored, faceDescriptor);
    if (match && distance < bestDistance) {
      bestDistance = distance;
      bestMatch = emp;
    }
  }

  if (!bestMatch) {
    throw new HttpError(400, "Reconocimiento facial fallido. Tu rostro no está registrado en el sistema.");
  }

  return { ok: true, estado: "OK", distance: bestDistance, empleado: bestMatch };
}

export async function entradaAutomatica(req, res) {
  const facial = await identificarEmpleadoPorRostro(req.body.faceDescriptor);
  const empId = facial.empleado.id;
  const ownerAdminId = facial.empleado.ownerAdminId;

  const fakeUser = { rol: "EMPLEADO", empleadoId: empId, id: empId, ownerAdminId };
  
  const ubicacion = await verificarUbicacion(
    fakeUser,
    empId,
    req.body.latitud,
    req.body.longitud
  );

  const row = await asistenciaService.registrarEntrada(fakeUser, {
    ...req.body,
    empleadoId: empId,
    validacionFacial: facial.estado,
    validacionUbicacion: ubicacion.estado,
    sedeId: ubicacion.sedeId,
  });

  await auditoriaService.registrarAuditoria({
    userId: empId,
    empleadoId: empId,
    accion: "ENTRADA_AUTOMATICA",
    detalles: ubicacion.sedeNombre ? `Sede: ${ubicacion.sedeNombre}` : null,
    latitud: req.body.latitud,
    longitud: req.body.longitud,
    validacionFacial: facial.estado,
    validacionUbicacion: ubicacion.estado,
  });

  res.status(201).json({ ...row, nombres: facial.empleado.nombres, apellidos: facial.empleado.apellidos });
}

export async function salidaAutomatica(req, res) {
  const facial = await identificarEmpleadoPorRostro(req.body.faceDescriptor);
  const empId = facial.empleado.id;
  const ownerAdminId = facial.empleado.ownerAdminId;

  const fakeUser = { rol: "EMPLEADO", empleadoId: empId, id: empId, ownerAdminId };
  
  const ubicacion = await verificarUbicacion(
    fakeUser,
    empId,
    req.body.latitud,
    req.body.longitud
  );

  const row = await asistenciaService.registrarSalida(fakeUser, {
    ...req.body,
    empleadoId: empId,
    validacionFacial: facial.estado,
    validacionUbicacion: ubicacion.estado,
    sedeId: ubicacion.sedeId,
  });

  await auditoriaService.registrarAuditoria({
    userId: empId,
    empleadoId: empId,
    accion: "SALIDA_AUTOMATICA",
    detalles: ubicacion.sedeNombre ? `Sede: ${ubicacion.sedeNombre}` : null,
    latitud: req.body.latitud,
    longitud: req.body.longitud,
    validacionFacial: facial.estado,
    validacionUbicacion: ubicacion.estado,
  });

  res.json({ ...row, nombres: facial.empleado.nombres, apellidos: facial.empleado.apellidos });
}

export async function entrada(req, res) {
  const empleadoId =
    req.user.rol === "EMPLEADO" || req.user.rol === "RRHH"
      ? req.user.empleadoId
      : req.body.empleadoId;

  const facial = await verificarFacial(req.user, req.body.faceDescriptor);
  const ubicacion = await verificarUbicacion(
    req.user,
    empleadoId,
    req.body.latitud,
    req.body.longitud
  );

  const row = await asistenciaService.registrarEntrada(req.user, {
    ...req.body,
    validacionFacial: facial.estado,
    validacionUbicacion: ubicacion.estado,
    sedeId: ubicacion.sedeId,
  });

  if (req.user.rol === "EMPLEADO" || req.user.rol === "RRHH") {
    await auditoriaService.registrarAuditoria({
      userId: req.user.id,
      empleadoId: req.user.empleadoId,
      accion: "ENTRADA",
      detalles: ubicacion.sedeNombre ? `Sede: ${ubicacion.sedeNombre}` : null,
      latitud: req.body.latitud,
      longitud: req.body.longitud,
      validacionFacial: facial.estado,
      validacionUbicacion: ubicacion.estado,
    });
  }

  res.status(201).json(row);
}

export async function salida(req, res) {
  const empleadoId =
    req.user.rol === "EMPLEADO" || req.user.rol === "RRHH"
      ? req.user.empleadoId
      : req.body.empleadoId;

  const facial = await verificarFacial(req.user, req.body.faceDescriptor);
  const ubicacion = await verificarUbicacion(
    req.user,
    empleadoId,
    req.body.latitud,
    req.body.longitud
  );

  const row = await asistenciaService.registrarSalida(req.user, {
    ...req.body,
    validacionFacial: facial.estado,
    validacionUbicacion: ubicacion.estado,
    sedeId: ubicacion.sedeId,
  });

  if (req.user.rol === "EMPLEADO" || req.user.rol === "RRHH") {
    await auditoriaService.registrarAuditoria({
      userId: req.user.id,
      empleadoId: req.user.empleadoId,
      accion: "SALIDA",
      detalles: ubicacion.sedeNombre ? `Sede: ${ubicacion.sedeNombre}` : null,
      latitud: req.body.latitud,
      longitud: req.body.longitud,
      validacionFacial: facial.estado,
      validacionUbicacion: ubicacion.estado,
    });
  }

  res.json(row);
}

export async function ausencia(req, res) {
  const row = await asistenciaService.marcarAusencia(req.user, req.body);
  res.status(201).json(row);
}

export async function list(req, res) {
  const rows = await asistenciaService.listAsistencias(req.query, req.user);
  res.json(rows);
}

export async function resumen(req, res) {
  const data = await asistenciaService.dashboardAsistenciaResumen(req.user);
  res.json(data);
}

export async function miSede(req, res) {
  if (!req.user.empleadoId) {
    return res.json({ sede: null });
  }
  const ownerAdminId = await resolveOwnerAdminId(req.user);
  const sede = await sedeService.resolveSedeForEmpleado(req.user.empleadoId, ownerAdminId);
  res.json({ sede });
}
