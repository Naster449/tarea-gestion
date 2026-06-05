/** Umbral euclidiano para face-api.js (128D descriptor). Valores menores = más estricto. */
export const FACIAL_MATCH_THRESHOLD = 0.6;

export function euclideanDistance(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length === 0) {
    return Infinity;
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

export function compareDescriptors(stored, captured) {
  const distance = euclideanDistance(stored, captured);
  return {
    match: distance < FACIAL_MATCH_THRESHOLD,
    distance: Math.round(distance * 1000) / 1000,
  };
}
