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

export type SpacingRailToken = Exclude<SpacingToken, `-${string}`>;

export type SurfaceToken = Extract<ColorToken, "transparent" | `bg.${string}` | `${string}.subtle`>;

export type ForegroundToken = Extract<
  ColorToken,
  `fg.${string}` | `accent.${string}` | `${string}.text`
>;

export type BorderColorToken = Extract<ColorToken, `border.${string}` | `${string}.border`>;

export type RadiusRailToken = Extract<RadiusToken, "none" | "l1" | "l2" | "l3" | "full">;

export type ZIndexRailToken = ZIndexToken;

export type ShadowRailToken = Extract<ShadowToken, "card" | "elevated" | "modal">;
