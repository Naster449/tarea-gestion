import { randomUUID } from "crypto";
import PDFDocument from "pdfkit";
import { all, get, run } from "../db/index.js";
import { HttpError } from "../utils/httpError.js";

export function calcularNeto({
  salarioBase,
  horasExtras = 0,
  tarifaHoraExtra = 0,
  bonos = 0,
  descuentos = 0,
  afp = 0,
  impuestos = 0,
}) {
  const base = Number(salarioBase);
  const he = Number(horasExtras) || 0;
  const th = Number(tarifaHoraExtra) || 0;
  const b = Number(bonos) || 0;
  const d = Number(descuentos) || 0;
  const a = Number(afp) || 0;
  const i = Number(impuestos) || 0;
  if (Number.isNaN(base) || base < 0) throw new HttpError(400, "Salario base inválido");
  const bruto = base + b + he * th;
  const neto = Math.round((bruto - d - a - i) * 100) / 100;
  if (neto < 0) throw new HttpError(400, "El neto no puede ser negativo; revisa descuentos e impuestos");
  return { bruto: Math.round(bruto * 100) / 100, neto };
}

export async function crearPlanilla(body) {
  const {
    empleadoId,
    periodo,
    salarioBase,
    horasExtras = 0,
    tarifaHoraExtra = 0,
    bonos = 0,
    descuentos = 0,
    afp = 0,
    impuestos = 0,
  } = body;

  if (!empleadoId || !periodo) throw new HttpError(400, "empleadoId y periodo (YYYY-MM) son obligatorios");
  const emp = await get(`SELECT id FROM empleados WHERE id = ?`, [empleadoId]);
  if (!emp) throw new HttpError(404, "Empleado no encontrado");

  const { neto } = calcularNeto({
    salarioBase,
    horasExtras,
    tarifaHoraExtra,
    bonos,
    descuentos,
    afp,
    impuestos,
  });

  const id = randomUUID();
  const createdAt = new Date().toISOString();

  try {
    await run(
      `INSERT INTO planillas (
        id, empleadoId, periodo, salarioBase, horasExtras, tarifaHoraExtra,
        bonos, descuentos, afp, impuestos, neto, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        empleadoId,
        periodo,
        Number(salarioBase),
        Number(horasExtras) || 0,
        Number(tarifaHoraExtra) || 0,
        Number(bonos) || 0,
        Number(descuentos) || 0,
        Number(afp) || 0,
        Number(impuestos) || 0,
        neto,
        createdAt,
      ]
    );
  } catch (e) {
    if (String(e.message).includes("UNIQUE")) {
      throw new HttpError(409, "Ya existe planilla para este empleado y periodo");
    }
    throw e;
  }

  const admins = await all(`SELECT id, email FROM usuarios WHERE rol IN ('ADMIN','RRHH')`);
  const { crearNotificacion } = await import("./notificacion.service.js");
  for (const u of admins) {
    await crearNotificacion({
      userId: u.id,
      tipo: "PLANILLA",
      titulo: "Nueva planilla generada",
      mensaje: `Se registró planilla ${periodo} para empleado ${empleadoId}. Neto: ${neto}`,
      enviarCorreo: false,
    });
  }

  return getPlanillaById(id);
}

export async function listPlanillas(query, authUser) {
  const empleadoId = query.empleadoId ? String(query.empleadoId) : "";
  const periodo = query.periodo ? String(query.periodo) : "";

  const conditions = [];
  const params = [];

  if (authUser.rol === "EMPLEADO") {
    if (!authUser.empleadoId) return [];
    conditions.push(`p.empleadoId = ?`);
    params.push(authUser.empleadoId);
  } else if (empleadoId) {
    conditions.push(`p.empleadoId = ?`);
    params.push(empleadoId);
  }

  if (periodo) {
    conditions.push(`p.periodo = ?`);
    params.push(periodo);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  return all(
    `SELECT p.*, e.nombres, e.apellidos, e.dni, e.correo
     FROM planillas p
     JOIN empleados e ON e.id = p.empleadoId
     ${where}
     ORDER BY p.periodo DESC, datetime(p.createdAt) DESC
     LIMIT 500`,
    params
  );
}

export async function getPlanillaById(id) {
  const row = await get(
    `SELECT p.*, e.nombres, e.apellidos, e.dni, e.correo, e.cargoId
     FROM planillas p
     JOIN empleados e ON e.id = p.empleadoId
     WHERE p.id = ?`,
    [id]
  );
  if (!row) throw new HttpError(404, "Planilla no encontrada");
  return row;
}

export async function assertPlanillaAccess(id, authUser) {
  const row = await getPlanillaById(id);
  if (authUser.rol === "EMPLEADO" && authUser.empleadoId !== row.empleadoId) {
    throw new HttpError(403, "No autorizado");
  }
  return row;
}

export async function buildBoletaPdfBuffer(planillaRow) {
  const doc = new PDFDocument({ margin: 50 });
  const chunks = [];
  doc.on("data", (c) => chunks.push(c));
  const done = new Promise((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  doc.fontSize(18).text("Boleta de pago", { underline: true });
  doc.moveDown();
  doc.fontSize(11);
  doc.text(`Empleado: ${planillaRow.nombres} ${planillaRow.apellidos}`);
  doc.text(`DNI: ${planillaRow.dni}`);
  doc.text(`Periodo: ${planillaRow.periodo}`);
  doc.moveDown();
  doc.text(`Salario base: S/ ${Number(planillaRow.salarioBase).toFixed(2)}`);
  doc.text(`Horas extras: ${planillaRow.horasExtras} x S/ ${Number(planillaRow.tarifaHoraExtra).toFixed(2)}`);
  doc.text(`Bonos: S/ ${Number(planillaRow.bonos).toFixed(2)}`);
  doc.text(`Descuentos: S/ ${Number(planillaRow.descuentos).toFixed(2)}`);
  doc.text(`AFP: S/ ${Number(planillaRow.afp).toFixed(2)}`);
  doc.text(`Impuestos: S/ ${Number(planillaRow.impuestos).toFixed(2)}`);
  doc.moveDown();
  doc.fontSize(13).text(`Neto a pagar: S/ ${Number(planillaRow.neto).toFixed(2)}`, {
    underline: true,
  });
  doc.end();

  return done;
}
