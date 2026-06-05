import * as sedeService from "../services/sede.service.js";

export async function list(req, res) {
  const rows = await sedeService.listSedes(req.user);
  res.json(rows);
}

export async function getOne(req, res) {
  const row = await sedeService.getSedeById(req.params.id, req.user);
  res.json(row);
}

export async function create(req, res) {
  const row = await sedeService.createSede(req.body, req.user);
  res.status(201).json(row);
}

export async function update(req, res) {
  const row = await sedeService.updateSede(req.params.id, req.body, req.user);
  res.json(row);
}

export async function remove(req, res) {
  await sedeService.deleteSede(req.params.id, req.user);
  res.status(204).send();
}
