import api from "./api.js";

export function listEmpleados(params) {
  return api.get("/empleados", { params }).then((r) => r.data);
}

export function getEmpleado(id) {
  return api.get(`/empleados/${id}`).then((r) => r.data);
}

export function createEmpleado(form, fotoFile, facialFotoFile) {
  const fd = new FormData();
  Object.entries(form).forEach(([k, v]) => {
    if (v !== undefined && v !== null) {
      fd.append(k, Array.isArray(v) ? JSON.stringify(v) : v);
    }
  });
  if (fotoFile) fd.append("foto", fotoFile);
  if (facialFotoFile) fd.append("facialFoto", facialFotoFile);
  return api
    .post("/empleados", fd, { headers: { "Content-Type": "multipart/form-data" } })
    .then((r) => r.data);
}

export function updateEmpleado(id, form, fotoFile, facialFotoFile) {
  const fd = new FormData();
  Object.entries(form).forEach(([k, v]) => {
    if (v !== undefined && v !== null) {
      fd.append(k, Array.isArray(v) ? JSON.stringify(v) : v);
    }
  });
  if (fotoFile) fd.append("foto", fotoFile);
  if (facialFotoFile) fd.append("facialFoto", facialFotoFile);
  return api
    .put(`/empleados/${id}`, fd, { headers: { "Content-Type": "multipart/form-data" } })
    .then((r) => r.data);
}

export function deleteEmpleado(id) {
  return api.delete(`/empleados/${id}`);
}

export function registerFacialDescriptor(id, faceDescriptor) {
  return api
    .post(`/empleados/${id}/facial-descriptor`, { faceDescriptor })
    .then((r) => r.data);
}
