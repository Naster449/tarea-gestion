import api from "./api.js";

export const listSedes = () => api.get("/sedes").then((r) => r.data);
export const getSede = (id) => api.get(`/sedes/${id}`).then((r) => r.data);
export const createSede = (body) => api.post("/sedes", body).then((r) => r.data);
export const updateSede = (id, body) => api.put(`/sedes/${id}`, body).then((r) => r.data);
export const deleteSede = (id) => api.delete(`/sedes/${id}`);

export const listAuditoria = (params) => api.get("/auditoria", { params }).then((r) => r.data);
