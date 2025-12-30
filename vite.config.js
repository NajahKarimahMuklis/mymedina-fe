// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // Semua request yang mulai dengan /api akan otomatis diteruskan ke backend
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: process.env.PORT || 4173,
    host: "0.0.0.0",
    allowedHosts: [
      "mymedina-fe-production.up.railway.app",
      ".railway.app", // Allow all Railway subdomains
      "localhost",
    ],
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
});
