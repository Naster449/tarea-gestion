import api from "./api.js";

export const getAreas = () => api.get("/catalogos/areas").then((r) => r.data);
export const getCargos = (areaId) =>
  api.get("/catalogos/cargos", { params: { areaId } }).then((r) => r.data);
export const getAdmins = () => api.get("/catalogos/admins").then((r) => r.data);
