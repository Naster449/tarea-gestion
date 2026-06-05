import "dotenv/config";

export const env = {
  port: Number(process.env.PORT) || 4000,
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me-in-production-min-32",
  databasePath: process.env.DATABASE_PATH || "./data/empresa.db",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  uploadDir: process.env.UPLOAD_DIR || "./uploads",
  attendanceExpected: process.env.ATTENDANCE_EXPECTED_TIME || "09:00",
  attendanceGraceMinutes: Number(process.env.ATTENDANCE_GRACE_MINUTES) || 5,
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.MAIL_FROM || "RRHH <no-reply@empresa.local>",
  },
};
