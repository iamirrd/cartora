import { defineConfig } from "vite";

// Browser requests stay on the frontend origin; Vite forwards them to Django.
export default defineConfig({
  server: {
    proxy: {
      "/api": "http://127.0.0.1:8000",
      "/media": "http://127.0.0.1:8000",
    },
  },
});
