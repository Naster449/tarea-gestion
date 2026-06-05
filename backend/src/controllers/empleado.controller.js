import path from "path";
import * as empleadoService from "../services/empleado.service.js";

function fotoUrl(fotoPath) {
  if (!fotoPath) return null;
  const base = path.basename(fotoPath);
  return `/uploads/empleados/${base}`;
}

export async function list(req, res) {
  const { data, meta } = await empleadoService.listEmpleados(req.query, req.user);
  const shaped = data.map((e) => ({
    ...e,
    fotoUrl: fotoUrl(e.fotoPath),
    facialFotoUrl: fotoUrl(e.facialFotoPath),
    hasFacialDescriptor: Boolean(e.facialDescriptor),
    facialDescriptor: undefined,
  }));
  res.json({ data: shaped, meta });
}

export async function getOne(req, res) {
  const row = await empleadoService.getEmpleadoById(req.params.id, req.user);
  res.json({
    ...row,
    fotoUrl: fotoUrl(row.fotoPath),
    facialFotoUrl: fotoUrl(row.facialFotoPath),
    hasFacialDescriptor: Boolean(row.facialDescriptor),
    facialDescriptor: undefined,
  });
}

export async function create(req, res) {
  const fotoPath = req.files && req.files.foto ? req.files.foto[0].path : null;
  const facialFotoPath = req.files && req.files.facialFoto ? req.files.facialFoto[0].path : null;
  const row = await empleadoService.createEmpleado(req.body, fotoPath, facialFotoPath, req.user);
  res.status(201).json({
    ...row,
    fotoUrl: fotoUrl(row.fotoPath),
    facialFotoUrl: fotoUrl(row.facialFotoPath),
  });
}

export async function update(req, res) {
  const fotoPath = req.files && req.files.foto ? req.files.foto[0].path : undefined;
  const facialFotoPath = req.files && req.files.facialFoto ? req.files.facialFoto[0].path : undefined;
  const row = await empleadoService.updateEmpleado(req.params.id, req.body, fotoPath, facialFotoPath, req.user);
  res.json({
    ...row,
    fotoUrl: fotoUrl(row.fotoPath),
    facialFotoUrl: fotoUrl(row.facialFotoPath),
  });
}

export async function remove(req, res) {
  await empleadoService.deleteEmpleado(req.params.id, req.user);
  res.status(204).send();
}

export async function registerFacial(req, res) {
  const result = await empleadoService.registerFacialDescriptor(
    req.params.id,
    req.body.faceDescriptor,
    req.user
  );
  res.json(result);
}
