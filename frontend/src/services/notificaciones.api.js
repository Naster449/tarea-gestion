import api from "./api.js";

export const listNotificaciones = (params) =>
  api.get("/notificaciones", { params }).then((r) => r.data);

export const marcarLeida = (id) =>
  api.patch(`/notificaciones/${id}/leida`).then((r) => r.data);
