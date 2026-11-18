import { fileURLToPath, URL } from "node:url";
import solid from "@solidjs/vite-plugin";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    solid({
      diagnostics: true,
    }),
  ],
  resolve: {
    conditions: ["browser", "development"],
    alias: {
      "solid-js/web": "@solidjs/web",
      "styled-system": fileURLToPath(new URL("./styled-system", import.meta.url)),
      "~": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "happy-dom",
    globals: true,
    server: {
      deps: {
        inline: true,
      },
    },
  },
});
