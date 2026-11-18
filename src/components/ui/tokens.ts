import type {
  ColorToken,
  RadiusToken,
  ShadowToken,
  SpacingToken,
  ZIndexToken,
} from "styled-system/types/tokens";

/**
 * Closed-World Design System Token Types
 * Derived directly from Panda CSS generated token unions (`styled-system/types/tokens`).
 * Pure compile-time types — zero runtime dictionary overhead.
 */

export type SpacingRailToken = Extract<
  SpacingToken,
  "0" | "1" | "1.5" | "2" | "2.5" | "3" | "4" | "5" | "6" | "8" | "10" | "12" | "16" | "20"
>;

export type SurfaceToken = Extract<ColorToken, "transparent" | `bg.${string}` | `${string}.subtle`>;

export type ForegroundToken = Extract<
  ColorToken,
  `fg.${string}` | `accent.${string}` | `${string}.text`
>;

export type BorderColorToken = Extract<ColorToken, `border.${string}` | `${string}.border`>;

export type RadiusRailToken = RadiusToken;

export type ZIndexRailToken = ZIndexToken;

export type ShadowRailToken = ShadowToken;
