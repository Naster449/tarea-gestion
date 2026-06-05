import { useEffect, useState } from "react";
import { FiMapPin, FiShield, FiCamera, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { useAuth } from "../context/AuthContext.jsx";
import { useFaceRecognition } from "../hooks/useFaceRecognition.js";
import { useGeolocation } from "../hooks/useGeolocation.js";
import * as asistenciaApi from "../services/asistencia.api.js";

export default function Marcacion() {
  const { user } = useAuth();
  const face = useFaceRecognition();
  const geo = useGeolocation();
  const [sede, setSede] = useState(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const isSelfMark = user?.rol === "EMPLEADO";

  useEffect(() => {
    if (!isSelfMark) return;
    face.startCamera();
    asistenciaApi.miSede().then((r) => setSede(r.sede)).catch(() => {});
  }, [isSelfMark]);

  async function marcar(tipo) {
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      let faceDescriptor = null;
      let latitud = null;
      let longitud = null;

      if (isSelfMark) {
        const coords = geo.position || (await geo.requestLocation());
        latitud = coords.latitud;
        longitud = coords.longitud;
        faceDescriptor = await face.captureDescriptor();
      }

      const payload = { latitud, longitud, faceDescriptor };
      if (tipo === "entrada") {
        await asistenciaApi.entrada(payload);
        setSuccess("Entrada registrada correctamente.");
      } else {
        await asistenciaApi.salida(payload);
        setSuccess("Salida registrada correctamente.");
      }
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Error al marcar asistencia");
    } finally {
      setBusy(false);
    }
  }

  if (!isSelfMark) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <p className="text-slate-600 dark:text-slate-400">
          La marcación inteligente está disponible para empleados. Usa el panel de Asistencia para gestionar registros.
        </p>
      </div>
    );
  }

  const statusItems = [
    {
      icon: FiCamera,
      label: "Cámara",
      ok: Boolean(face.stream),
      text: face.stream ? "Activa" : "Esperando permiso",
    },
    {
      icon: FiShield,
      label: "Modelos faciales",
      ok: face.modelsReady,
      text: face.modelsReady ? "Listos" : "Cargando...",
    },
    {
      icon: FiMapPin,
      label: "GPS",
      ok: Boolean(geo.position),
      text: geo.position
        ? `${geo.position.latitud.toFixed(5)}, ${geo.position.longitud.toFixed(5)}`
        : geo.loading
          ? "Obteniendo..."
          : "Sin señal",
    },
  ];

  return (
    <div className="max-w-md mx-auto space-y-5 pb-8">
      <div className="text-center">
        <h1 className="text-xl font-bold">Control de Asistencia Inteligente</h1>
        <p className="text-sm text-slate-500 mt-1">
          Reconocimiento facial + geolocalización
        </p>
      </div>

      {sede ? (
        <div className="rounded-xl bg-brand-50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900 px-4 py-3 text-sm">
          <p className="font-semibold text-brand-800 dark:text-brand-300 flex items-center gap-2">
            <FiMapPin /> Sede autorizada: {sede.nombre}
          </p>
          <p className="text-xs text-brand-600 dark:text-brand-400 mt-1">
            Radio permitido: {sede.radioMetros}m
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-2">
        {statusItems.map(({ icon: Icon, label, ok, text }) => (
          <div
            key={label}
            className={`rounded-xl border p-3 text-center text-xs ${
              ok
                ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"
                : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            }`}
          >
            <Icon className={`mx-auto text-lg mb-1 ${ok ? "text-emerald-600" : "text-slate-400"}`} />
            <p className="font-semibold">{label}</p>
            <p className="text-slate-500 truncate">{text}</p>
          </div>
        ))}
      </div>

      <div className="relative aspect-[3/4] max-h-[420px] rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-200 dark:border-slate-700">
        {face.stream ? (
          <video
            ref={face.videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
            <div className="w-10 h-10 rounded-full border-4 border-slate-600 border-t-brand-500 animate-spin mb-3" />
            <p className="text-sm">Iniciando cámara...</p>
          </div>
        )}
        <div className="absolute inset-0 border-[3px] border-dashed border-brand-400/60 rounded-2xl m-8 pointer-events-none" />
        
        {face.stream && !success && (
          <div className="absolute left-1/2 -translate-x-1/2 w-2/3 h-0.5 bg-brand-400 shadow-glow animate-scan rounded-full pointer-events-none" />
        )}

        {success && (
          <div className="absolute inset-0 bg-emerald-500/90 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in z-20">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-xl">
              <FiCheckCircle className="text-4xl text-emerald-500" />
            </div>
            <p className="text-white font-bold text-center px-6">{success}</p>
          </div>
        )}

        <p className="absolute bottom-3 left-0 right-0 text-center text-xs text-white/80 drop-shadow">
          Solo se procesan puntos biométricos — no se guardan fotos
        </p>
      </div>

      {(error || face.error || geo.error) ? (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          <FiAlertCircle className="shrink-0 mt-0.5" />
          <span>{error || face.error || geo.error}</span>
        </div>
      ) : null}

      {success ? null : null}

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={busy || !face.stream || !face.modelsReady}
          onClick={() => marcar("entrada")}
          className="rounded-2xl bg-emerald-600 py-4 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
        >
          {busy ? "Verificando..." : "Marcar entrada"}
        </button>
        <button
          type="button"
          disabled={busy || !face.stream || !face.modelsReady}
          onClick={() => marcar("salida")}
          className="rounded-2xl bg-slate-800 py-4 text-sm font-bold text-white hover:bg-slate-900 disabled:opacity-50 dark:bg-slate-700"
        >
          {busy ? "Verificando..." : "Marcar salida"}
        </button>
      </div>

      <button
        type="button"
        onClick={() => geo.requestLocation()}
        className="w-full text-xs text-brand-600 font-medium py-2"
      >
        Actualizar ubicación GPS
      </button>
    </div>
  );
}
