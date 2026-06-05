-- SQLite schema — Sistema de Gestión de Empleados, Asistencia y Planillas
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS areas (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cargos (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  areaId TEXT REFERENCES areas(id) ON DELETE SET NULL,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS empleados (
  id TEXT PRIMARY KEY,
  nombres TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  dni TEXT NOT NULL UNIQUE,
  correo TEXT NOT NULL,
  telefono TEXT NOT NULL,
  direccion TEXT,
  cargoId TEXT REFERENCES cargos(id) ON DELETE SET NULL,
  areaId TEXT REFERENCES areas(id) ON DELETE SET NULL,
  salario REAL NOT NULL DEFAULT 0,
  fechaIngreso TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'ACTIVO',
  fotoPath TEXT,
  facialFotoPath TEXT,
  facialDescriptor TEXT,
  sedeId TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sedes (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  latitud REAL NOT NULL,
  longitud REAL NOT NULL,
  radioMetros INTEGER NOT NULL DEFAULT 100,
  ownerAdminId TEXT NOT NULL,
  activo INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  -- Para usuarios internos (ADMIN/RRHH/SECRETARIA): email opcional.
  -- Para usuarios de planilla: usar username (sin correo).
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  password TEXT NOT NULL,
  rol TEXT NOT NULL,
  empleadoId TEXT UNIQUE REFERENCES empleados(id) ON DELETE SET NULL,
  -- Vencimiento de acceso a planillas (ISO datetime). Si NULL: acceso normal por rol.
  planillaAccessUntil TEXT,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS asistencias (
  id TEXT PRIMARY KEY,
  empleadoId TEXT NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  fecha TEXT NOT NULL,
  entradaAt TEXT,
  salidaAt TEXT,
  minutosTardanza INTEGER NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'INCOMPLETO',
  notas TEXT,
  entradaLat REAL,
  entradaLng REAL,
  salidaLat REAL,
  salidaLng REAL,
  validacionFacialEntrada TEXT,
  validacionFacialSalida TEXT,
  validacionUbicacionEntrada TEXT,
  validacionUbicacionSalida TEXT,
  sedeId TEXT REFERENCES sedes(id) ON DELETE SET NULL,
  createdAt TEXT NOT NULL,
  UNIQUE(empleadoId, fecha)
);

CREATE TABLE IF NOT EXISTS auditoria_marcaciones (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  empleadoId TEXT NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  accion TEXT NOT NULL,
  detalles TEXT,
  latitud REAL,
  longitud REAL,
  validacionFacial TEXT,
  validacionUbicacion TEXT,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS planillas (
  id TEXT PRIMARY KEY,
  empleadoId TEXT NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  periodo TEXT NOT NULL,
  salarioBase REAL NOT NULL,
  horasExtras REAL NOT NULL DEFAULT 0,
  tarifaHoraExtra REAL NOT NULL DEFAULT 0,
  bonos REAL NOT NULL DEFAULT 0,
  descuentos REAL NOT NULL DEFAULT 0,
  afp REAL NOT NULL DEFAULT 0,
  impuestos REAL NOT NULL DEFAULT 0,
  neto REAL NOT NULL,
  createdAt TEXT NOT NULL,
  UNIQUE(empleadoId, periodo)
);

CREATE TABLE IF NOT EXISTS notificaciones (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  leida INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_empleados_area ON empleados(areaId);
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha ON asistencias(fecha);
CREATE INDEX IF NOT EXISTS idx_sedes_owner ON sedes(ownerAdminId);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria_marcaciones(createdAt);
CREATE INDEX IF NOT EXISTS idx_planillas_periodo ON planillas(periodo);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notificaciones(userId);
