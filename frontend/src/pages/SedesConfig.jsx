import { useCallback, useEffect, useState } from "react";
import { FiMapPin, FiPlus, FiTrash2, FiEdit2 } from "react-icons/fi";
import * as sedesApi from "../services/sedes.api.js";
import Modal from "../components/Modal.jsx";
import Spinner from "../components/Spinner.jsx";

const emptyForm = { nombre: "", latitud: "", longitud: "", radioMetros: "100" };

export default function SedesConfig() {
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await sedesApi.listSedes();
      setSedes(data);
    } catch (e) {
      setError(e.response?.data?.error || "Error al cargar sedes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(sede) {
    setEditing(sede);
    setForm({
      nombre: sede.nombre,
      latitud: String(sede.latitud),
      longitud: String(sede.longitud),
      radioMetros: String(sede.radioMetros),
    });
    setModalOpen(true);
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Geolocalización no disponible");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitud: String(pos.coords.latitude),
          longitud: String(pos.coords.longitude),
        }));
      },
      () => setError("No se pudo obtener tu ubicación")
    );
  }

  async function guardar() {
    setBusy(true);
    setError("");
    try {
      const body = {
        nombre: form.nombre,
        latitud: Number(form.latitud),
        longitud: Number(form.longitud),
        radioMetros: Number(form.radioMetros) || 100,
      };
      if (editing) {
        await sedesApi.updateSede(editing.id, body);
      } else {
        await sedesApi.createSede(body);
      }
      setModalOpen(false);
      await load();
    } catch (e) {
      setError(e.response?.data?.error || "Error al guardar sede");
    } finally {
      setBusy(false);
    }
  }

  async function eliminar(id) {
    if (!confirm("¿Eliminar esta sede?")) return;
    try {
      await sedesApi.deleteSede(id);
      await load();
    } catch (e) {
      setError(e.response?.data?.error || "Error al eliminar");
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Sedes autorizadas</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configura ubicaciones y radio de tolerancia para la marcación GPS
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white"
        >
          <FiPlus /> Nueva sede
        </button>
      </div>

      {error ? (
        <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </p>
      ) : null}

      {loading ? (
        <Spinner />
      ) : sedes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center text-slate-500">
          <FiMapPin className="mx-auto text-3xl mb-3 opacity-50" />
          <p>No hay sedes configuradas. Crea una para habilitar la validación GPS.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sedes.map((s) => (
            <div
              key={s.id}
              className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <FiMapPin className="text-brand-600" />
                  {s.nombre}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {s.latitud.toFixed(6)}, {s.longitud.toFixed(6)}
                </p>
                <p className="text-xs text-slate-400 mt-1">Radio: {s.radioMetros} metros</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(s)}
                  className="rounded-xl border border-slate-200 p-2 dark:border-slate-700"
                >
                  <FiEdit2 />
                </button>
                <button
                  type="button"
                  onClick={() => eliminar(s.id)}
                  className="rounded-xl border border-red-200 p-2 text-red-600 dark:border-red-900"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => !busy && setModalOpen(false)}
        title={editing ? "Editar sede" : "Nueva sede"}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => setModalOpen(false)}
              className="rounded-xl border px-4 py-2 text-sm dark:border-slate-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={guardar}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Guardar
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600">Nombre de la sede</label>
            <input
              required
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              placeholder="Oficina Central"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600">Latitud</label>
              <input
                required
                type="number"
                step="any"
                value={form.latitud}
                onChange={(e) => setForm((f) => ({ ...f, latitud: e.target.value }))}
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Longitud</label>
              <input
                required
                type="number"
                step="any"
                value={form.longitud}
                onChange={(e) => setForm((f) => ({ ...f, longitud: e.target.value }))}
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={useMyLocation}
            className="text-xs text-brand-600 font-medium"
          >
            Usar mi ubicación actual
          </button>
          <div>
            <label className="text-xs font-medium text-slate-600">Radio permitido (metros)</label>
            <input
              type="number"
              min="10"
              max="5000"
              value={form.radioMetros}
              onChange={(e) => setForm((f) => ({ ...f, radioMetros: e.target.value }))}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
            <p className="text-xs text-slate-400 mt-1">Recomendado: 50–100 m para oficinas</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
