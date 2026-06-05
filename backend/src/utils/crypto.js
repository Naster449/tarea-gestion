import crypto from "crypto";
import { env } from "../config/env.js";

const ALGO = "aes-256-gcm";

function getKey() {
  return crypto.createHash("sha256").update(env.jwtSecret).digest();
}

export function encryptJson(obj) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const plaintext = JSON.stringify(obj);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

export function decryptJson(str) {
  if (!str) return null;
  const [ivB, tagB, dataB] = str.split(":");
  const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivB, "base64"));
  decipher.setAuthTag(Buffer.from(tagB, "base64"));
  const dec = Buffer.concat([decipher.update(Buffer.from(dataB, "base64")), decipher.final()]);
  return JSON.parse(dec.toString("utf8"));
}
