import type {
  ColorToken,
  FontSizeToken,
  FontWeightToken,
  LetterSpacingToken,
  LineHeightToken,
  RadiusToken,
  ShadowToken,
  SizeToken,
  SpacingToken,
  ZIndexToken,
} from "styled-system/types/tokens";

export type {
  ColorToken,
  FontSizeToken,
  FontWeightToken,
  LetterSpacingToken,
  LineHeightToken,
  RadiusToken,
  ShadowToken,
  SizeToken,
  SpacingToken,
  ZIndexToken,
};

/**
 * Standard 4px / 8px Spacing Grid Rail
 * Pre-approved layout rhythms for gap and padding.
 */
export const SPACING_SCALE = [
  "0",
  "1", // 4px
  "1.5", // 6px
  "2", // 8px
  "2.5", // 10px
  "3", // 12px
  "4", // 16px
  "5", // 20px
  "6", // 24px
  "8", // 32px
  "10", // 40px
  "12", // 48px
  "16", // 64px
  "20", // 80px
] as const;

/**
 * Canonical Semantic Surfaces
 */
export const SURFACES = {
  canvas: "bg.canvas",
  default: "bg.default",
  subtle: "bg.subtle",
  muted: "bg.muted",
  backdrop: "bg.backdrop",
} as const;

/**
 * Canonical Semantic Foregrounds
 */
export const FOREGROUNDS = {
  default: "fg.default",
  muted: "fg.muted",
  subtle: "fg.subtle",
} as const;

/**
 * Canonical Semantic Borders
 */
export const BORDERS = {
  subtle: "border.subtle",
  default: "border.default",
} as const;

/**
 * Canonical Semantic Accents
 */
export const ACCENTS = {
  default: "accent.default",
  emphasized: "accent.emphasized",
  fg: "accent.fg",
} as const;

/**
 * Systematic Status & Feedback Color Tokens
 * Always use these tokens for operational states, alerts, badges, and telemetry.
 * Never invent raw hex codes or alpha strings.
 */
export const STATUS = {
  success: {
    default: "success.default",
    emphasized: "success.emphasized",
    subtle: "success.subtle",
    fg: "success.fg",
    border: "success.border",
    text: "success.text",
  },
  danger: {
    default: "danger.default",
    emphasized: "danger.emphasized",
    subtle: "danger.subtle",
    fg: "danger.fg",
    border: "danger.border",
    text: "danger.text",
  },
  warning: {
    default: "warning.default",
    emphasized: "warning.emphasized",
    subtle: "warning.subtle",
    fg: "warning.fg",
    border: "warning.border",
    text: "warning.text",
  },
  info: {
    default: "info.default",
    emphasized: "info.emphasized",
    subtle: "info.subtle",
    fg: "info.fg",
    border: "info.border",
    text: "info.text",
  },
} as const;

/**
 * Closed-World Stacking Context (Z-Index) Scale
 * Every layer in the UI must bind to this hierarchy.
 * Arbitrary magic z-index numbers (e.g. 50, 60, 9999) are strictly forbidden.
 */
export const Z_INDEX = {
  hide: "hide", // -1
  base: "base", // 0
  docked: "docked", // 10
  dropdown: "dropdown", // 1000
  sticky: "sticky", // 1100
  banner: "banner", // 1200
  overlay: "overlay", // 1300
  modal: "modal", // 1400
  popover: "popover", // 1500
  toast: "toast", // 1600
  tooltip: "tooltip", // 1700
  max: "max", // 9999
} as const;
