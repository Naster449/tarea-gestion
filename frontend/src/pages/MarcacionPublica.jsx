import { useEffect, useState } from "react";
import { FiMapPin, FiShield, FiCamera, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { useFaceRecognition } from "../hooks/useFaceRecognition.js";
import { useGeolocation } from "../hooks/useGeolocation.js";
import * as asistenciaApi from "../services/asistencia.api.js";

export default function MarcacionPublica() {
  const face = useFaceRecognition();
  const geo = useGeolocation();
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    face.startCamera();
  }, []);

  async function marcar(tipo) {
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      const coords = geo.position || (await geo.requestLocation());
      const faceDescriptor = await face.captureDescriptor();

      const payload = { latitud: coords.latitud, longitud: coords.longitud, faceDescriptor };
      let res;
      if (tipo === "entrada") {
        res = await asistenciaApi.entradaAutomatica(payload);
      } else {
        res = await asistenciaApi.salidaAutomatica(payload);
      }
      
      setSuccess(`¡Asistencia de ${res.nombres} registrada!`);
      
      setTimeout(() => {
        setSuccess("");
      }, 4000);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Error al marcar asistencia");
    } finally {
      setBusy(false);
    }
  }

  const statusItems = [
    {
      icon: FiCamera,
      label: "Cámara",
      ok: Boolean(face.stream),
      text: face.stream ? "Activa" : "Esperando",
    },
    {
      icon: FiShield,
      label: "Biometría",
      ok: face.modelsReady,
      text: face.modelsReady ? "Lista" : "Cargando",
    },
    {
      icon: FiMapPin,
      label: "GPS",
      ok: Boolean(geo.position),
      text: geo.position ? "Detectado" : geo.loading ? "Buscando..." : "Sin señal",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white flex flex-col max-w-md mx-auto relative overflow-hidden">
      <header className="px-6 py-5 flex items-center justify-between z-10">
        <div>
          <h2 className="font-bold text-xl leading-tight text-brand-400">InteliMarcación</h2>
          <p className="text-slate-400 text-sm">Reconocimiento Facial Activo</p>
        </div>
      </header>

      <main className="flex-1 px-6 flex flex-col z-10 pb-8">
        
        <div className="flex gap-2 mb-6">
          {statusItems.map(({ icon: Icon, label, ok, text }) => (
            <div
              key={label}
              className={`flex-1 rounded-2xl p-2.5 text-center text-[10px] sm:text-xs transition-colors duration-500 ${
                ok
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                  : "bg-slate-800/50 border border-slate-700/50 text-slate-400"
              }`}
            >
              <Icon className={`mx-auto text-lg mb-1`} />
              <p className="font-medium">{text}</p>
            </div>
          ))}
        </div>

        <div className="relative flex-1 min-h-[300px] max-h-[450px] rounded-[2rem] overflow-hidden bg-slate-900 shadow-2xl border border-slate-800">
          {face.stream ? (
            <video
              ref={face.videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-6 text-center">
              <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-brand-500 animate-spin mb-4" />
              <p className="text-sm font-medium">Iniciando cámara frontal...</p>
            </div>
          )}
          
          <div className="absolute inset-0 border-4 border-white/10 rounded-[2rem] pointer-events-none" />
          
          {face.stream && !success && (
            <div className="absolute left-1/2 -translate-x-1/2 w-2/3 h-0.5 bg-brand-400 shadow-glow animate-scan rounded-full" />
          )}

          <div className="absolute bottom-4 left-0 right-0 text-center px-4">
            <div className="inline-block bg-black/60 backdrop-blur-md rounded-full px-4 py-1.5 border border-white/10">
              <p className="text-[10px] text-white/90">Solo se procesan puntos biométricos</p>
            </div>
          </div>
          
          {success && (
            <div className="absolute inset-0 bg-emerald-500/90 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in z-20">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-xl">
                <FiCheckCircle className="text-5xl text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 text-center">¡Verificado!</h3>
              <p className="text-emerald-50 font-medium text-center px-6 text-lg">{success}</p>
            </div>
          )}
        </div>

        {(error || face.error || geo.error) && !success && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 animate-fade-in">
            <FiAlertCircle className="shrink-0 mt-0.5 text-lg" />
            <span>{error || face.error || geo.error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mt-6 pt-2">
          <button
            type="button"
            disabled={busy || !face.stream || !face.modelsReady || Boolean(success)}
            onClick={() => marcar("entrada")}
            className="rounded-[1.25rem] bg-emerald-500 py-4.5 text-[15px] font-bold text-white hover:bg-emerald-400 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 shadow-lg shadow-emerald-500/20 flex flex-col items-center justify-center gap-1"
          >
            <span>ENTRADA</span>
          </button>
          <button
            type="button"
            disabled={busy || !face.stream || !face.modelsReady || Boolean(success)}
            onClick={() => marcar("salida")}
            className="rounded-[1.25rem] bg-slate-800 border border-slate-700 py-4.5 text-[15px] font-bold text-white hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex flex-col items-center justify-center gap-1"
          >
            <span>SALIDA</span>
          </button>
        </div>
      </main>
      
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[30%] bg-brand-600/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[30%] bg-emerald-600/10 blur-[100px] rounded-full pointer-events-none" />
    </div>
  );
}

