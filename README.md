# Sistema Web de Gestión de Empleados y Planillas

Aplicación empresarial **full-stack**: React (Vite) + Tailwind + Recharts en el frontend; **Node.js + Express + SQLite (better-sqlite3)** en el backend — **sin Prisma**, con SQL explícito y capas modulares.

## Características principales

- Autenticación JWT, registro (primer usuario `ADMIN`, siguientes `RRHH`), roles `ADMIN` / `RRHH` / `EMPLEADO`
- Dashboard con KPIs y gráficos (asistencia, masa salarial por área)
- CRUD de empleados con foto (**Multer**), búsqueda, filtro por área y paginación
- Asistencia: entrada/salida, tardanza automática, ausencias (RRHH), filtros por fecha
- Planillas mensuales: horas extras, bonos, descuentos, AFP, impuestos, **neto**; **boleta PDF**
- Reportes: exportación **Excel** y **PDF** (empleados, asistencia, planillas, salarios)
- Notificaciones in-app + correo opcional (**Nodemailer** + variables SMTP)
- UI responsive, sidebar tipo admin, **modo oscuro**, spinners y confirmaciones

## Estructura

```
backend/src/
  config/ controllers/ db/ middlewares/ routes/ services/ utils/ app.js seed.js
frontend/src/
  components/ context/ hooks/ layouts/ pages/ routes/ services/ utils/
```

## Requisitos

- Node.js 18+

## Variables de entorno

Copia `backend/.env.example` → `backend/.env` y ajusta valores.

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto API (default 5000) |
| `JWT_SECRET` | Secreto firma JWT |
| `DATABASE_PATH` | Ruta archivo SQLite |
| `CORS_ORIGIN` | Origen del frontend |
| `UPLOAD_DIR` | Carpeta de fotos |
| `ATTENDANCE_EXPECTED_TIME` | Hora esperada de entrada `HH:mm` |
| `ATTENDANCE_GRACE_MINUTES` | Gracia antes de marcar tardanza |
| `SMTP_*` | Opcional, para envío real de correos |

Frontend opcional: `frontend/.env` con `VITE_API_URL=http://localhost:5000/api` si no usas proxy de Vite.

## Instalación

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Abre `http://localhost:5173`. El proxy reenvía `/api` y `/uploads` al puerto 5000.

## Usuarios de demostración (seed)

Tras `npm run seed` en `backend`:

| Rol | Email | Contraseña |
|-----|-------|------------|
| ADMIN | admin@empresa.demo | Admin123! |
| RRHH | rrhh@empresa.demo | Rrhh123! |
| EMPLEADO | empleado@empresa.demo | Emp123! |

> Si ya registraste un usuario desde la UI, el seed detecta datos existentes y no sobrescribe. Borra `backend/data/empresa.db` para reiniciar.

## Ejemplos de consumo API (curl)

**Login**

```bash
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@empresa.demo\",\"password\":\"Admin123!\"}"
```

**Listar empleados (paginado)**

```bash
curl -s http://localhost:5000/api/empleados?page=1&limit=10 \
  -H "Authorization: Bearer TU_TOKEN"
```

**Registrar entrada**

```bash
curl -s -X POST http://localhost:5000/api/asistencia/entrada \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"empleadoId\":\"UUID_OPCIONAL_SOLO_RRHH\"}"
```

**Crear planilla**

```bash
curl -s -X POST http://localhost:5000/api/planillas \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"empleadoId\":\"...\",\"periodo\":\"2025-05\",\"salarioBase\":5000,\"horasExtras\":4,\"tarifaHoraExtra\":25,\"bonos\":200,\"descuentos\":100,\"afp\":450,\"impuestos\":120}"
```

**Descargar boleta PDF**

```bash
curl -f -o boleta.pdf http://localhost:5000/api/planillas/ID/boleta \
  -H "Authorization: Bearer TU_TOKEN"
```

## Producción

- Backend: `npm start`
- Frontend: `npm run build` y servir `frontend/dist`; configurar CORS y `VITE_API_URL` según el dominio.

## Notas técnicas

- Persistencia: **better-sqlite3** + esquema en `backend/src/db/schema.sql`
- PDF: `pdfkit`; Excel: `exceljs`
- Contraseñas: `bcryptjs`
