import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { all } from "../db/index.js";
import { HttpError } from "../utils/httpError.js";

export async function jsonEmpleadosActivos() {
  return empleadosActivosRows();
}

async function empleadosActivosRows() {
  return all(
    `SELECT e.*, a.nombre AS areaNombre, c.nombre AS cargoNombre
     FROM empleados e
     LEFT JOIN areas a ON a.id = e.areaId
     LEFT JOIN cargos c ON c.id = e.cargoId
     WHERE e.estado = 'ACTIVO'
     ORDER BY e.apellidos, e.nombres`
  );
}

export async function excelEmpleadosActivos() {
  const rows = await empleadosActivosRows();
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Empleados activos");
  ws.columns = [
    { header: "Nombres", key: "nombres", width: 20 },
    { header: "Apellidos", key: "apellidos", width: 20 },
    { header: "DNI", key: "dni", width: 12 },
    { header: "Correo", key: "correo", width: 28 },
    { header: "Área", key: "areaNombre", width: 18 },
    { header: "Cargo", key: "cargoNombre", width: 18 },
    { header: "Salario", key: "salario", width: 12 },
  ];
  rows.forEach((r) => ws.addRow({ ...r, salario: Number(r.salario) }));
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export async function pdfEmpleadosActivos() {
  const rows = await empleadosActivosRows();
  const doc = new PDFDocument({ margin: 40, size: "A4" });
  const chunks = [];
  doc.on("data", (c) => chunks.push(c));
  const done = new Promise((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  doc.fontSize(16).text("Reporte — Empleados activos", { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(9);
  rows.slice(0, 40).forEach((r, idx) => {
    doc.text(
      `${idx + 1}. ${r.nombres} ${r.apellidos} | ${r.dni} | ${r.areaNombre || "-"} | S/ ${Number(r.salario).toFixed(2)}`
    );
  });
  if (rows.length > 40) doc.text(`… y ${rows.length - 40} más`);
  doc.end();
  return done;
}

export async function excelAsistenciaMensual(periodo) {
  const [y, m] = periodo.split("-").map((x) => parseInt(x, 10));
  if (!y || !m) throw new HttpError(400, "periodo inválido YYYY-MM");
  const desde = `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-01`;
  const rows = await all(
    `SELECT a.*, e.nombres, e.apellidos, e.dni
     FROM asistencias a
     JOIN empleados e ON e.id = a.empleadoId
     WHERE a.fecha >= ? AND a.fecha < date(?, '+1 month')
     ORDER BY a.fecha, e.apellidos`,
    [desde, desde]
  );
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(`Asistencia ${periodo}`);
  ws.columns = [
    { header: "Fecha", key: "fecha", width: 12 },
    { header: "Empleado", key: "emp", width: 30 },
    { header: "DNI", key: "dni", width: 12 },
    { header: "Estado", key: "estado", width: 12 },
    { header: "Tardanza min", key: "minutosTardanza", width: 12 },
    { header: "Entrada", key: "entradaAt", width: 20 },
    { header: "Salida", key: "salidaAt", width: 20 },
    { header: "Valid. Facial", key: "validacionFacialEntrada", width: 14 },
    { header: "Valid. GPS", key: "validacionUbicacionEntrada", width: 14 },
    { header: "Latitud", key: "entradaLat", width: 12 },
    { header: "Longitud", key: "entradaLng", width: 12 },
  ];
  rows.forEach((r) =>
    ws.addRow({
      fecha: r.fecha,
      emp: `${r.nombres} ${r.apellidos}`,
      dni: r.dni,
      estado: r.estado,
      minutosTardanza: r.minutosTardanza,
      entradaAt: r.entradaAt || "",
      salidaAt: r.salidaAt || "",
      validacionFacialEntrada: r.validacionFacialEntrada || "",
      validacionUbicacionEntrada: r.validacionUbicacionEntrada || "",
      entradaLat: r.entradaLat ?? "",
      entradaLng: r.entradaLng ?? "",
    })
  );
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export async function excelPlanillas(periodo) {
  const conditions = [];
  const params = [];
  if (periodo) {
    conditions.push(`p.periodo = ?`);
    params.push(periodo);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = await all(
    `SELECT p.*, e.nombres, e.apellidos, e.dni
     FROM planillas p
     JOIN empleados e ON e.id = p.empleadoId
     ${where}
     ORDER BY p.periodo DESC`,
    params
  );
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Planillas");
  ws.columns = [
    { header: "Periodo", key: "periodo", width: 10 },
    { header: "Empleado", key: "emp", width: 28 },
    { header: "Neto", key: "neto", width: 12 },
    { header: "Base", key: "salarioBase", width: 12 },
    { header: "AFP", key: "afp", width: 10 },
    { header: "Impuestos", key: "impuestos", width: 12 },
  ];
  rows.forEach((r) =>
    ws.addRow({
      periodo: r.periodo,
      emp: `${r.nombres} ${r.apellidos}`,
      neto: Number(r.neto),
      salarioBase: Number(r.salarioBase),
      afp: Number(r.afp),
      impuestos: Number(r.impuestos),
    })
  );
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export async function excelSalarios() {
  const rows = await all(
    `SELECT e.nombres, e.apellidos, e.dni, e.salario, a.nombre AS area
     FROM empleados e
     LEFT JOIN areas a ON a.id = e.areaId
     WHERE e.estado = 'ACTIVO'
     ORDER BY e.salario DESC`
  );
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Salarios");
  ws.columns = [
    { header: "Nombres", key: "nombres", width: 18 },
    { header: "Apellidos", key: "apellidos", width: 18 },
    { header: "DNI", key: "dni", width: 12 },
    { header: "Área", key: "area", width: 18 },
    { header: "Salario", key: "salario", width: 12 },
  ];
  rows.forEach((r) => ws.addRow({ ...r, salario: Number(r.salario) }));
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
