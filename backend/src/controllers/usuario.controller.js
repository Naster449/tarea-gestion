import * as authService from "../services/auth.service.js";

export async function list(req, res) {
  const rows = await authService.listUsers(req.user);
  res.json(rows);
}

export async function create(req, res) {
  const row = await authService.createUserByAdmin(req.user, req.body);
  res.status(201).json(row);
}
