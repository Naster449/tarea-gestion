import * as reporteService from "../services/reporte.service.js";

export async function empleadosActivos(req, res) {
  const format = (req.query.format || "json").toLowerCase();
  if (format === "xlsx") {
    const buf = await reporteService.excelEmpleadosActivos();
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=empleados-activos.xlsx");
    return res.send(buf);
  }
  if (format === "pdf") {
    const buf = await reporteService.pdfEmpleadosActivos();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=empleados-activos.pdf");
    return res.send(buf);
  }
  const data = await reporteService.jsonEmpleadosActivos();
  res.json(data);
}

export async function asistenciaMensual(req, res) {
  const periodo = req.query.periodo;
  if (!periodo) return res.status(400).json({ error: "periodo YYYY-MM requerido" });
  const format = (req.query.format || "json").toLowerCase();
  if (format === "xlsx") {
    const buf = await reporteService.excelAsistenciaMensual(periodo);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=asistencia-${periodo}.xlsx`);
    return res.send(buf);
  }
  return res.status(400).json({ error: "Use format=xlsx o consulte /api/asistencia" });
}

export async function planillas(req, res) {
  const format = (req.query.format || "json").toLowerCase();
  const periodo = req.query.periodo || "";
  if (format === "xlsx") {
    const buf = await reporteService.excelPlanillas(periodo);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=planillas.xlsx");
    return res.send(buf);
  }
  return res.status(400).json({ error: "Use format=xlsx o GET /api/planillas" });
}

export async function salarios(req, res) {
  const format = (req.query.format || "json").toLowerCase();
  if (format === "xlsx") {
    const buf = await reporteService.excelSalarios();
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=salarios.xlsx");
    return res.send(buf);
  }
  return res.status(400).json({ error: "Use format=xlsx" });
}

export async function areas(req, res) {
  const { all } = await import("../db/index.js");
  const rows = await all(
    `SELECT a.nombre, COUNT(e.id) as empleados, SUM(e.salario) as masaSalarial
     FROM areas a
     LEFT JOIN empleados e ON e.areaId = a.id AND e.estado = 'ACTIVO'
     GROUP BY a.id
     ORDER BY a.nombre`
  );
  res.json(rows);
}

