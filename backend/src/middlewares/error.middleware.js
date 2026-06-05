import { HttpError } from "../utils/httpError.js";

export function errorMiddleware(err, _req, res, _next) {
  const status = err.status || (err instanceof HttpError ? err.status : 500);
  const message =
    status === 500 && process.env.NODE_ENV === "production"
      ? "Error interno del servidor"
      : err.message || "Error";

  if (status === 500) {
    console.error(err);
  }

  res.status(status).json({
    error: message,
    ...(err.details ? { details: err.details } : {}),
  });
}
