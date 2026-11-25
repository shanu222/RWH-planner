import { defineConfig } from "vite";
import { resolve } from "node:path";
export default defineConfig({
  server: { port: 5173 },
  build: {
    outDir: "dist", target: "es2020",
    rollupOptions: { input: { main: resolve(import.meta.dirname, "index.html"), admin: resolve(import.meta.dirname, "admin.html") } },
  },
});
