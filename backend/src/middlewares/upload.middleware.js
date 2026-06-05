import fs from "fs";
import path from "path";
import multer from "multer";
import { env } from "../config/env.js";

function getUploadDir() {
  const preferred = path.isAbsolute(env.uploadDir)
    ? path.join(env.uploadDir, "empleados")
    : path.resolve(process.cwd(), env.uploadDir, "empleados");
  try {
    fs.mkdirSync(preferred, { recursive: true });
    return preferred;
  } catch {
    // Fallback: usar directorio local en caso de que /var/data no exista o no tenga permisos
    const fallback = path.resolve(process.cwd(), "uploads", "empleados");
    fs.mkdirSync(fallback, { recursive: true });
    console.warn(`⚠️ No se pudo crear ${preferred}. Usando fallback: ${fallback}`);
    return fallback;
  }
}

const dir = getUploadDir();
console.log(`📁 Directorio de uploads: ${dir}`);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, dir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const safe = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, safe);
  },
});

export const uploadFotoEmpleado = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.mimetype)) {
      return cb(new Error("Solo imágenes JPG, PNG o WEBP"));
    }
    cb(null, true);
  },
});

export function uploadsPublicPath() {
  const uploadRoot = path.isAbsolute(env.uploadDir) ? env.uploadDir : path.resolve(process.cwd(), env.uploadDir);
  // Si el directorio principal no existe, usar fallback
  if (!fs.existsSync(uploadRoot)) {
    return path.resolve(process.cwd(), "uploads");
  }
  return uploadRoot;
}
