import { defineConfig } from "@pandacss/dev";
import { createPreset } from "@park-ui/panda-preset";
import neutral from "@park-ui/panda-preset/colors/neutral";
import slate from "@park-ui/panda-preset/colors/slate";

export default defineConfig({
  preflight: true,
  strictTokens: true,
  strictPropertyValues: true,
  presets: [
    "@pandacss/preset-base",
    "@pandacss/preset-panda",
    createPreset({
      accentColor: neutral,
      grayColor: slate,
      radius: "md",
    }),
  ],
  theme: {
    extend: {
      semanticTokens: {
        colors: {
          accent: {
            default: { value: "{colors.neutral.default}" },
            emphasized: { value: "{colors.neutral.emphasized}" },
            fg: { value: "{colors.neutral.fg}" },
            text: { value: "{colors.neutral.text}" },
          },
        },
      },
    },
  },
  include: ["./src/**/*.{ts,tsx}"],
  exclude: [],
  jsxFramework: "solid",
  outdir: "styled-system",
});
