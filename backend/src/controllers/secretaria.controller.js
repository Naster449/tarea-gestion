import * as authService from "../services/auth.service.js";

export async function listPlanillaUsers(_req, res) {
  const rows = await authService.listPlanillaUsers(_req.user);
  res.json(rows);
}

export async function createPlanillaUser(req, res) {
  const row = await authService.createPlanillaUserBySecretaria({ actorUser: req.user, ...req.body });
  res.status(201).json(row);
}

export async function updatePlanillaUser(req, res) {
  const row = await authService.updatePlanillaUserBySecretaria(req.user, req.params.id, req.body);
  res.json(row);
}

export async function deletePlanillaUser(req, res) {
  await authService.deletePlanillaUserBySecretaria(req.user, req.params.id);
  res.status(204).send();
}

