import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiSmartphone, FiMapPin } from "react-icons/fi";
import { useAuth } from "../context/AuthContext.jsx";
import * as asistenciaApi from "../services/asistencia.api.js";
import * as empleadosApi from "../services/empleados.api.js";
import * as sedesApi from "../services/sedes.api.js";
import Modal from "../components/Modal.jsx";
import Spinner from "../components/Spinner.jsx";

function ValidationBadge({ value }) {
  if (!value || value === "N/A") return <span className="text-slate-400">—</span>;
  const ok = value === "OK";
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        ok
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
          : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
      }`}
    >
      {value}
    </span>
  );
}

export default function Asistencia() {
  const { user } = useAuth();
  const isStaff = user?.rol === "ADMIN" || user?.rol === "RRHH";
  const isSelfMark = user?.rol === "EMPLEADO";
  const [rows, setRows] = useState([]);
  const [auditoria, setAuditoria] = useState([]);
  const [tab, setTab] = useState("historial");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resumen, setResumen] = useState(null);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [empId, setEmpId] = useState("");
  const [empleados, setEmpleados] = useState([]);
  const [ausOpen, setAusOpen] = useState(false);
  const [ausForm, setAusForm] = useState({ empleadoId: "", fecha: "", notas: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (desde) params.desde = desde;
      if (hasta) params.hasta = hasta;
      if (empId && isStaff) params.empleadoId = empId;
      const data = await asistenciaApi.listAsistencia(params);
      setRows(data);
      if (isStaff) {
        try {
          const r = await asistenciaApi.resumenAsistencia();
          setResumen(r);
          const aud = await sedesApi.listAuditoria({ desde, hasta });
          setAuditoria(aud);
        } catch {
          setResumen(null);
        }
      }
    } catch (e) {
      setError(e.response?.data?.error || "Error al cargar asistencia");
    } finally {
      setLoading(false);
    }
  }, [desde, hasta, empId, isStaff]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!isStaff) return;
    empleadosApi.listEmpleados({ limit: 200 }).then((r) => setEmpleados(r.data || []));
  }, [isStaff]);

  async function marcarManual(tipo) {
    if (isStaff && !empId) {
      setError("Selecciona un empleado para marcar manualmente.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const payload = isStaff && empId ? { empleadoId: empId } : {};
      if (tipo === "entrada") await asistenciaApi.entrada(payload);
      else await asistenciaApi.salida(payload);
      await load();
    } catch (e) {
      setError(e.response?.data?.error || "No se pudo registrar");
    } finally {
      setBusy(false);
    }
  }

  async function guardarAusencia() {
    setBusy(true);
    setError("");
    try {
      await asistenciaApi.ausencia(ausForm);
      setAusOpen(false);
      await load();
    } catch (e) {
      setError(e.response?.data?.error || "No se pudo registrar ausencia");
    } finally {
      setBusy(false);
    }
  }

  const tabs = [
    { id: "historial", label: "Historial" },
    ...(isStaff ? [{ id: "auditoria", label: "Auditoría" }] : []),
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Horarios</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Gestión centralizada del sistema
          </p>
        </div>
        {isSelfMark ? (
          <Link
            to="/app/marcacion"
            className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20"
          >
            <FiSmartphone /> Ir a marcación móvil
          </Link>
        ) : null}
      </div>

      {isStaff ? (
        <div className="flex flex-wrap gap-2">
          <Link
            to="/app/asistencia/sedes"
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium dark:border-slate-700"
          >
            <FiMapPin /> Configurar sedes
          </Link>
          {isStaff ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => marcarManual("entrada")}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Entrada manual
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => marcarManual("salida")}
                className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-slate-700"
              >
                Salida manual
              </button>
              <button
                type="button"
                onClick={() => setAusOpen(true)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-700"
              >
                Registrar ausencia
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      {isStaff && resumen ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi label="Asistencia hoy" value={`${resumen.porcentajeAsistencia}%`} />
          <Kpi label="Puntuales" value={resumen.puntualesHoy} />
          <Kpi label="Tardíos" value={resumen.tardiosHoy} />
          <Kpi label="Presentes" value={resumen.presentesHoy} />
        </div>
      ) : null}

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t.id
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-slate-500"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "historial" ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            {isStaff ? (
              <select
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="">Trabajador (Todos)</option>
                {empleados.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombres} {e.apellidos}
                  </option>
                ))}
              </select>
            ) : (
              <div />
            )}
            <button
              type="button"
              onClick={load}
              className="rounded-xl bg-brand-600 text-white text-sm font-semibold py-2"
            >
              Buscar Registros
            </button>
          </div>

          {error ? (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-100 rounded-xl px-4 py-3">
              {error}
            </p>
          ) : null}

          <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            {loading ? (
              <Spinner />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-left">
                    <tr>
                      <th className="px-4 py-3">FECHA / HORA</th>
                      <th className="px-4 py-3">EMPLEADO</th>
                      <th className="px-4 py-3">ESTADO</th>
                      <th className="px-4 py-3">ENTRADA</th>
                      <th className="px-4 py-3">SALIDA</th>
                      <th className="px-4 py-3">FACIAL</th>
                      <th className="px-4 py-3">GPS</th>
                      <th className="px-4 py-3">SEDE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                          Sin registros
                        </td>
                      </tr>
                    ) : (
                      rows.map((r) => (
                        <tr key={r.id}>
                          <td className="px-4 py-3 whitespace-nowrap">{r.fecha}</td>
                          <td className="px-4 py-3">
                            {r.nombres} {r.apellidos}
                          </td>
                          <td className="px-4 py-3">{r.estado}</td>
                          <td className="px-4 py-3 text-xs">
                            {r.entradaAt ? new Date(r.entradaAt).toLocaleString() : "—"}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {r.salidaAt ? new Date(r.salidaAt).toLocaleString() : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <ValidationBadge value={r.validacionFacialEntrada} />
                          </td>
                          <td className="px-4 py-3">
                            <ValidationBadge value={r.validacionUbicacionEntrada} />
                          </td>
                          <td className="px-4 py-3 text-xs">{r.sedeNombre || "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          {loading ? (
            <Spinner />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-left">
                  <tr>
                    <th className="px-4 py-3">Fecha/hora</th>
                    <th className="px-4 py-3">Empleado</th>
                    <th className="px-4 py-3">Acción</th>
                    <th className="px-4 py-3">Facial</th>
                    <th className="px-4 py-3">GPS</th>
                    <th className="px-4 py-3">Detalles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {auditoria.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        Sin registros de auditoría
                      </td>
                    </tr>
                  ) : (
                    auditoria.map((a) => (
                      <tr key={a.id}>
                        <td className="px-4 py-3 text-xs whitespace-nowrap">
                          {new Date(a.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          {a.nombres} {a.apellidos}
                        </td>
                        <td className="px-4 py-3">{a.accion}</td>
                        <td className="px-4 py-3">
                          <ValidationBadge value={a.validacionFacial} />
                        </td>
                        <td className="px-4 py-3">
                          <ValidationBadge value={a.validacionUbicacion} />
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{a.detalles || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal
        open={ausOpen}
        onClose={() => !busy && setAusOpen(false)}
        title="Registrar ausencia"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => setAusOpen(false)}
              className="rounded-xl border px-4 py-2 text-sm dark:border-slate-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={guardarAusencia}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Guardar
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600">Empleado</label>
            <select
              required
              value={ausForm.empleadoId}
              onChange={(e) => setAusForm((f) => ({ ...f, empleadoId: e.target.value }))}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="">Selecciona</option>
              {empleados.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombres} {e.apellidos}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Fecha</label>
            <input
              type="date"
              required
              value={ausForm.fecha}
              onChange={(e) => setAusForm((f) => ({ ...f, fecha: e.target.value }))}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Notas</label>
            <textarea
              value={ausForm.notas}
              onChange={(e) => setAusForm((f) => ({ ...f, notas: e.target.value }))}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              rows={3}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Kpi({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
