import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import { env } from "../config/env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let dbInstance = null;

/**
 * Ejecuta SQL síncrono envuelto en Promise para mantener async/await en capas superiores.
 */
export async function run(sql, params = []) {
  const db = getDb();
  return Promise.resolve().then(() => db.prepare(sql).run(...params));
}

export async function all(sql, params = []) {
  const db = getDb();
  return Promise.resolve().then(() => db.prepare(sql).all(...params));
}

export async function get(sql, params = []) {
  const db = getDb();
  return Promise.resolve().then(() => db.prepare(sql).get(...params));
}

export function getDb() {
  if (!dbInstance) {
    throw new Error("Base de datos no inicializada. Llama a initDb() primero.");
  }
  return dbInstance;
}

export async function initDb() {
  const dbPath = path.isAbsolute(env.databasePath)
    ? env.databasePath
    : path.resolve(process.cwd(), env.databasePath);
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  dbInstance = new Database(dbPath);
  dbInstance.pragma("journal_mode = WAL");
  dbInstance.pragma("foreign_keys = ON");

  const schemaPath = path.join(__dirname, "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  dbInstance.exec(schema);

  // Migraciones livianas (dev): si la BD ya existía, agregamos columnas nuevas si faltan.
  // Nota: cambios de restricciones NOT NULL/UNIQUE complejas requieren recrear la BD.
  const cols = dbInstance
    .prepare(`PRAGMA table_info(usuarios)`)
    .all()
    .map((c) => c.name);
  const addCol = (name, typeSql) => {
    if (!cols.includes(name)) {
      dbInstance.exec(`ALTER TABLE usuarios ADD COLUMN ${name} ${typeSql}`);
    }
  };
  addCol("username", "TEXT");
  addCol("planillaAccessUntil", "TEXT");
  addCol("ownerAdminId", "TEXT");

  // Backfill multi-tenant ownership (legacy data)
  dbInstance.exec(`
    UPDATE usuarios
    SET ownerAdminId = id
    WHERE rol = 'ADMIN' AND ownerAdminId IS NULL
  `);
  dbInstance.exec(`
    UPDATE usuarios
    SET ownerAdminId = (
      SELECT id FROM usuarios a
      WHERE a.rol = 'ADMIN'
      ORDER BY datetime(a.createdAt) ASC
      LIMIT 1
    )
    WHERE rol != 'ADMIN' AND ownerAdminId IS NULL
  `);

  const empCols = dbInstance
    .prepare(`PRAGMA table_info(empleados)`)
    .all()
    .map((c) => c.name);
  if (!empCols.includes("ownerAdminId")) {
    dbInstance.exec(`ALTER TABLE empleados ADD COLUMN ownerAdminId TEXT`);
  }
  if (!empCols.includes("facialFotoPath")) {
    dbInstance.exec(`ALTER TABLE empleados ADD COLUMN facialFotoPath TEXT`);
  }
  if (!empCols.includes("facialDescriptor")) {
    dbInstance.exec(`ALTER TABLE empleados ADD COLUMN facialDescriptor TEXT`);
  }
  if (!empCols.includes("sedeId")) {
    dbInstance.exec(`ALTER TABLE empleados ADD COLUMN sedeId TEXT`);
  }
  dbInstance.exec(`
    UPDATE empleados
    SET ownerAdminId = (
      SELECT u.ownerAdminId
      FROM usuarios u
      WHERE u.empleadoId = empleados.id
      LIMIT 1
    )
    WHERE ownerAdminId IS NULL
  `);
  dbInstance.exec(`
    UPDATE empleados
    SET ownerAdminId = (
      SELECT id FROM usuarios a
      WHERE a.rol = 'ADMIN'
      ORDER BY datetime(a.createdAt) ASC
      LIMIT 1
    )
    WHERE ownerAdminId IS NULL
  `);

  // Tablas nuevas del módulo de asistencia inteligente
  dbInstance.exec(`
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
    )
  `);
  dbInstance.exec(`
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
    )
  `);

  const asistCols = dbInstance
    .prepare(`PRAGMA table_info(asistencias)`)
    .all()
    .map((c) => c.name);
  const addAsistCol = (name, typeSql) => {
    if (!asistCols.includes(name)) {
      dbInstance.exec(`ALTER TABLE asistencias ADD COLUMN ${name} ${typeSql}`);
    }
  };
  addAsistCol("entradaLat", "REAL");
  addAsistCol("entradaLng", "REAL");
  addAsistCol("salidaLat", "REAL");
  addAsistCol("salidaLng", "REAL");
  addAsistCol("validacionFacialEntrada", "TEXT");
  addAsistCol("validacionFacialSalida", "TEXT");
  addAsistCol("validacionUbicacionEntrada", "TEXT");
  addAsistCol("validacionUbicacionSalida", "TEXT");
  addAsistCol("sedeId", "TEXT");

  return dbInstance;
}
