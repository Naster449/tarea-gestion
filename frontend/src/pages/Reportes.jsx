import { useState } from "react";
import * as reportesApi from "../services/reportes.api.js";
import { downloadBlob } from "../utils/download.js";

async function grab(url, name) {
  const blob = await reportesApi.downloadReport(url);
  downloadBlob(blob, name);
}

export default function Reportes() {
  const [periodo, setPeriodo] = useState("");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  async function run(label, fn) {
    setErr("");
    setBusy(label);
    try {
      await fn();
    } catch (e) {
      setErr(e.response?.data?.error || "Error al generar reporte");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Reportes</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Gestión centralizada del sistema
        </p>
      </div>

      {err ? (
        <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-xl px-4 py-3">
          {err}
        </p>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ReportCard
          title="Empleados activos"
          description="Listado completo en Excel o PDF resumido."
          busy={busy}
          onExcel={() =>
            run("emp-xlsx", () => grab("/reportes/empleados-activos?format=xlsx", "empleados-activos.xlsx"))
          }
          onPdf={() =>
            run("emp-pdf", () => grab("/reportes/empleados-activos?format=pdf", "empleados-activos.pdf"))
          }
        />
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 space-y-3">
          <h2 className="font-semibold">Asistencia mensual</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Excel detallado por día.</p>
          <input
            placeholder="YYYY-MM"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
          <button
            type="button"
            disabled={!periodo || busy}
            onClick={() =>
              run("asist", () =>
                grab(`/reportes/asistencia-mensual?periodo=${periodo}&format=xlsx`, `asistencia-${periodo}.xlsx`)
              )
            }
            className="w-full rounded-xl bg-brand-600 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Descargar Excel
          </button>
        </div>
        <ReportCard
          title="Planillas"
          description="Exporta todas las planillas o filtra por periodo en la URL del backend."
          busy={busy}
          onExcel={() => run("plan", () => grab("/reportes/planillas?format=xlsx", "planillas.xlsx"))}
        />
        <ReportCard
          title="Salarios"
          description="Masa salarial por empleado activo."
          busy={busy}
          onExcel={() => run("sal", () => grab("/reportes/salarios?format=xlsx", "salarios.xlsx"))}
        />
      </div>
    </div>
  );
}

function ReportCard({ title, description, onExcel, onPdf, busy }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 space-y-3">
      <h2 className="font-semibold">{title}</h2>
      <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
      <div className="flex flex-wrap gap-2">
        {onExcel ? (
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={onExcel}
            className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Excel
          </button>
        ) : null}
        {onPdf ? (
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={onPdf}
            className="rounded-xl bg-slate-800 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-slate-700"
          >
            PDF
          </button>
        ) : null}
      </div>
    </div>
  );
}
