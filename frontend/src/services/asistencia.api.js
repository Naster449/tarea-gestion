import api from "./api.js";

export const entrada = (body) => api.post("/asistencia/entrada", body).then((r) => r.data);
export const salida = (body) => api.post("/asistencia/salida", body).then((r) => r.data);
export const entradaAutomatica = (body) => api.post("/asistencia/entrada-automatica", body).then((r) => r.data);
export const salidaAutomatica = (body) => api.post("/asistencia/salida-automatica", body).then((r) => r.data);
export const ausencia = (body) => api.post("/asistencia/ausencia", body).then((r) => r.data);
export const listAsistencia = (params) => api.get("/asistencia", { params }).then((r) => r.data);
export const resumenAsistencia = () => api.get("/asistencia/resumen").then((r) => r.data);
export const miSede = () => api.get("/asistencia/mi-sede").then((r) => r.data);
