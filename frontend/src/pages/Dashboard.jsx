import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { useAuth } from "../context/AuthContext.jsx";
import * as dashboardApi from "../services/dashboard.api.js";
import * as asistenciaApi from "../services/asistencia.api.js";
import Spinner from "../components/Spinner.jsx";

function Kpi({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums">{value}</p>
      {hint ? <p className="text-xs text-slate-500 mt-1">{hint}</p> : null}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const isStaff = user?.rol === "ADMIN";
  const [data, setData] = useState(null);
  const [miAsistencia, setMiAsistencia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancel = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        if (isStaff) {
          const d = await dashboardApi.getDashboard();
          if (!cancel) setData(d);
        } else {
          const rows = await asistenciaApi.listAsistencia({});
          if (!cancel) setMiAsistencia(rows.slice(0, 14));
        }
      } catch (e) {
        if (!cancel) setError(e.response?.data?.error || "No se pudo cargar el panel");
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    load();
    return () => {
      cancel = true;
    };
  }, [isStaff]);

  if (loading) return <Spinner label="Cargando panel…" />;
  if (error) {
    return (
      <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-xl px-4 py-3">
        {error}
      </p>
    );
  }

  if (!isStaff) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Mi espacio</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Consulta tu historial reciente de asistencia
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-left">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Tardanza</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {miAsistencia.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                    Sin registros aún. Usa Asistencia para marcar entrada/salida.
                  </td>
                </tr>
              ) : (
                miAsistencia.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3">{r.fecha}</td>
                    <td className="px-4 py-3">{r.estado}</td>
                    <td className="px-4 py-3">{r.minutosTardanza} min</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const salarioData = (data.charts?.salarioPorArea || []).map((r) => ({
    name: r.area || "Sin área",
    total: Math.round(Number(r.total || 0)),
  }));

  const asistData = (data.charts?.asistenciaSemana || []).map((r) => ({
    fecha: r.fecha,
    presentes: r.presentes,
    tardios: r.tardios,
  }));

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard ejecutivo</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          KPIs de personal, asistencia y planillas
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi label="Empleados totales" value={data.empleados.total} />
        <Kpi label="Activos" value={data.empleados.activos} />
        <Kpi
          label="Ausentes hoy (estimado)"
          value={data.asistencia.ausentesHoy}
          hint="Activos sin marca de entrada"
        />
        <Kpi label="Planillas generadas" value={data.planillas.total} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-semibold mb-4">Masa salarial por área</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salarioData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#33415555" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-semibold mb-4">Asistencia (7 días)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={asistData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#33415555" />
                <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="presentes" stroke="#16a34a" strokeWidth={2} />
                <Line type="monotone" dataKey="tardios" stroke="#f97316" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 font-semibold">
            Últimos empleados
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {(data.ultimosEmpleados || []).map((e) => (
              <li key={e.id} className="px-5 py-3 flex justify-between gap-2">
                <span>
                  {e.nombres} {e.apellidos}
                </span>
                <span className="text-slate-500">{e.estado}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 font-semibold">
            Últimas planillas
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {(data.ultimosRegistros?.planillas || []).map((p) => (
              <li key={p.id} className="px-5 py-3 flex justify-between gap-2">
                <span>
                  {p.nombres} {p.apellidos}
                </span>
                <span className="font-mono text-emerald-600">S/ {Number(p.neto).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
