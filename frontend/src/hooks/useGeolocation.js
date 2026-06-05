import { useCallback, useEffect, useState } from "react";

export function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Tu navegador no soporta geolocalización.");
      return Promise.reject(new Error("Geolocalización no disponible"));
    }

    setLoading(true);
    setError("");

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            latitud: pos.coords.latitude,
            longitud: pos.coords.longitude,
            precision: pos.coords.accuracy,
          };
          setPosition(coords);
          setLoading(false);
          resolve(coords);
        },
        (err) => {
          const msg =
            err.code === 1
              ? "Permiso de ubicación denegado. Actívalo para marcar asistencia."
              : err.code === 2
                ? "No se pudo determinar tu ubicación."
                : "Tiempo de espera agotado al obtener GPS.";
          setError(msg);
          setLoading(false);
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  }, []);

  useEffect(() => {
    requestLocation().catch(() => {});
  }, [requestLocation]);

  return { position, error, loading, requestLocation };
}
