import api from "./api.js";

export const listPlanillas = (params) => api.get("/planillas", { params }).then((r) => r.data);
export const createPlanilla = (body) => api.post("/planillas", body).then((r) => r.data);

export async function downloadBoleta(id) {
  const res = await api.get(`/planillas/${id}/boleta`, { responseType: "blob" });
  return res.data;
}
