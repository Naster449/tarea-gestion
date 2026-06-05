import { NavLink, Outlet } from "react-router-dom";
import {
  FiBell,
  FiBriefcase,
  FiHome,
  FiLogOut,
  FiMoon,
  FiSun,
  FiUsers,
  FiCalendar,
  FiFileText,
  FiSmartphone,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

const linkBase =
  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const isStaff = user?.rol === "ADMIN";
  const canManageEmpleados = user?.rol === "ADMIN" || user?.rol === "RRHH";

  const nav = [
    { to: "/app", label: "Inicio", icon: FiHome, show: true },
    { to: "/app/empleados", label: "Trabajadores", icon: FiUsers, show: canManageEmpleados },
    { to: "/app/asistencia", label: "Horarios", icon: FiCalendar, show: true },
    { to: "/app/marcacion", label: "Marcación móvil", icon: FiSmartphone, show: user?.rol === "EMPLEADO" },
    { to: "/app/planillas", label: "Planillas", icon: FiBriefcase, show: true },
    { to: "/app/reportes", label: "Reportes", icon: FiFileText, show: isStaff },
    { to: "/app/notificaciones", label: "Alertas", icon: FiBell, show: true },
    { to: "/app/admin/usuarios", label: "Cuentas de Usuarios", icon: FiUsers, show: isStaff },
  ];

  return (
    <div className="min-h-full flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950">
      <aside className="md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="p-5 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Empresa</p>
            <p className="font-bold text-slate-900 dark:text-white">PeopleOps</p>
          </div>
          <button
            type="button"
            onClick={toggle}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            title="Modo oscuro"
          >
            {dark ? <FiSun /> : <FiMoon />}
          </button>
        </div>
        <nav className="px-3 pb-4 flex md:flex-col gap-1 overflow-x-auto">
          {nav
            .filter((n) => n.show)
            .map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/app"}
                className={({ isActive }) =>
                  [
                    linkBase,
                    isActive
                      ? "bg-brand-600 text-white shadow-md"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                  ].join(" ")
                }
              >
                <n.icon className="text-lg" />
                {n.label}
              </NavLink>
            ))}
        </nav>
        <div className="hidden md:block px-4 py-4 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">{user?.rol}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2 text-sm font-medium dark:border-slate-700"
          >
            <FiLogOut /> Salir
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <span className="font-semibold">Menú</span>
          <button type="button" onClick={logout} className="text-sm text-brand-600">
            Salir
          </button>
        </header>
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
