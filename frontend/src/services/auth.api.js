import api from "./api.js";

export function login(body) {
  return api.post("/auth/login", body).then((r) => r.data);
}

export function register(body) {
  return api.post("/auth/register", body).then((r) => r.data);
}

export function me() {
  return api.get("/auth/me").then((r) => r.data);
}
