import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useDebounce } from "../hooks/useDebounce.js";
import * as empleadosApi from "../services/empleados.api.js";
import * as catalogosApi from "../services/catalogos.api.js";
import Modal from "../components/Modal.jsx";
import PaginationBar from "../components/PaginationBar.jsx";
import Spinner from "../components/Spinner.jsx";
import * as sedesApi from "../services/sedes.api.js";
import { useFaceRecognition } from "../hooks/useFaceRecognition.js";

const empty = {
  nombres: "",
  apellidos: "",
  dni: "",
  correo: "",
  telefono: "",
  direccion: "",
  cargoId: "",
  areaId: "",
  salario: "",
  fechaIngreso: "",
  estado: "ACTIVO",
  sedeId: "",
  crearUsuario: false,
};

export default function Empleados() {
  const { user } = useAuth();
  const canEdit = user?.rol === "ADMIN" || user?.rol === "RRHH";

  const face = useFaceRecognition();
  const [tempFaceDescriptor, setTempFaceDescriptor] = useState(null);
  const [biometricStatus, setBiometricStatus] = useState("");

  const [q, setQ] = useState("");
  const dq = useDebounce(q, 300);
  const [areaId, setAreaId] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [areas, setAreas] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [foto, setFoto] = useState(null);
  const [hasFacialDescriptor, setHasFacialDescriptor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [delTarget, setDelTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await empleadosApi.listEmpleados({
        q: dq || undefined,
        areaId: areaId || undefined,
        page,
        limit: 10,
      });
      setData(res.data || []);
      setMeta(res.meta || null);
    } catch (e) {
      setError(e.response?.data?.error || "Error al cargar empleados");
    } finally {
      setLoading(false);
    }
  }, [dq, areaId, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    catalogosApi.getAreas().then(setAreas);
    if (canEdit) sedesApi.listSedes().then(setSedes).catch(() => {});
  }, [canEdit]);

  useEffect(() => {
    catalogosApi.getCargos(form.areaId || undefined).then(setCargos);
  }, [form.areaId, modal]);

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setFoto(null);
    setTempFaceDescriptor(null);
    setBiometricStatus("");
    setHasFacialDescriptor(false);
    setModal(true);
    face.startCamera();
  }

  function openEdit(row) {
    setEditing(row);
    setForm({
      nombres: row.nombres,
      apellidos: row.apellidos,
      dni: row.dni,
      correo: row.correo || "",
      telefono: row.telefono || "",
      direccion: row.direccion || "",
      cargoId: row.cargoId || "",
      areaId: row.areaId || "",
      salario: String(row.salario),
      fechaIngreso: String(row.fechaIngreso).slice(0, 10),
      estado: row.estado,
      sedeId: row.sedeId || "",
      crearUsuario: false,
    });
    setFoto(null);
    setTempFaceDescriptor(null);
    setBiometricStatus(row.hasFacialDescriptor ? "Perfil registrado en base de datos" : "");
    setHasFacialDescriptor(Boolean(row.hasFacialDescriptor));
    setModal(true);
    face.startCamera();
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        salario: form.salario || 0,
        cargoId: form.cargoId || null,
        areaId: form.areaId || null,
        sedeId: form.sedeId || null,
        crearUsuario: form.crearUsuario,
        faceDescriptor: tempFaceDescriptor,
      };
      if (editing) {
        await empleadosApi.updateEmpleado(editing.id, payload, foto || undefined);
      } else {
        await empleadosApi.createEmpleado(payload, foto || undefined);
      }
      face.stopCamera();
      setModal(false);
      await load();
    } catch (e) {
      setError(e.response?.data?.error || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  async function capturarBiometria() {
    setBiometricStatus("Capturando...");
    try {
      const desc = await face.captureDescriptor();
      setTempFaceDescriptor(desc);
      setBiometricStatus("¡Rostro capturado y listo para guardar!");
    } catch (err) {
      setBiometricStatus("Error al capturar: " + (err.message || "No se detectó rostro"));
    }
  }

  async function confirmDelete() {
    if (!delTarget) return;
    setSaving(true);
    setError("");
    try {
      await empleadosApi.deleteEmpleado(delTarget.id);
      setDelTarget(null);
      await load();
    } catch (e) {
      setError(e.response?.data?.error || "No se pudo eliminar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Trabajadores</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Gestión centralizada del sistema</p>
        </div>
        {canEdit ? (
          <button
            type="button"
            onClick={openCreate}
            className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Nuevo empleado
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          placeholder="Buscar…"
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <select
          value={areaId}
          onChange={(e) => {
            setPage(1);
            setAreaId(e.target.value);
          }}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">Todas las áreas</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
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
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">DNI</th>
                  <th className="px-4 py-3">Área</th>
                  <th className="px-4 py-3">Cargo</th>
                  <th className="px-4 py-3">Salario</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Sin resultados
                    </td>
                  </tr>
                ) : (
                  data.map((e) => (
                    <tr key={e.id}>
                      <td className="px-4 py-3 font-medium">
                        <Link to={`/app/empleados/${e.id}`} className="text-brand-600 hover:underline">
                          {e.nombres} {e.apellidos}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{e.dni}</td>
                      <td className="px-4 py-3">{e.areaNombre || "—"}</td>
                      <td className="px-4 py-3">{e.cargoNombre || "—"}</td>
                      <td className="px-4 py-3 tabular-nums">S/ {Number(e.salario).toFixed(2)}</td>
                      <td className="px-4 py-3">{e.estado}</td>
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        <Link to={`/app/empleados/${e.id}`} className="text-brand-600 font-medium">
                          Ver
                        </Link>
                        {canEdit ? (
                          <>
                            <button type="button" className="text-brand-600 font-medium" onClick={() => openEdit(e)}>
                              Editar
                            </button>
                            <button
                              type="button"
                              className="text-red-600 font-medium"
                              onClick={() => setDelTarget(e)}
                            >
                              Eliminar
                            </button>
                          </>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <PaginationBar meta={meta} onChange={setPage} />
        </div>
      </div>

      <Modal
        open={modal}
        onClose={() => { if (!saving) { face.stopCamera(); setModal(false); } }}
        title={editing ? "Editar empleado" : "Nuevo empleado"}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => { face.stopCamera(); setModal(false); }}
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
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[65vh] overflow-y-auto pr-1">
          {[
            ["nombres", "Nombres"],
            ["apellidos", "Apellidos"],
            ["dni", "DNI"],
          ].map(([k, label]) => (
            <div key={k}>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={form[k]}
                onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                required
              />
            </div>
          ))}

          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Ocupación / Cargo</label>
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              value={form.cargoId}
              onChange={(e) => setForm((f) => ({ ...f, cargoId: e.target.value }))}
            >
              <option value="">— Seleccionar —</option>
              {cargos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Sede asignada (Para verificación GPS)</label>
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              value={form.sedeId}
              onChange={(e) => setForm((f) => ({ ...f, sedeId: e.target.value }))}
            >
              <option value="">— Seleccionar Sede —</option>
              {sedes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>

          {!editing && (
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  checked={form.crearUsuario || false}
                  onChange={(e) => setForm((f) => ({ ...f, crearUsuario: e.target.checked }))}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-600 dark:border-slate-700 dark:bg-slate-900"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Crear cuenta de acceso automáticamente (Usuario y Contraseña serán el DNI)
                </span>
              </label>
            </div>
          )}

          <div className="sm:col-span-2 space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mt-3 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Captura Biométrica Facial Directa</p>
              {tempFaceDescriptor || hasFacialDescriptor ? (
                <span className="text-xs text-emerald-600 font-semibold bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">Listo</span>
              ) : (
                <span className="text-xs text-amber-600 font-semibold bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full">Pendiente</span>
              )}
            </div>

            <p className="text-xs text-slate-500">
              Usa la cámara para capturar los puntos biométricos. Solo se almacenan los puntos matemáticos, no la foto.
            </p>

            <div className="relative aspect-video max-h-48 rounded-lg overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-700">
              {face.stream ? (
                <video
                  ref={face.videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                  Cargando cámara frontal...
                </div>
              )}
            </div>

            {biometricStatus && (
              <p className={`text-xs font-medium ${biometricStatus.includes("Error") ? "text-red-500" : "text-emerald-600"}`}>
                {biometricStatus}
              </p>
            )}

            <button
              type="button"
              disabled={!face.modelsReady || !face.stream}
              onClick={capturarBiometria}
              className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-brand-700"
            >
              Capturar Perfil Biométrico
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(delTarget)}
        onClose={() => !saving && setDelTarget(null)}
        title="Eliminar empleado"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => setDelTarget(null)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={confirmDelete}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Eliminar
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          ¿Eliminar a {delTarget?.nombres} {delTarget?.apellidos}? Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
}
