import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporter = null;

function getTransporter() {
  if (!env.smtp.host) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    });
  }
  return transporter;
}

/**
 * Envía correo si hay SMTP configurado; si no, registra en consola (modo desarrollo).
 */
export async function sendMail({ to, subject, text, html }) {
  const tx = getTransporter();
  if (!tx) {
    console.info("[email:skip]", { to, subject, text: text?.slice(0, 200) });
    return { skipped: true };
  }
  await tx.sendMail({
    from: env.smtp.from,
    to,
    subject,
    text,
    html,
  });
  return { sent: true };
}
