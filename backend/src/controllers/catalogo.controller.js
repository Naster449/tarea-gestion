import * as catalogoService from "../services/catalogo.service.js";

export async function areasList(_req, res) {
  res.json(await catalogoService.listAreas());
}

export async function areasCreate(req, res) {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: "nombre requerido" });
  const row = await catalogoService.createArea(nombre);
  res.status(201).json(row);
}

export async function cargosList(req, res) {
  res.json(await catalogoService.listCargos(req.query.areaId));
}

export async function cargosCreate(req, res) {
  const row = await catalogoService.createCargo(req.body);
  res.status(201).json(row);
}

export async function adminsList(req, res) {
  res.json(await catalogoService.listAdmins(req.user));
}
