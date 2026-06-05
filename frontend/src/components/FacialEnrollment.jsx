import { useEffect, useState } from "react";
import { useFaceRecognition } from "../hooks/useFaceRecognition.js";
import * as empleadosApi from "../services/empleados.api.js";

/** Captura perfil biométrico facial (descriptor 128D) sin almacenar imágenes. */
export default function FacialEnrollment({ empleadoId, hasDescriptor, onRegistered }) {
  const face = useFaceRecognition();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    face.startCamera();
  }, []);

  async function registrar() {
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const descriptor = await face.captureDescriptor();
      await empleadosApi.registerFacialDescriptor(empleadoId, descriptor);
      setMsg("Perfil biométrico registrado correctamente.");
      onRegistered?.();
    } catch (e) {
      setErr(e.response?.data?.error || e.message || "Error al registrar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Perfil biométrico facial</p>
        {hasDescriptor ? (
          <span className="text-xs text-emerald-600 font-semibold">Registrado</span>
        ) : (
          <span className="text-xs text-amber-600 font-semibold">Pendiente</span>
        )}
      </div>
      <p className="text-xs text-slate-500">
        Se extraen puntos faciales (landmarks) y un descriptor numérico. No se guardan fotografías.
      </p>
      <div className="relative aspect-video max-h-48 rounded-lg overflow-hidden bg-slate-900">
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
            Cargando cámara...
          </div>
        )}
      </div>
      {err ? <p className="text-xs text-red-600">{err}</p> : null}
      {msg ? <p className="text-xs text-emerald-600">{msg}</p> : null}
      <button
        type="button"
        disabled={busy || !face.modelsReady || !face.stream}
        onClick={registrar}
        className="w-full rounded-xl bg-brand-600 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Procesando..." : hasDescriptor ? "Actualizar perfil biométrico" : "Registrar perfil biométrico"}
      </button>
    </div>
  );
}
