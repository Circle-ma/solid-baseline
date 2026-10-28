import { fileURLToPath, URL } from "node:url";
import pandacss from "@pandacss/vite";
import solid from "@solidjs/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    pandacss(),
    solid({
      start: true,
      // Default is client-rendered SPA onto a prerendered static document shell.
      // Set `ssr: true` to enable streaming server-side rendering with zero config changes.
      ssr: false,
    }),
  ],
  resolve: {
    alias: {
      "solid-js/web": "@solidjs/web",
      "styled-system": fileURLToPath(new URL("./styled-system", import.meta.url)),
      "~": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 3000,
    strictPort: false,
  },
  build: {
    target: "esnext",
  },
});
