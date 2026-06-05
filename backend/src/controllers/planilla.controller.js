import * as planillaService from "../services/planilla.service.js";

export async function list(req, res) {
  const rows = await planillaService.listPlanillas(req.query, req.user);
  res.json(rows);
}

export async function create(req, res) {
  const row = await planillaService.crearPlanilla(req.body);
  res.status(201).json(row);
}

export async function boletaPdf(req, res) {
  const row = await planillaService.assertPlanillaAccess(req.params.id, req.user);
  const buf = await planillaService.buildBoletaPdfBuffer(row);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="boleta-${row.periodo}-${row.dni}.pdf"`);
  res.send(buf);
}
