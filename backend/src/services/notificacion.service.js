import { randomUUID } from "crypto";
import { all, get, run } from "../db/index.js";
import { todayLocalISODate } from "../utils/attendance.js";
import { HttpError } from "../utils/httpError.js";
import * as emailService from "./email.service.js";

export async function listForUser(userId, { soloNoLeidas } = {}) {
  let sql = `SELECT * FROM notificaciones WHERE userId = ?`;
  const params = [userId];
  if (soloNoLeidas) {
    sql += ` AND leida = 0`;
  }
  sql += ` ORDER BY datetime(createdAt) DESC LIMIT 200`;
  return all(sql, params);
}

export async function crearNotificacion({ userId, tipo, titulo, mensaje, enviarCorreo, email }) {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  await run(
    `INSERT INTO notificaciones (id, userId, tipo, titulo, mensaje, leida, createdAt)
     VALUES (?, ?, ?, ?, ?, 0, ?)`,
    [id, userId, tipo, titulo, mensaje, createdAt]
  );
  if (enviarCorreo && email) {
    try {
      await emailService.sendMail({
        to: email,
        subject: titulo,
        text: mensaje,
      });
    } catch (e) {
      console.warn("No se pudo enviar correo de notificación:", e.message);
    }
  }
  return get(`SELECT * FROM notificaciones WHERE id = ?`, [id]);
}

export async function marcarLeida(id, userId) {
  const row = await get(`SELECT id FROM notificaciones WHERE id = ? AND userId = ?`, [id, userId]);
  if (!row) throw new HttpError(404, "Notificación no encontrada");
  await run(`UPDATE notificaciones SET leida = 1 WHERE id = ?`, [id]);
  return { ok: true };
}

/** Notifica a RRHH/ADMIN sobre tardanza del día. */
export async function alertaTardanzaRRHH({ empleadoNombre, minutos, correoEmpleado }) {
  const destinatarios = await all(
    `SELECT id, email FROM usuarios WHERE rol IN ('ADMIN','RRHH')`
  );
  const titulo = "Alerta de tardanza";
  const mensaje = `${empleadoNombre} registró entrada con ${minutos} minutos de tardanza (${todayLocalISODate()}).`;
  for (const u of destinatarios) {
    await crearNotificacion({
      userId: u.id,
      tipo: "TARDANZA",
      titulo,
      mensaje,
      enviarCorreo: false,
    });
  }
  if (correoEmpleado) {
    await emailService.sendMail({
      to: correoEmpleado,
      subject: "Registro de tardanza",
      text: `Se registró su ingreso con tardanza de ${minutos} minutos.`,
    });
  }
}
