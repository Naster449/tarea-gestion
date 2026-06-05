import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  // GitHub Pages (project pages) suele servir en: /<repo-name>/
  // Por eso dejamos que el workflow inyecte VITE_BASE_URL.
  base: mode === "production" ? process.env.VITE_BASE_URL || "/" : "/",
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:4000", changeOrigin: true },
      "/uploads": { target: "http://localhost:4000", changeOrigin: true },
    },
  },
}));

