import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Tauri WebView dev server (1420) — 웹 데모는 5173 기본 사용 가능.
// CI / 로컬 모두 통과하도록 strictPort 끔.
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    outDir: "dist",
    target: "es2022",
    sourcemap: true,
    emptyOutDir: true,
  },
});
