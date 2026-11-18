import solidV2Strict from "eslint-plugin-solid/configs/v2-strict";
import { defineConfig } from "oxlint";

export default defineConfig({
  jsPlugins: ["eslint-plugin-solid"],
  ignorePatterns: ["**/*.gen.*", "dist", "styled-system", "src/module_bindings"],
  settings: solidV2Strict.settings,
  rules: solidV2Strict.rules,
});
