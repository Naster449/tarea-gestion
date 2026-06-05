import express from "express";
import cors from "cors";
import path from "path";
import { env } from "./config/env.js";
import { initDb } from "./db/index.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { uploadsPublicPath } from "./middlewares/upload.middleware.js";
import { HttpError } from "./utils/httpError.js";
import { autoSeed } from "./seed.js";

import authRoutes from "./routes/auth.routes.js";
import usuarioRoutes from "./routes/usuario.routes.js";
import catalogoRoutes from "./routes/catalogo.routes.js";
import empleadoRoutes from "./routes/empleado.routes.js";
import asistenciaRoutes from "./routes/asistencia.routes.js";
import planillaRoutes from "./routes/planilla.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import notificacionRoutes from "./routes/notificacion.routes.js";
import reporteRoutes from "./routes/reporte.routes.js";
import sedeRoutes from "./routes/sede.routes.js";
import auditoriaRoutes from "./routes/auditoria.routes.js";

await initDb();
try {
  await autoSeed();
} catch (e) {
  console.error("[app] Error en seed automático:", e.message);
}

const app = express();

app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));

const uploadsRoot = uploadsPublicPath();
app.use("/uploads", express.static(uploadsRoot));

app.get("/api/health", (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/catalogos", catalogoRoutes);
app.use("/api/empleados", empleadoRoutes);
app.use("/api/asistencia", asistenciaRoutes);
app.use("/api/planillas", planillaRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notificaciones", notificacionRoutes);
app.use("/api/reportes", reporteRoutes);
app.use("/api/sedes", sedeRoutes);
app.use("/api/auditoria", auditoriaRoutes);

app.use((_req, _res, next) => next(new HttpError(404, "Ruta no encontrada")));

app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "Archivo demasiado grande" });
  }
  if (err.message === "Solo imágenes JPG, PNG o WEBP") {
    return res.status(400).json({ error: err.message });
  }
  return errorMiddleware(err, req, res, next);
});

app.listen(env.port, () => {
  console.log(`API lista en http://localhost:${env.port}`);
  console.log(`Archivos estáticos: ${uploadsRoot}`);
});
