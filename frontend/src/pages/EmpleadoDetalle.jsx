import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import * as empleadosApi from "../services/empleados.api.js";
import Spinner from "../components/Spinner.jsx";

export default function EmpleadoDetalle() {
  const { id } = useParams();
  const [row, setRow] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancel = false;
    async function load() {
      try {
        const r = await empleadosApi.getEmpleado(id);
        if (!cancel) setRow(r);
      } catch (e) {
        if (!cancel) setError(e.response?.data?.error || "No se pudo cargar");
      }
    }
    load();
    return () => {
      cancel = true;
    };
  }, [id]);

  if (error) {
    return (
      <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-xl px-4 py-3">
        {error}
      </p>
    );
  }
  if (!row) return <Spinner />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/app/empleados" className="text-sm text-brand-600 font-medium">
        ← Volver al listado
      </Link>
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-6">
          {row.fotoUrl ? (
            <img
              src={row.fotoUrl}
              alt=""
              className="h-40 w-40 rounded-2xl object-cover border border-slate-100 dark:border-slate-800"
            />
          ) : (
            <div className="h-40 w-40 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              Sin foto
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">
              {row.nombres} {row.apellidos}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">{row.cargoNombre || "—"} · {row.areaNombre || "—"}</p>
            <p className="mt-4 text-sm">
              <span className="text-slate-500">DNI:</span> {row.dni}
            </p>
            <p className="text-sm">
              <span className="text-slate-500">Correo:</span> {row.correo}
            </p>
            <p className="text-sm">
              <span className="text-slate-500">Teléfono:</span> {row.telefono}
            </p>
            <p className="text-sm">
              <span className="text-slate-500">Dirección:</span> {row.direccion || "—"}
            </p>
            <p className="text-sm">
              <span className="text-slate-500">Salario:</span> S/ {Number(row.salario).toFixed(2)}
            </p>
            <p className="text-sm">
              <span className="text-slate-500">Ingreso:</span> {String(row.fechaIngreso).slice(0, 10)}
            </p>
            <p className="text-sm">
              <span className="text-slate-500">Estado:</span> {row.estado}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
