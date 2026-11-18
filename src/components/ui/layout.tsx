import { type ComponentProps, Dynamic, type JSX } from "@solidjs/web";
import type { ParentComponent } from "solid-js";
import { cx } from "styled-system/css";
import { box, container, divider, grid, hstack, vstack } from "styled-system/patterns";
import type { ConditionalValue, SystemProperties } from "styled-system/types/system";
import {
  type BorderColorToken,
  type ForegroundToken,
  omitProps,
  type RadiusRailToken,
  type SpacingRailToken,
  type SurfaceToken,
  toClass,
  type ZIndexRailToken,
} from "./tokens";

export type SemanticContainerTag =
  | "div"
  | "section"
  | "main"
  | "nav"
  | "header"
  | "footer"
  | "article"
  | "ul"
  | "li"
  | "form";

/**
 * Unified Closed-World Layout Style Props
 * Single source of style tokens shared across Box, Container, VStack, HStack, and Grid.
 */
export interface BaseStyleProps {
  position?: SystemProperties["position"];
  top?: SystemProperties["top"];
  bottom?: SystemProperties["bottom"];
  left?: SystemProperties["left"];
  right?: SystemProperties["right"];
  inset?: SystemProperties["inset"];
  zIndex?: ConditionalValue<ZIndexRailToken>;
  minH?: SystemProperties["minHeight"];
  maxH?: SystemProperties["maxHeight"];
  minW?: SystemProperties["minWidth"];
  maxW?: SystemProperties["maxWidth"];
  w?: SystemProperties["width"];
  h?: SystemProperties["height"];
  bg?: ConditionalValue<SurfaceToken>;
  color?: ConditionalValue<ForegroundToken>;
  p?: ConditionalValue<SpacingRailToken>;
  px?: ConditionalValue<SpacingRailToken>;
  py?: ConditionalValue<SpacingRailToken>;
  borderWidth?: SystemProperties["borderWidth"];
  borderStyle?: SystemProperties["borderStyle"];
  borderColor?: ConditionalValue<BorderColorToken>;
  borderRadius?: ConditionalValue<RadiusRailToken>;
  overflow?: SystemProperties["overflow"];
  overflowX?: SystemProperties["overflowX"];
  overflowY?: SystemProperties["overflowY"];
  boxShadow?: SystemProperties["boxShadow"];
  display?: SystemProperties["display"];
  flex?: SystemProperties["flex"];
  flexGrow?: SystemProperties["flexGrow"];
  flexShrink?: SystemProperties["flexShrink"];
  ml?: "auto";
  mr?: "auto";
  mx?: "auto";
}

export interface SemanticContainerProps
  extends Omit<JSX.HTMLAttributes<HTMLElement>, "style" | "color">,
    BaseStyleProps {
  as?: SemanticContainerTag;
}

const BASE_STYLE_PROP_KEYS = [
  "position",
  "top",
  "bottom",
  "left",
  "right",
  "inset",
  "zIndex",
  "minH",
  "maxH",
  "minW",
  "maxW",
  "w",
  "h",
  "bg",
  "color",
  "p",
  "px",
  "py",
  "borderWidth",
  "borderStyle",
  "borderColor",
  "borderRadius",
  "overflow",
  "overflowX",
  "overflowY",
  "boxShadow",
  "display",
  "flex",
  "flexGrow",
  "flexShrink",
  "ml",
  "mr",
  "mx",
] as const satisfies readonly (keyof BaseStyleProps)[];

/**
 * Separates closed-world style props from native HTML attributes using Solid 2.0 `omit`.
 * Reads style prop values lazily inside `getStyleProps()` so component bodies stay untracked.
 */
function extractStyleProps<T extends SemanticContainerProps, K extends readonly (keyof T)[]>(
  props: T,
  ...extraKeys: K
) {
  const rest = omitProps(
    props,
    ...BASE_STYLE_PROP_KEYS,
    ...extraKeys,
    "as",
    "class",
    "children",
    "style",
  );

  const getStyleProps = (): BaseStyleProps => {
    const styles: Partial<Record<keyof BaseStyleProps, unknown>> = {};
    for (const key of BASE_STYLE_PROP_KEYS) {
      const val = props[key];
      if (val !== undefined) {
        styles[key] = val;
      }
    }
    return styles as BaseStyleProps;
  };

  return { getStyleProps, rest };
}

export type BoxProps = SemanticContainerProps;

export const Box: ParentComponent<BoxProps> = (props) => {
  const { getStyleProps, rest } = extractStyleProps(props);
  return (
    <Dynamic
      component={props.as ?? "div"}
      {...rest}
      class={cx(
        box({
          ...getStyleProps(),
          boxSizing: "border-box",
        }),
        toClass(props.class),
      )}
    >
      {props.children}
    </Dynamic>
  );
};

export type ContainerProps = SemanticContainerProps;

export const Container: ParentComponent<ContainerProps> = (props) => {
  const { getStyleProps, rest } = extractStyleProps(props);
  return (
    <Dynamic
      component={props.as ?? "div"}
      {...rest}
      class={cx(
        container({
          ...getStyleProps(),
          w: props.w ?? "full",
        }),
        toClass(props.class),
      )}
    >
      {props.children}
    </Dynamic>
  );
};

export interface VStackProps extends SemanticContainerProps {
  gap?: ConditionalValue<SpacingRailToken>;
  alignItems?: SystemProperties["alignItems"];
  justifyContent?: SystemProperties["justifyContent"];
}

export const VStack: ParentComponent<VStackProps> = (props) => {
  const { getStyleProps, rest } = extractStyleProps(props, "gap", "alignItems", "justifyContent");
  return (
    <Dynamic
      component={props.as ?? "div"}
      {...rest}
      class={cx(
        vstack({
          ...getStyleProps(),
          gap: props.gap ?? "4",
          alignItems: props.alignItems ?? "stretch",
          justify: props.justifyContent,
        }),
        toClass(props.class),
      )}
    >
      {props.children}
    </Dynamic>
  );
};

export interface HStackProps extends SemanticContainerProps {
  gap?: ConditionalValue<SpacingRailToken>;
  alignItems?: SystemProperties["alignItems"];
  justifyContent?: SystemProperties["justifyContent"];
  flexWrap?: SystemProperties["flexWrap"];
}

export const HStack: ParentComponent<HStackProps> = (props) => {
  const { getStyleProps, rest } = extractStyleProps(
    props,
    "gap",
    "alignItems",
    "justifyContent",
    "flexWrap",
  );
  return (
    <Dynamic
      component={props.as ?? "div"}
      {...rest}
      class={cx(
        hstack({
          ...getStyleProps(),
          gap: props.gap ?? "3",
          alignItems: props.alignItems ?? "center",
          justify: props.justifyContent,
          flexWrap: props.flexWrap,
        }),
        toClass(props.class),
      )}
    >
      {props.children}
    </Dynamic>
  );
};

export interface GridProps extends SemanticContainerProps {
  columns?: ConditionalValue<number>;
  gap?: ConditionalValue<SpacingRailToken>;
  rowGap?: ConditionalValue<SpacingRailToken>;
  columnGap?: ConditionalValue<SpacingRailToken>;
  alignItems?: SystemProperties["alignItems"];
  justifyContent?: SystemProperties["justifyContent"];
}

export const Grid: ParentComponent<GridProps> = (props) => {
  const { getStyleProps, rest } = extractStyleProps(
    props,
    "columns",
    "gap",
    "rowGap",
    "columnGap",
    "alignItems",
    "justifyContent",
  );
  return (
    <Dynamic
      component={props.as ?? "div"}
      {...rest}
      class={cx(
        grid({
          ...getStyleProps(),
          columns: props.columns ?? 1,
          gap: props.gap ?? "6",
          rowGap: props.rowGap,
          columnGap: props.columnGap,
          alignItems: props.alignItems,
          justifyContent: props.justifyContent,
          w: props.w ?? "full",
        }),
        toClass(props.class),
      )}
    >
      {props.children}
    </Dynamic>
  );
};

export interface DividerProps extends Omit<ComponentProps<"hr">, "style"> {
  orientation?: "horizontal" | "vertical";
  thickness?: SystemProperties["borderWidth"];
  color?: BorderColorToken;
  borderColor?: BorderColorToken;
  h?: SystemProperties["height"];
}

export const Divider: ParentComponent<DividerProps> = (props) => {
  const rest = omitProps(
    props,
    "orientation",
    "thickness",
    "color",
    "borderColor",
    "h",
    "class",
    "children",
    "style",
  );
  return (
    <hr
      {...rest}
      class={cx(
        divider({
          orientation: props.orientation ?? "horizontal",
          thickness: props.thickness ?? "1px",
          color: props.borderColor ?? props.color ?? "border.subtle",
          h: props.h,
        }),
        toClass(props.class),
      )}
    />
  );
};
