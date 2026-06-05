const FACE_API_CDN =
  "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.14/dist/face-api.esm.js";
const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.14/model";

let faceapi = null;
let loadPromise = null;

export async function initFaceApi() {
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const mod = await import(/* @vite-ignore */ FACE_API_CDN);
      faceapi = mod.default || mod;
    } catch {
      const mod = await import("@vladmandic/face-api");
      faceapi = mod.default || mod;
    }
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    return faceapi;
  })();

  return loadPromise;
}

/** Extrae descriptor biométrico 128D del video — no almacena imágenes. */
export async function extractFaceDescriptor(videoEl) {
  const api = await initFaceApi();
  const detection = await api
    .detectSingleFace(videoEl, new api.SsdMobilenetv1Options({ minConfidence: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    throw new Error("No se detectó un rostro. Ubica tu cara frente a la cámara con buena iluminación.");
  }
  return Array.from(detection.descriptor);
}

export function isFaceApiReady() {
  return Boolean(faceapi);
}
