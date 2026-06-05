import api from "./api.js";

export async function downloadReport(url) {
  const res = await api.get(url, { responseType: "blob" });
  return res.data;
}
