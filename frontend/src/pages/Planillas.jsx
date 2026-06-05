import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import * as planillasApi from "../services/planillas.api.js";
import * as empleadosApi from "../services/empleados.api.js";
import Modal from "../components/Modal.jsx";
import Spinner from "../components/Spinner.jsx";
import { downloadBlob } from "../utils/download.js";

function calcPreview(f) {
  const base = Number(f.salarioBase) || 0;
  const he = Number(f.horasExtras) || 0;
  const th = Number(f.tarifaHoraExtra) || 0;
  const bon = Number(f.bonos) || 0;
  const des = Number(f.descuentos) || 0;
  const afp = Number(f.afp) || 0;
  const imp = Number(f.impuestos) || 0;
  const bruto = base + bon + he * th;
  const neto = Math.round((bruto - des - afp - imp) * 100) / 100;
  return { bruto: Math.round(bruto * 100) / 100, neto };
}

export default function Planillas() {
  const { user } = useAuth();
  const canCreate = user?.rol === "ADMIN";
  const [rows, setRows] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    empleadoId: "",
    periodo: "",
    salarioBase: "",
    horasExtras: "0",
    tarifaHoraExtra: "0",
    bonos: "0",
    descuentos: "0",
    afp: "0",
    impuestos: "0",
  });

  const preview = useMemo(() => calcPreview(form), [form]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [p, e] = await Promise.all([
        planillasApi.listPlanillas({}),
        empleadosApi.listEmpleados({ limit: 500, estado: "ACTIVO" }).catch(() => ({ data: [] })),
      ]);
      setRows(p);
      setEmpleados(e.data || []);
    } catch (e) {
      setError(e.response?.data?.error || "Error al cargar planillas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function onPickEmp(id) {
    const emp = empleados.find((x) => x.id === id);
    setForm((f) => ({
      ...f,
      empleadoId: id,
      salarioBase: emp ? String(emp.salario) : "",
    }));
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      await planillasApi.createPlanilla({
        empleadoId: form.empleadoId,
        periodo: form.periodo,
        salarioBase: Number(form.salarioBase),
        horasExtras: Number(form.horasExtras),
        tarifaHoraExtra: Number(form.tarifaHoraExtra),
        bonos: Number(form.bonos),
        descuentos: Number(form.descuentos),
        afp: Number(form.afp),
        impuestos: Number(form.impuestos),
      });
      setModal(false);
      await load();
    } catch (e) {
      setError(e.response?.data?.error || "No se pudo crear la planilla");
    } finally {
      setSaving(false);
    }
  }

  async function descargar(id) {
    const blob = await planillasApi.downloadBoleta(id);
    downloadBlob(blob, `boleta-${id}.pdf`);
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Planillas</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Cálculo de neto con horas extras, AFP e impuestos
          </p>
        </div>
        {canCreate ? (
          <button
            type="button"
            onClick={() => {
              setForm({
                empleadoId: "",
                periodo: "",
                salarioBase: "",
                horasExtras: "0",
                tarifaHoraExtra: "0",
                bonos: "0",
                descuentos: "0",
                afp: "0",
                impuestos: "0",
              });
              setModal(true);
            }}
            className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Nueva planilla
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-xl px-4 py-3">
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
                  <th className="px-4 py-3">Periodo</th>
                  <th className="px-4 py-3">Empleado</th>
                  <th className="px-4 py-3">Base</th>
                  <th className="px-4 py-3">Neto</th>
                  <th className="px-4 py-3 text-right">Boleta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      Sin planillas
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-3 font-mono">{r.periodo}</td>
                      <td className="px-4 py-3">
                        {r.nombres} {r.apellidos}
                      </td>
                      <td className="px-4 py-3 tabular-nums">S/ {Number(r.salarioBase).toFixed(2)}</td>
                      <td className="px-4 py-3 tabular-nums font-semibold text-emerald-600">
                        S/ {Number(r.neto).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => descargar(r.id)}
                          className="text-brand-600 font-medium"
                        >
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={modal}
        onClose={() => !saving && setModal(false)}
        title="Nueva planilla mensual"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => setModal(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Guardar
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Empleado</label>
            <select
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              value={form.empleadoId}
              onChange={(e) => onPickEmp(e.target.value)}
            >
              <option value="">Selecciona</option>
              {empleados.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombres} {e.apellidos}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Periodo (YYYY-MM)</label>
              <input
                required
                placeholder="2025-05"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={form.periodo}
                onChange={(e) => setForm((f) => ({ ...f, periodo: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium">Salario base</label>
              <input
                type="number"
                step="0.01"
                required
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={form.salarioBase}
                onChange={(e) => setForm((f) => ({ ...f, salarioBase: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium">Horas extras</label>
              <input
                type="number"
                step="0.25"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={form.horasExtras}
                onChange={(e) => setForm((f) => ({ ...f, horasExtras: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium">Tarifa hora extra</label>
              <input
                type="number"
                step="0.01"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={form.tarifaHoraExtra}
                onChange={(e) => setForm((f) => ({ ...f, tarifaHoraExtra: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium">Bonos</label>
              <input
                type="number"
                step="0.01"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={form.bonos}
                onChange={(e) => setForm((f) => ({ ...f, bonos: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium">Descuentos</label>
              <input
                type="number"
                step="0.01"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={form.descuentos}
                onChange={(e) => setForm((f) => ({ ...f, descuentos: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium">AFP (monto)</label>
              <input
                type="number"
                step="0.01"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={form.afp}
                onChange={(e) => setForm((f) => ({ ...f, afp: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium">Impuestos (monto)</label>
              <input
                type="number"
                step="0.01"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={form.impuestos}
                onChange={(e) => setForm((f) => ({ ...f, impuestos: e.target.value }))}
              />
            </div>
          </div>
          <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3 text-sm">
            <p className="text-slate-600 dark:text-slate-300">
              Bruto estimado: <span className="font-semibold">S/ {preview.bruto.toFixed(2)}</span>
            </p>
            <p className="text-slate-800 dark:text-slate-100 mt-1 text-lg font-bold">
              Neto a pagar: S/ {preview.neto.toFixed(2)}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
