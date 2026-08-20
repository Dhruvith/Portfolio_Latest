import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  envDir: fileURLToPath(new URL("..", import.meta.url)),
  plugins: [react()],
  build: {
    outDir: fileURLToPath(new URL("../dist/admin", import.meta.url)),
    emptyOutDir: true,
  },
  server: {
    host: "127.0.0.1",
    port: 4180,
    strictPort: true,
    cors: false,
    allowedHosts: ["admin.localhost", "localhost"],
  },
});
