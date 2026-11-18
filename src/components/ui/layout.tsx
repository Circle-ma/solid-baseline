import { type ComponentProps, Dynamic, type JSX } from "@solidjs/web";
import { omit } from "solid-js";
import { box, container, divider, grid, hstack, vstack } from "styled-system/patterns";
import type { ConditionalValue, SystemProperties } from "styled-system/types/system";
import type {
  BorderColorToken,
  ForegroundToken,
  RadiusRailToken,
  ShadowRailToken,
  SpacingRailToken,
  SurfaceToken,
  ZIndexRailToken,
} from "./tokens";

export type SemanticContainerTag =
  | "div"
  | "section"
  | "main"
  | "nav"
  | "header"
  | "footer"
  | "article"
  | "aside"
  | "ul"
  | "ol"
  | "li"
  | "dl"
  | "dt"
  | "dd"
  | "form"
  | "fieldset";

/**
 * Unified Closed-World Layout Style Props
 * Single source of style tokens shared across Box, Container, VStack, HStack, and Grid.
 */
export type BaseStyleProps = {
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
  boxShadow?: ConditionalValue<ShadowRailToken>;
  display?: SystemProperties["display"];
  flex?: SystemProperties["flex"];
  flexGrow?: SystemProperties["flexGrow"];
  flexShrink?: SystemProperties["flexShrink"];
  ml?: "auto";
  mr?: "auto";
  mx?: "auto";
};

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
] as const satisfies ReadonlyArray<keyof BaseStyleProps>;

function pickBaseStyleProps(source: BaseStyleProps): BaseStyleProps {
  const styles: Record<string, unknown> = {};
  for (const key of BASE_STYLE_PROP_KEYS) {
    const value = source[key];
    if (value !== undefined) {
      styles[key] = value;
    }
  }
  return styles as BaseStyleProps;
}

export type SemanticContainerProps<T extends SemanticContainerTag = "div"> = Omit<
  ComponentProps<T>,
  "style" | "color" | "class" | "children" | keyof BaseStyleProps
> &
  BaseStyleProps & {
    as?: T;
    class?: JSX.HTMLAttributes<HTMLElement>["class"];
    children?: JSX.Element;
  };

export type BoxProps<T extends SemanticContainerTag = "div"> = SemanticContainerProps<T>;

export function Box<T extends SemanticContainerTag = "div">(props: BoxProps<T>): JSX.Element {
  const rest = omit(props, "as", "class", "children", ...BASE_STYLE_PROP_KEYS);
  return (
    <Dynamic
      component={props.as ?? "div"}
      {...(rest as Record<string, unknown>)}
      class={[box({ ...pickBaseStyleProps(props) }), props.class]}
    >
      {props.children}
    </Dynamic>
  );
}

export type ContainerProps<T extends SemanticContainerTag = "div"> = SemanticContainerProps<T>;

export function Container<T extends SemanticContainerTag = "div">(
  props: ContainerProps<T>,
): JSX.Element {
  const rest = omit(props, "as", "class", "children", ...BASE_STYLE_PROP_KEYS);
  return (
    <Dynamic
      component={props.as ?? "div"}
      {...(rest as Record<string, unknown>)}
      class={[
        container({
          ...pickBaseStyleProps(props),
          w: props.w ?? "full",
        }),
        props.class,
      ]}
    >
      {props.children}
    </Dynamic>
  );
}

export type VStackProps<T extends SemanticContainerTag = "div"> = SemanticContainerProps<T> & {
  gap?: ConditionalValue<SpacingRailToken>;
  alignItems?: SystemProperties["alignItems"];
  justifyContent?: SystemProperties["justifyContent"];
};

export function VStack<T extends SemanticContainerTag = "div">(props: VStackProps<T>): JSX.Element {
  const rest = omit(
    props,
    "as",
    "class",
    "children",
    "gap",
    "alignItems",
    "justifyContent",
    ...BASE_STYLE_PROP_KEYS,
  );
  return (
    <Dynamic
      component={props.as ?? "div"}
      {...(rest as Record<string, unknown>)}
      class={[
        vstack({
          ...pickBaseStyleProps(props),
          gap: props.gap ?? "4",
          alignItems: props.alignItems ?? "stretch",
          ...(props.justifyContent !== undefined ? { justifyContent: props.justifyContent } : {}),
        }),
        props.class,
      ]}
    >
      {props.children}
    </Dynamic>
  );
}

export type HStackProps<T extends SemanticContainerTag = "div"> = SemanticContainerProps<T> & {
  gap?: ConditionalValue<SpacingRailToken>;
  alignItems?: SystemProperties["alignItems"];
  justifyContent?: SystemProperties["justifyContent"];
  flexWrap?: SystemProperties["flexWrap"];
};

export function HStack<T extends SemanticContainerTag = "div">(props: HStackProps<T>): JSX.Element {
  const rest = omit(
    props,
    "as",
    "class",
    "children",
    "gap",
    "alignItems",
    "justifyContent",
    "flexWrap",
    ...BASE_STYLE_PROP_KEYS,
  );
  return (
    <Dynamic
      component={props.as ?? "div"}
      {...(rest as Record<string, unknown>)}
      class={[
        hstack({
          ...pickBaseStyleProps(props),
          gap: props.gap ?? "3",
          alignItems: props.alignItems ?? "center",
          ...(props.justifyContent !== undefined ? { justifyContent: props.justifyContent } : {}),
          ...(props.flexWrap !== undefined ? { flexWrap: props.flexWrap } : {}),
        }),
        props.class,
      ]}
    >
      {props.children}
    </Dynamic>
  );
}

export type GridProps<T extends SemanticContainerTag = "div"> = SemanticContainerProps<T> & {
  columns?: ConditionalValue<number>;
  gap?: ConditionalValue<SpacingRailToken>;
  rowGap?: ConditionalValue<SpacingRailToken>;
  columnGap?: ConditionalValue<SpacingRailToken>;
  alignItems?: SystemProperties["alignItems"];
  justifyContent?: SystemProperties["justifyContent"];
};

export function Grid<T extends SemanticContainerTag = "div">(props: GridProps<T>): JSX.Element {
  const rest = omit(
    props,
    "as",
    "class",
    "children",
    "columns",
    "gap",
    "rowGap",
    "columnGap",
    "alignItems",
    "justifyContent",
    ...BASE_STYLE_PROP_KEYS,
  );
  return (
    <Dynamic
      component={props.as ?? "div"}
      {...(rest as Record<string, unknown>)}
      class={[
        grid({
          ...pickBaseStyleProps(props),
          columns: props.columns ?? 1,
          gap: props.gap ?? "6",
          w: props.w ?? "full",
          ...(props.rowGap !== undefined ? { rowGap: props.rowGap } : {}),
          ...(props.columnGap !== undefined ? { columnGap: props.columnGap } : {}),
          ...(props.alignItems !== undefined ? { alignItems: props.alignItems } : {}),
          ...(props.justifyContent !== undefined ? { justifyContent: props.justifyContent } : {}),
        }),
        props.class,
      ]}
    >
      {props.children}
    </Dynamic>
  );
}

export interface DividerProps extends Omit<ComponentProps<"hr">, "style" | "color"> {
  orientation?: "horizontal" | "vertical";
  thickness?: SystemProperties["borderWidth"];
  color?: BorderColorToken;
  h?: SystemProperties["height"];
}

export function Divider(props: DividerProps): JSX.Element {
  const rest = omit(props, "orientation", "thickness", "color", "h", "class");
  return (
    <hr
      {...rest}
      class={[
        divider({
          orientation: props.orientation ?? "horizontal",
          thickness: props.thickness ?? "1px",
          color: props.color ?? "border.subtle",
          ...(props.h !== undefined ? { h: props.h } : {}),
        }),
        props.class,
      ]}
    />
  );
}
