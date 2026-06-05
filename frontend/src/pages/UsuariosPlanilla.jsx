import { useEffect, useState } from "react";
import Modal from "../components/Modal.jsx";
import Spinner from "../components/Spinner.jsx";
import api from "../services/api.js";
import * as empleadosApi from "../services/empleados.api.js";
import * as catalogosApi from "../services/catalogos.api.js";
import { useAuth } from "../context/AuthContext.jsx";

function isoFromLocal(dtLocal) {
  // dtLocal: yyyy-MM-ddTHH:mm
  const d = new Date(dtLocal);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function UsuariosPlanilla() {
  const { user } = useAuth();
  const isRrhh = user?.rol === "RRHH";
  const roleOptions = isRrhh
    ? [{ value: "EMPLEADO", label: "EMPLEADO" }]
    : [
        { value: "ADMIN", label: "ADMIN" },
        { value: "RRHH", label: "RRHH" },
        { value: "SECRETARIA", label: "SECRETARIA" },
      ];

  const [rows, setRows] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({
    username: "",
    password: "",
    rol: isRrhh ? "EMPLEADO" : "RRHH",
    empleadoId: "",
    untilLocal: "",
    ownerAdminId: "",
  });

  async function load() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/secretaria/usuarios-planilla");
      setRows(data);
    } catch (e) {
      setError(e.response?.data?.error || "No se pudo cargar usuarios");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    empleadosApi
      .listEmpleados({ limit: 500 })
      .then((r) => setEmpleados(r.data || []))
      .catch(() => setEmpleados([]));
  }, []);

  useEffect(() => {
    if (isRrhh) return;
    catalogosApi
      .getAdmins()
      .then((data) => setAdmins(data || []))
      .catch(() => setAdmins([]));
  }, [isRrhh]);

  async function save() {
    let untilIso = null;
    if (form.rol === "EMPLEADO") {
      if (!form.empleadoId) {
        setError("Selecciona el empleado a vincular");
        return;
      }
      untilIso = isoFromLocal(form.untilLocal);
      if (!untilIso) {
        setError("Fecha/hora de vencimiento inválida");
        return;
      }
    }
    if (user?.rol === "SECRETARIA" && form.rol === "RRHH" && !form.ownerAdminId) {
      setError("Selecciona el admin al que quedará vinculado RRHH");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await api.put(`/secretaria/usuarios-planilla/${editing.id}`, {
          rol: form.rol,
          empleadoId: form.rol === "EMPLEADO" ? form.empleadoId : null,
          password: form.password || undefined,
          planillaAccessUntil: untilIso,
          ownerAdminId: form.rol === "RRHH" ? form.ownerAdminId || null : null,
        });
      } else {
        await api.post("/secretaria/usuarios-planilla", {
          username: form.username.trim(),
          password: form.password,
          rol: form.rol,
          empleadoId: form.rol === "EMPLEADO" ? form.empleadoId : null,
          planillaAccessUntil: untilIso,
          ownerAdminId: form.rol === "RRHH" ? form.ownerAdminId || null : null,
        });
      }
      setOpen(false);
      setEditing(null);
      setForm({
        username: "",
        password: "",
        rol: isRrhh ? "EMPLEADO" : "RRHH",
        empleadoId: "",
        untilLocal: "",
        ownerAdminId: "",
      });
      await load();
    } catch (e) {
      setError(e.response?.data?.error || "No se pudo guardar usuario");
    } finally {
      setSaving(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({
      username: "",
      password: "",
      rol: isRrhh ? "EMPLEADO" : "RRHH",
      empleadoId: "",
      untilLocal: "",
      ownerAdminId: "",
    });
    setOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    setForm({
      username: row.username || "",
      password: "",
      rol: row.rol || "EMPLEADO",
      empleadoId: row.empleadoId || "",
      ownerAdminId: row.ownerAdminId || "",
      untilLocal: row.planillaAccessUntil
        ? new Date(new Date(row.planillaAccessUntil).getTime() - new Date().getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16)
        : "",
    });
    setOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setSaving(true);
    setError("");
    try {
      await api.delete(`/secretaria/usuarios-planilla/${deleting.id}`);
      setDeleting(null);
      await load();
    } catch (e) {
      setError(e.response?.data?.error || "No se pudo eliminar usuario");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {isRrhh ? "Usuarios empleados" : "Usuarios internos"}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Crea usuarios por <span className="font-semibold">username</span> (sin correo) y elige su rol.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white"
        >
          Nuevo usuario
        </button>
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
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Admin vinculado</th>
                  <th className="px-4 py-3">Vence</th>
                  <th className="px-4 py-3">Creado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No hay usuarios creados aún.
                    </td>
                  </tr>
                ) : (
                  rows.map((u) => (
                    <tr key={u.id}>
                      <td className="px-4 py-3 font-mono">{u.username}</td>
                      <td className="px-4 py-3">{u.rol}</td>
                      <td className="px-4 py-3">
                        {u.ownerAdminId
                          ? admins.find((a) => a.id === u.ownerAdminId)?.email ||
                            admins.find((a) => a.id === u.ownerAdminId)?.username ||
                            "Admin"
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {u.planillaAccessUntil ? new Date(u.planillaAccessUntil).toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {new Date(u.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => openEdit(u)}
                          className="text-brand-600 font-medium"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(u)}
                          className="text-red-600 font-medium"
                        >
                          Eliminar
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
        open={open}
        onClose={() => !saving && setOpen(false)}
        title={editing ? "Editar usuario" : "Crear usuario"}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setOpen(false);
                setEditing(null);
              }}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear"}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Username</label>
            <input
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              disabled={Boolean(editing)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              placeholder="ej: planilla01"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Contraseña {editing ? "(opcional para cambiar)" : ""}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              placeholder={editing ? "dejar vacío para mantener" : "mínimo 6 caracteres"}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Rol</label>
            <select
              value={form.rol}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  rol: e.target.value,
                  empleadoId: e.target.value === "EMPLEADO" ? f.empleadoId : "",
                }))
              }
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              {roleOptions.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          {form.rol === "EMPLEADO" ? (
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Empleado vinculado</label>
              <select
                value={form.empleadoId}
                onChange={(e) => setForm((f) => ({ ...f, empleadoId: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="">Selecciona empleado</option>
                {empleados.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombres} {e.apellidos}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {user?.rol === "SECRETARIA" && form.rol === "RRHH" ? (
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Admin vinculado</label>
              <select
                value={form.ownerAdminId}
                onChange={(e) => setForm((f) => ({ ...f, ownerAdminId: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="">Selecciona admin</option>
                {admins.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.email || a.username || a.id}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Vencimiento (fecha y hora)
            </label>
            <input
              type="datetime-local"
              value={form.untilLocal}
              onChange={(e) => setForm((f) => ({ ...f, untilLocal: e.target.value }))}
              disabled={form.rol !== "EMPLEADO"}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
            <p className="mt-1 text-xs text-slate-500">
              Solo aplica para rol <span className="font-semibold">EMPLEADO</span>; en otros roles se ignora.
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => !saving && setDeleting(null)}
        title="Eliminar usuario"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => setDeleting(null)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={confirmDelete}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Eliminar
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          ¿Eliminar al usuario <span className="font-semibold">{deleting?.username}</span>?
        </p>
      </Modal>
    </div>
  );
}

