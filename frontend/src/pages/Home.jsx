import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiBarChart2,
  FiCalendar,
  FiFileText,
  FiLock,
  FiUsers,
} from "react-icons/fi";

function Feature({ icon: Icon, title, desc }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="h-10 w-10 rounded-xl bg-brand-600/10 text-brand-600 flex items-center justify-center">
        <Icon />
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{desc}</p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-brand-600" />
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Plataforma</p>
              <p className="font-bold">PeopleOps</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 inline-flex items-center gap-2"
            >
              Iniciar sesión <FiArrowRight />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:border-brand-900 dark:bg-brand-950/30 dark:text-brand-300">
              <FiLock /> Gestión empresarial segura con roles
            </p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight">
              Empleados, asistencia y planillas en un solo panel moderno
            </h1>
            <p className="mt-4 text-slate-600 dark:text-slate-400">
              Administra tu empresa con un dashboard tipo SaaS: control de asistencia con tardanzas,
              generación de planillas y reportes exportables.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Entrar al sistema
              </Link>
              <Link
                to="/register"
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
              >
                Crear cuenta (Admin/RRHH)
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Nota: los usuarios “de planilla” se crean desde el módulo de Secretaría con usuario y vencimiento.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="grid grid-cols-2 gap-4">
              <MiniStat label="Empleados activos" value="—" />
              <MiniStat label="Asistencia hoy" value="—" />
              <MiniStat label="Planillas" value="—" />
              <MiniStat label="Alertas" value="—" />
            </div>
            <div className="mt-6 rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-600 p-5 text-white">
              <p className="text-sm font-semibold">Diseño tipo Admin Panel</p>
              <p className="mt-1 text-sm text-white/90">
                Sidebar, tablas modernas, modales, modo oscuro y gráficos.
              </p>
            </div>
          </div>
        </div>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">¿Qué ofrece el servicio?</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Módulos listos para un proyecto universitario profesional y escalable.
          </p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Feature
              icon={FiUsers}
              title="Gestión de empleados"
              desc="CRUD completo, foto con Multer, filtros por área, paginación y detalle."
            />
            <Feature
              icon={FiCalendar}
              title="Asistencia"
              desc="Entrada/salida, tardanzas automáticas, ausencias, historial y filtros por fecha."
            />
            <Feature
              icon={FiFileText}
              title="Planillas y boletas"
              desc="Cálculo de neto, horas extra, AFP/impuestos y boleta PDF descargable."
            />
            <Feature
              icon={FiBarChart2}
              title="Dashboard con gráficos"
              desc="KPIs y gráficos de asistencia y masa salarial por área (Recharts)."
            />
            <Feature
              icon={FiLock}
              title="Roles y seguridad"
              desc="JWT + bcrypt, rutas protegidas y control por rol (Admin/RRHH/Empleado/Secretaría)."
            />
            <Feature
              icon={FiFileText}
              title="Reportes"
              desc="Exportaciones Excel/PDF para auditoría: empleados, asistencia, planillas y salarios."
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-500">
        </div>
      </footer>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/30">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-extrabold tabular-nums">{value}</p>
    </div>
  );
}

