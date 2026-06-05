import * as authService from "../services/auth.service.js";

export async function login(req, res) {
  const data = await authService.login(req.body);
  res.json(data);
}

export async function register(req, res) {
  const data = await authService.register(req.body);
  res.status(201).json(data);
}

export async function me(req, res) {
  const user = await authService.getMe(req.user.id);
  res.json(user);
}
