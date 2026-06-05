import { useCallback, useEffect, useRef, useState } from "react";
import { extractFaceDescriptor, initFaceApi } from "../utils/faceApi.js";

export function useFaceRecognition() {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    initFaceApi()
      .then(() => {
        if (!cancelled) setModelsReady(true);
      })
      .catch((e) => {
        if (!cancelled) setError(`Error al cargar modelos faciales: ${e.message}`);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const startCamera = useCallback(async () => {
    setError("");
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      setStream(media);
      return media;
    } catch {
      setError("No se pudo acceder a la cámara. Permite el acceso en tu navegador.");
      return null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    setStream((prev) => {
      prev?.getTracks().forEach((t) => t.stop());
      return null;
    });
  }, []);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const captureDescriptor = useCallback(async () => {
    if (!videoRef.current || !modelsReady) {
      throw new Error("Cámara o modelos no listos");
    }
    setLoading(true);
    setError("");
    try {
      return await extractFaceDescriptor(videoRef.current);
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [modelsReady]);

  return {
    videoRef,
    stream,
    loading,
    modelsReady,
    error,
    setError,
    startCamera,
    stopCamera,
    captureDescriptor,
  };
}
