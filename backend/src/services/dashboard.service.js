import { all, get } from "../db/index.js";
import * as asistenciaService from "./asistencia.service.js";
import { HttpError } from "../utils/httpError.js";

export async function getDashboardKpis(authUser) {
  const ownerAdminId = authUser.rol === "ADMIN" ? authUser.id : authUser.ownerAdminId;
  if (!ownerAdminId) {
    throw new HttpError(403, "Usuario sin admin propietario");
  }
  const totalEmpleados = await get(`SELECT COUNT(*) as c FROM empleados WHERE ownerAdminId = ?`, [ownerAdminId]);
  const activos = await get(`SELECT COUNT(*) as c FROM empleados WHERE estado = 'ACTIVO' AND ownerAdminId = ?`, [ownerAdminId]);
  const inactivos = await get(
    `SELECT COUNT(*) as c FROM empleados WHERE estado != 'ACTIVO' AND ownerAdminId = ?`,
    [ownerAdminId]
  );
  const planillas = await get(
    `SELECT COUNT(*) as c
     FROM planillas p
     JOIN empleados e ON e.id = p.empleadoId
     WHERE e.ownerAdminId = ?`,
    [ownerAdminId]
  );

  const today = new Date().toISOString().slice(0, 10);
  const asistenciaHoy = await asistenciaService.dashboardAsistenciaResumen(authUser);

  const ultimosEmpleados = await all(
    `SELECT id, nombres, apellidos, cargoId, areaId, estado, createdAt
     FROM empleados
     WHERE ownerAdminId = ?
     ORDER BY datetime(createdAt) DESC
     LIMIT 8`,
    [ownerAdminId]
  );

  const ultimasAsistencias = await all(
    `SELECT a.*, e.nombres, e.apellidos
     FROM asistencias a
     JOIN empleados e ON e.id = a.empleadoId
     WHERE e.ownerAdminId = ?
     ORDER BY datetime(a.createdAt) DESC
     LIMIT 8`,
    [ownerAdminId]
  );

  const ultimasPlanillas = await all(
    `SELECT p.*, e.nombres, e.apellidos
     FROM planillas p
     JOIN empleados e ON e.id = p.empleadoId
     WHERE e.ownerAdminId = ?
     ORDER BY datetime(p.createdAt) DESC
     LIMIT 8`,
    [ownerAdminId]
  );

  const salarioPorArea = await all(
    `SELECT a.nombre as area, SUM(e.salario) as total, COUNT(e.id) as empleados
     FROM empleados e
     LEFT JOIN areas a ON a.id = e.areaId
     WHERE e.estado = 'ACTIVO' AND e.ownerAdminId = ?
     GROUP BY a.nombre
     ORDER BY total DESC`,
    [ownerAdminId]
  );

  const asistenciaSemana = await asistenciaService.serieAsistenciaSemana(authUser);

  return {
    empleados: {
      total: totalEmpleados.c,
      activos: activos.c,
      inactivosOArea: inactivos.c,
    },
    planillas: { total: planillas.c },
    asistencia: asistenciaHoy,
    ausentesReportados: asistenciaHoy.ausentesHoy,
    ultimosEmpleados,
    ultimosRegistros: {
      asistencias: ultimasAsistencias,
      planillas: ultimasPlanillas,
    },
    charts: {
      salarioPorArea,
      asistenciaSemana,
    },
    serverDate: today,
  };
}
