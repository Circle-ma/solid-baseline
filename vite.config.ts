import { fileURLToPath, URL } from "node:url";
import pandacss from "@pandacss/vite";
import solid from "@solidjs/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    pandacss(),
    solid({
      start: true,
      // Client-rendered SPA mounted onto a prerendered static Document shell (`ssr: false`).
      // Full SSR is intentionally not enabled by default: enabling `ssr: true` requires supplying
      // an absolute server-side origin to `<RpcProvider baseUrl={...}>` (instead of the client
      // same-origin relative path) and reading the `theme` cookie on the server to match `<html class="dark">`.
      ssr: false,
      diagnostics: true,
    }),
  ],
  resolve: {
    alias: {
      "styled-system": fileURLToPath(new URL("./styled-system", import.meta.url)),
      "~": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 3000,
    strictPort: false,
    proxy: {
      "/system.v1.SystemService": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/healthz": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/readyz": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  build: {
    target: "esnext",
  },
});
