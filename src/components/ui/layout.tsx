import type { ComponentProps, ParentComponent } from "solid-js";
import { omit } from "solid-js";
import { css, cx } from "styled-system/css";
import { box, container, divider, grid, hstack, vstack } from "styled-system/patterns";
import type { ColorToken, RadiusToken, SizeToken, SpacingToken } from "./tokens";

/**
 * Box Container Primitive
 * High-performance layout wrapper for background, padding, and viewport boundaries.
 * Strictly bounded by design tokens (Zero Hex Colors & Zero Magic Numbers).
 */
export interface BoxProps extends ComponentProps<"div"> {
  minH?: SizeToken | "100vh" | "100dvh" | "screen" | "full";
  minW?: SizeToken | "full" | "auto";
  w?: SizeToken | "full" | "auto";
  h?: SizeToken | "full" | "auto";
  bg?: ColorToken;
  color?: ColorToken;
  p?: SpacingToken;
  px?: SpacingToken;
  py?: SpacingToken;
  borderRadius?: RadiusToken;
}

export const Box: ParentComponent<BoxProps> = (props) => {
  const rest = omit(
    props,
    "minH",
    "minW",
    "w",
    "h",
    "bg",
    "color",
    "p",
    "px",
    "py",
    "borderRadius",
    "class",
    "children",
  );
  return (
    <div
      {...rest}
      class={cx(
        box({
          minH: props.minH as any,
          minW: props.minW as any,
          w: props.w as any,
          h: props.h as any,
          bg: props.bg as any,
          color: props.color as any,
          p: props.p as any,
          px: props.px as any,
          py: props.py as any,
        }),
        css({
          boxSizing: "border-box",
          borderRadius: props.borderRadius as any,
        }),
        props.class as string,
      )}
    >
      {props.children}
    </div>
  );
};

/**
 * Container Layout Primitive
 * Constrains content width horizontally with responsive side paddings.
 * Strictly bounded by design tokens.
 */
export interface ContainerProps extends ComponentProps<"div"> {
  maxW?: SizeToken;
  p?: SpacingToken;
  px?: SpacingToken;
  py?: SpacingToken;
}

export const Container: ParentComponent<ContainerProps> = (props) => {
  const rest = omit(props, "maxW", "p", "px", "py", "class", "children");
  return (
    <div
      {...rest}
      class={cx(
        container({
          maxW: props.maxW as any,
          p: props.p as any,
          px: props.px as any,
          py: props.py as any,
        }),
        css({
          w: "full",
        }),
        props.class as string,
      )}
    >
      {props.children}
    </div>
  );
};

/**
 * VStack Layout Primitive
 * Flexbox vertical column layout strictly governed by `gap` and alignment.
 * Margin is completely forbidden.
 * Strictly bounded by design tokens.
 */
export interface VStackProps extends ComponentProps<"div"> {
  gap?: SpacingToken;
  alignItems?: "stretch" | "center" | "flex-start" | "flex-end" | "baseline";
  justifyContent?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around";
  maxH?: SizeToken;
  overflowY?: "auto" | "hidden" | "scroll" | "visible";
  borderWidth?: "1px";
  borderStyle?: "solid";
  borderColor?: ColorToken;
  borderRadius?: RadiusToken;
  p?: SpacingToken;
  px?: SpacingToken;
  py?: SpacingToken;
  bg?: ColorToken;
  w?: SizeToken | "full" | "auto";
}

export const VStack: ParentComponent<VStackProps> = (props) => {
  const rest = omit(
    props,
    "gap",
    "alignItems",
    "justifyContent",
    "maxH",
    "overflowY",
    "borderWidth",
    "borderStyle",
    "borderColor",
    "borderRadius",
    "p",
    "px",
    "py",
    "bg",
    "w",
    "class",
    "children",
  );
  return (
    <div
      {...rest}
      class={cx(
        vstack({
          gap: (props.gap ?? "4") as any,
          alignItems: (props.alignItems ?? "stretch") as any,
          justify: props.justifyContent as any,
        }),
        css({
          maxH: props.maxH as any,
          overflowY: props.overflowY as any,
          borderWidth: props.borderWidth as any,
          borderStyle: props.borderStyle as any,
          borderColor: props.borderColor as any,
          borderRadius: props.borderRadius as any,
          p: props.p as any,
          px: props.px as any,
          py: props.py as any,
          bg: props.bg as any,
          w: props.w as any,
        }),
        props.class as string,
      )}
    >
      {props.children}
    </div>
  );
};

/**
 * HStack Layout Primitive
 * Flexbox horizontal row layout strictly governed by `gap` and alignment.
 * Margin is completely forbidden.
 * Strictly bounded by design tokens.
 */
export interface HStackProps extends ComponentProps<"div"> {
  gap?: SpacingToken;
  alignItems?: "stretch" | "center" | "flex-start" | "flex-end" | "baseline";
  justifyContent?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around";
  p?: SpacingToken;
  px?: SpacingToken;
  py?: SpacingToken;
  bg?: ColorToken;
  borderRadius?: RadiusToken;
  borderWidth?: "1px";
  borderStyle?: "solid";
  borderColor?: ColorToken;
  w?: SizeToken | "full" | "auto";
}

export const HStack: ParentComponent<HStackProps> = (props) => {
  const rest = omit(
    props,
    "gap",
    "alignItems",
    "justifyContent",
    "p",
    "px",
    "py",
    "bg",
    "borderRadius",
    "borderWidth",
    "borderStyle",
    "borderColor",
    "w",
    "class",
    "children",
  );
  return (
    <div
      {...rest}
      class={cx(
        hstack({
          gap: (props.gap ?? "3") as any,
          alignItems: (props.alignItems ?? "center") as any,
          justify: props.justifyContent as any,
        }),
        css({
          p: props.p as any,
          px: props.px as any,
          py: props.py as any,
          bg: props.bg as any,
          borderRadius: props.borderRadius as any,
          borderWidth: props.borderWidth as any,
          borderStyle: props.borderStyle as any,
          borderColor: props.borderColor as any,
          w: props.w as any,
        }),
        props.class as string,
      )}
    >
      {props.children}
    </div>
  );
};

/**
 * Grid Layout Primitive
 * CSS Grid layout strictly governed by `columns` and `gap`.
 * Strictly bounded by design tokens.
 */
export interface GridProps extends ComponentProps<"div"> {
  columns?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  gap?: SpacingToken;
}

export const Grid: ParentComponent<GridProps> = (props) => {
  const rest = omit(props, "columns", "gap", "class", "children");
  return (
    <div
      {...rest}
      class={cx(
        grid({
          columns: (props.columns ?? 1) as any,
          gap: (props.gap ?? "6") as any,
        }),
        props.class as string,
      )}
    >
      {props.children}
    </div>
  );
};

/**
 * Divider Primitive
 * Clean border separation between content sections.
 * Strictly bounded by design tokens.
 */
export interface DividerProps extends ComponentProps<"hr"> {
  borderColor?: ColorToken;
  orientation?: "horizontal" | "vertical";
}

export const Divider: ParentComponent<DividerProps> = (props) => {
  const rest = omit(props, "borderColor", "orientation", "class");
  return (
    <hr
      {...rest}
      class={cx(
        divider({
          borderColor: (props.borderColor ?? "border.subtle") as any,
          orientation: props.orientation,
        }),
        props.class as string,
      )}
    />
  );
};
