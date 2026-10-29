import { defineConfig, defineRecipe, defineSlotRecipe } from "@pandacss/dev";

const buttonRecipe = defineRecipe({
  className: "button",
  description: "Standard button recipe",
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "md",
    fontWeight: "medium",
    cursor: "pointer",
    transitionProperty: "colors, box-shadow",
    transitionDuration: "fast",
    outline: "none",
    userSelect: "none",
    _focusVisible: {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "accent.default",
      outlineOffset: "2px",
    },
    _disabled: {
      opacity: 0.5,
      cursor: "not-allowed",
      pointerEvents: "none",
    },
  },
  variants: {
    variant: {
      solid: {
        bg: "accent.default",
        color: "accent.fg",
        _hover: { bg: "accent.emphasized" },
      },
      outline: {
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "border.default",
        color: "fg.default",
        bg: "transparent",
        _hover: { bg: "bg.subtle" },
      },
      ghost: {
        bg: "transparent",
        color: "fg.default",
        _hover: { bg: "bg.subtle" },
      },
      subtle: {
        bg: "bg.subtle",
        color: "fg.default",
        _hover: { bg: "bg.muted" },
      },
      danger: {
        bg: "danger.default",
        color: "danger.fg",
        _hover: { bg: "danger.emphasized" },
        _focusVisible: {
          outlineColor: "danger.default",
        },
      },
      success: {
        bg: "success.default",
        color: "success.fg",
        _hover: { bg: "success.emphasized" },
        _focusVisible: {
          outlineColor: "success.default",
        },
      },
    },
    size: {
      xs: { h: "7", px: "2.5", textStyle: "xs", gap: "1.5" },
      sm: { h: "8", px: "3", textStyle: "sm", gap: "2" },
      md: { h: "9", px: "4", textStyle: "sm", gap: "2" },
      lg: { h: "10", px: "5", textStyle: "md", gap: "2.5" },
    },
  },
  defaultVariants: {
    variant: "solid",
    size: "md",
  },
});

const badgeRecipe = defineRecipe({
  className: "badge",
  description: "Standard badge recipe with systematic status intents",
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "full",
    fontWeight: "medium",
    lineHeight: "1",
    whiteSpace: "nowrap",
  },
  variants: {
    variant: {
      solid: {},
      subtle: {
        borderWidth: "1px",
        borderStyle: "solid",
      },
      outline: {
        borderWidth: "1px",
        borderStyle: "solid",
        bg: "transparent",
      },
    },
    intent: {
      default: {},
      success: {},
      danger: {},
      warning: {},
      info: {},
    },
    size: {
      sm: { px: "2", py: "1", textStyle: "xs" },
      md: { px: "2.5", py: "1", textStyle: "sm" },
    },
  },
  compoundVariants: [
    // solid variants
    {
      variant: "solid",
      intent: "default",
      css: {
        bg: "accent.default",
        color: "accent.fg",
      },
    },
    {
      variant: "solid",
      intent: "success",
      css: {
        bg: "success.default",
        color: "success.fg",
      },
    },
    {
      variant: "solid",
      intent: "danger",
      css: {
        bg: "danger.default",
        color: "danger.fg",
      },
    },
    {
      variant: "solid",
      intent: "warning",
      css: {
        bg: "warning.default",
        color: "warning.fg",
      },
    },
    {
      variant: "solid",
      intent: "info",
      css: {
        bg: "info.default",
        color: "info.fg",
      },
    },
    // subtle variants
    {
      variant: "subtle",
      intent: "default",
      css: {
        bg: "bg.subtle",
        color: "fg.default",
        borderColor: "border.subtle",
      },
    },
    {
      variant: "subtle",
      intent: "success",
      css: {
        bg: "success.subtle",
        color: "success.text",
        borderColor: "success.border",
      },
    },
    {
      variant: "subtle",
      intent: "danger",
      css: {
        bg: "danger.subtle",
        color: "danger.text",
        borderColor: "danger.border",
      },
    },
    {
      variant: "subtle",
      intent: "warning",
      css: {
        bg: "warning.subtle",
        color: "warning.text",
        borderColor: "warning.border",
      },
    },
    {
      variant: "subtle",
      intent: "info",
      css: {
        bg: "info.subtle",
        color: "info.text",
        borderColor: "info.border",
      },
    },
    // outline variants
    {
      variant: "outline",
      intent: "default",
      css: {
        borderColor: "border.default",
        color: "fg.default",
      },
    },
    {
      variant: "outline",
      intent: "success",
      css: {
        borderColor: "success.border",
        color: "success.text",
      },
    },
    {
      variant: "outline",
      intent: "danger",
      css: {
        borderColor: "danger.border",
        color: "danger.text",
      },
    },
    {
      variant: "outline",
      intent: "warning",
      css: {
        borderColor: "warning.border",
        color: "warning.text",
      },
    },
    {
      variant: "outline",
      intent: "info",
      css: {
        borderColor: "info.border",
        color: "info.text",
      },
    },
  ],
  defaultVariants: {
    variant: "subtle",
    intent: "default",
    size: "sm",
  },
});

const textRecipe = defineRecipe({
  className: "text",
  description: "Canonical typography recipe",
  base: {
    color: "fg.default",
  },
  variants: {
    variant: {
      heading: {
        fontWeight: "bold",
        letterSpacing: "tight",
        lineHeight: "tight",
      },
      body: {
        fontWeight: "normal",
        lineHeight: "relaxed",
      },
      code: {
        fontFamily: "mono",
        bg: "bg.subtle",
        borderRadius: "sm",
        px: "1.5",
        py: "0.5",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "border.subtle",
      },
    },
    size: {
      xs: { textStyle: "xs" },
      sm: { textStyle: "sm" },
      md: { textStyle: "md" },
      lg: { textStyle: "lg" },
      xl: { textStyle: "xl" },
      "2xl": { textStyle: "2xl" },
      "3xl": { textStyle: "3xl" },
    },
  },
  defaultVariants: {
    variant: "body",
    size: "md",
  },
});

const cardSlotRecipe = defineSlotRecipe({
  className: "card",
  description: "Card component slot recipe",
  slots: ["root", "header", "title", "description", "body", "footer"],
  base: {
    root: {
      display: "flex",
      flexDirection: "column",
      gap: "6",
      p: "6",
      borderRadius: "l3",
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: "border.subtle",
      bg: "bg.default",
      boxShadow: "sm",
    },
    header: {
      display: "flex",
      flexDirection: "column",
      gap: "1.5",
      w: "full",
    },
    title: {
      textStyle: "lg",
      fontWeight: "semibold",
      letterSpacing: "tight",
      color: "fg.default",
    },
    description: {
      textStyle: "sm",
      color: "fg.muted",
      lineHeight: "relaxed",
    },
    body: {
      display: "flex",
      flexDirection: "column",
      gap: "4",
      w: "full",
    },
    footer: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: "3",
      w: "full",
    },
  },
});

const dialogSlotRecipe = defineSlotRecipe({
  className: "dialog",
  description: "Dialog component slot recipe",
  slots: ["backdrop", "positioner", "content", "title", "description", "closeTrigger"],
  base: {
    backdrop: {
      position: "fixed",
      inset: "0",
      zIndex: "overlay",
      backdropBlur: "sm",
      bg: "bg.backdrop",
    },
    positioner: {
      position: "fixed",
      inset: "0",
      zIndex: "modal",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      p: { base: "4", sm: "6" },
      overflowY: "auto",
    },
    content: {
      position: "relative",
      w: "full",
      maxW: "md",
      bg: "bg.default",
      p: "6",
      borderRadius: "l3",
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: "border.subtle",
      boxShadow: "xl",
      display: "flex",
      flexDirection: "column",
      gap: "5",
      color: "fg.default",
    },
    title: {
      textStyle: "lg",
      fontWeight: "semibold",
      color: "fg.default",
      lineHeight: "snug",
      letterSpacing: "tight",
    },
    description: {
      textStyle: "sm",
      color: "fg.muted",
      lineHeight: "relaxed",
    },
    closeTrigger: {
      position: "absolute",
      top: "4",
      right: "4",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      w: "7",
      h: "7",
      borderRadius: "md",
      color: "fg.muted",
      cursor: "pointer",
      outline: "none",
      border: "none",
      bg: "transparent",
      transitionProperty: "colors",
      transitionDuration: "fast",
      _hover: { color: "fg.default", bg: "bg.subtle" },
      _focusVisible: {
        outlineWidth: "2px",
        outlineStyle: "solid",
        outlineColor: "accent.default",
        outlineOffset: "2px",
      },
    },
  },
});

export default defineConfig({
  preflight: true,
  strictTokens: true,
  strictPropertyValues: true,
  presets: ["@pandacss/preset-base", "@pandacss/preset-panda"],
  theme: {
    extend: {
      recipes: {
        button: buttonRecipe,
        badge: badgeRecipe,
        text: textRecipe,
      },
      slotRecipes: {
        card: cardSlotRecipe,
        dialog: dialogSlotRecipe,
      },
      tokens: {
        sizes: {
          full: { value: "100%" },
          screen: { value: "100vw" },
          "100vh": { value: "100vh" },
          "100dvh": { value: "100dvh" },
        },
        radii: {
          l1: { value: "0.25rem" },
          l2: { value: "0.5rem" },
          l3: { value: "0.75rem" },
        },
        zIndex: {
          hide: { value: "-1" },
          base: { value: "0" },
          docked: { value: "10" },
          dropdown: { value: "1000" },
          sticky: { value: "1100" },
          banner: { value: "1200" },
          overlay: { value: "1300" },
          modal: { value: "1400" },
          popover: { value: "1500" },
          toast: { value: "1600" },
          tooltip: { value: "1700" },
          max: { value: "9999" },
        },
      },
      semanticTokens: {
        colors: {
          bg: {
            canvas: {
              value: {
                base: "{colors.slate.50}",
                _dark: "{colors.slate.950}",
              },
            },
            default: {
              value: {
                base: "{colors.white}",
                _dark: "{colors.slate.900}",
              },
            },
            subtle: {
              value: {
                base: "{colors.slate.100}",
                _dark: "{colors.slate.800}",
              },
            },
            muted: {
              value: {
                base: "{colors.slate.200}",
                _dark: "{colors.slate.700}",
              },
            },
            backdrop: {
              value: {
                base: "rgba(0, 0, 0, 0.5)",
                _dark: "rgba(0, 0, 0, 0.75)",
              },
            },
          },
          fg: {
            default: {
              value: {
                base: "{colors.slate.900}",
                _dark: "{colors.slate.100}",
              },
            },
            muted: {
              value: {
                base: "{colors.slate.600}",
                _dark: "{colors.slate.400}",
              },
            },
            subtle: {
              value: {
                base: "{colors.slate.400}",
                _dark: "{colors.slate.500}",
              },
            },
          },
          border: {
            default: {
              value: {
                base: "{colors.slate.300}",
                _dark: "{colors.slate.700}",
              },
            },
            subtle: {
              value: {
                base: "{colors.slate.200}",
                _dark: "{colors.slate.800}",
              },
            },
          },
          accent: {
            default: {
              value: {
                base: "{colors.slate.900}",
                _dark: "{colors.slate.100}",
              },
            },
            emphasized: {
              value: {
                base: "{colors.slate.800}",
                _dark: "{colors.slate.200}",
              },
            },
            fg: {
              value: {
                base: "{colors.white}",
                _dark: "{colors.slate.950}",
              },
            },
          },
          // Systematic Status Semantic Tokens
          success: {
            default: {
              value: {
                base: "{colors.emerald.600}",
                _dark: "{colors.emerald.500}",
              },
            },
            emphasized: {
              value: {
                base: "{colors.emerald.700}",
                _dark: "{colors.emerald.400}",
              },
            },
            subtle: {
              value: {
                base: "{colors.emerald.50}",
                _dark: "{colors.emerald.950}",
              },
            },
            fg: {
              value: {
                base: "{colors.white}",
                _dark: "{colors.emerald.950}",
              },
            },
            border: {
              value: {
                base: "{colors.emerald.300}",
                _dark: "{colors.emerald.800}",
              },
            },
            text: {
              value: {
                base: "{colors.emerald.700}",
                _dark: "{colors.emerald.300}",
              },
            },
          },
          danger: {
            default: {
              value: {
                base: "{colors.red.600}",
                _dark: "{colors.red.500}",
              },
            },
            emphasized: {
              value: {
                base: "{colors.red.700}",
                _dark: "{colors.red.400}",
              },
            },
            subtle: {
              value: {
                base: "{colors.red.50}",
                _dark: "{colors.red.950}",
              },
            },
            fg: {
              value: {
                base: "{colors.white}",
                _dark: "{colors.red.950}",
              },
            },
            border: {
              value: {
                base: "{colors.red.300}",
                _dark: "{colors.red.800}",
              },
            },
            text: {
              value: {
                base: "{colors.red.700}",
                _dark: "{colors.red.300}",
              },
            },
          },
          error: {
            default: {
              value: {
                base: "{colors.red.600}",
                _dark: "{colors.red.500}",
              },
            },
            emphasized: {
              value: {
                base: "{colors.red.700}",
                _dark: "{colors.red.400}",
              },
            },
            subtle: {
              value: {
                base: "{colors.red.50}",
                _dark: "{colors.red.950}",
              },
            },
            fg: {
              value: {
                base: "{colors.white}",
                _dark: "{colors.red.950}",
              },
            },
            border: {
              value: {
                base: "{colors.red.300}",
                _dark: "{colors.red.800}",
              },
            },
            text: {
              value: {
                base: "{colors.red.700}",
                _dark: "{colors.red.300}",
              },
            },
          },
          warning: {
            default: {
              value: {
                base: "{colors.amber.500}",
                _dark: "{colors.amber.400}",
              },
            },
            emphasized: {
              value: {
                base: "{colors.amber.600}",
                _dark: "{colors.amber.300}",
              },
            },
            subtle: {
              value: {
                base: "{colors.amber.50}",
                _dark: "{colors.amber.950}",
              },
            },
            fg: {
              value: {
                base: "{colors.white}",
                _dark: "{colors.amber.950}",
              },
            },
            border: {
              value: {
                base: "{colors.amber.300}",
                _dark: "{colors.amber.800}",
              },
            },
            text: {
              value: {
                base: "{colors.amber.800}",
                _dark: "{colors.amber.300}",
              },
            },
          },
          info: {
            default: {
              value: {
                base: "{colors.sky.600}",
                _dark: "{colors.sky.500}",
              },
            },
            emphasized: {
              value: {
                base: "{colors.sky.700}",
                _dark: "{colors.sky.400}",
              },
            },
            subtle: {
              value: {
                base: "{colors.sky.50}",
                _dark: "{colors.sky.950}",
              },
            },
            fg: {
              value: {
                base: "{colors.white}",
                _dark: "{colors.sky.950}",
              },
            },
            border: {
              value: {
                base: "{colors.sky.300}",
                _dark: "{colors.sky.800}",
              },
            },
            text: {
              value: {
                base: "{colors.sky.700}",
                _dark: "{colors.sky.300}",
              },
            },
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
