import { env } from "../config/env.js";

/**
 * Calcula minutos de tardanza respecto a la hora esperada + gracia.
 */
export function computeTardanzaMinutes(now = new Date()) {
  const [h, m] = env.attendanceExpected.split(":").map((x) => parseInt(x, 10));
  const expected = new Date(now);
  expected.setHours(h, m, 0, 0);
  const graceEnd = new Date(expected.getTime() + env.attendanceGraceMinutes * 60 * 1000);
  if (now <= graceEnd) return 0;
  return Math.floor((now - graceEnd) / 60000);
}

export function todayLocalISODate(d = new Date()) {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}
