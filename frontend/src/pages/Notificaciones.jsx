import { useEffect, useState } from "react";
import * as notificacionesApi from "../services/notificaciones.api.js";
import Spinner from "../components/Spinner.jsx";

export default function Notificaciones() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await notificacionesApi.listNotificaciones({});
      setRows(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function leer(id) {
    await notificacionesApi.marcarLeida(id);
    await load();
  }

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Alertas y notificaciones</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Tardanzas, planillas y avisos del sistema
        </p>
      </div>
      <ul className="space-y-3">
        {rows.length === 0 ? (
          <li className="text-slate-500 text-sm">No hay notificaciones.</li>
        ) : (
          rows.map((n) => (
            <li
              key={n.id}
              className={`rounded-2xl border px-4 py-3 flex justify-between gap-3 ${
                n.leida
                  ? "border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900 opacity-70"
                  : "border-brand-200 bg-brand-50/50 dark:border-brand-900 dark:bg-brand-950/20"
              }`}
            >
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">{n.tipo}</p>
                <p className="font-semibold">{n.titulo}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{n.mensaje}</p>
                <p className="text-xs text-slate-400 mt-2">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              {!n.leida ? (
                <button
                  type="button"
                  onClick={() => leer(n.id)}
                  className="self-start text-xs font-semibold text-brand-600"
                >
                  Marcar leída
                </button>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
