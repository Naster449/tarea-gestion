import * as notificacionService from "../services/notificacion.service.js";

export async function list(req, res) {
  const soloNoLeidas = req.query.soloNoLeidas === "1";
  const rows = await notificacionService.listForUser(req.user.id, { soloNoLeidas });
  res.json(rows);
}

export async function leer(req, res) {
  await notificacionService.marcarLeida(req.params.id, req.user.id);
  res.json({ ok: true });
}
