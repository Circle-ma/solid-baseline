import { fileURLToPath, URL } from "node:url";
import pandacss from "@pandacss/vite";
import solid from "@solidjs/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    pandacss(),
    solid({
      start: true,
      /**
       * In dev mode, Solid 2.0 enables strict Reactivity Diagnostics by default.
       * Third-party component libraries written for Solid 1.x (such as Ark UI / Zag.js)
       * evaluate props during initial component setup, emitting [STRICT_READ_UNTRACKED]
       * notices in the dev console.
       *
       * Setting `dev: false` serves the optimized production build under `vite dev`,
       * providing a 100% clean, silent console while preserving instant Vite HMR.
       * Set `dev: true` (or omit) when actively debugging reactive graph issues in application code.
       */
      dev: false,
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
    // SpacetimeDB default server port is 3000. strictPort: false allows Vite
    // to automatically fall back to 3001 if SpacetimeDB is running locally.
    strictPort: false,
  },
  build: {
    target: "esnext",
    assetsInlineLimit: 0,
    rolldownOptions: {
      checks: {
        invalidAnnotation: false,
      },
    },
  },
});
