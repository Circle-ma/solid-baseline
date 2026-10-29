import type { ComponentProps, ParentComponent } from "solid-js";
import { omit } from "solid-js";
import { cx } from "styled-system/css";
import { box, container, divider, grid, hstack, vstack } from "styled-system/patterns";
import type { ConditionalValue, SystemProperties } from "styled-system/types/system";
import type { ColorToken } from "./tokens";

export interface BoxProps extends Omit<ComponentProps<"div">, "style"> {
  position?: SystemProperties["position"];
  top?: SystemProperties["top"];
  bottom?: SystemProperties["bottom"];
  left?: SystemProperties["left"];
  right?: SystemProperties["right"];
  inset?: SystemProperties["inset"];
  zIndex?: SystemProperties["zIndex"];
  minH?: SystemProperties["minHeight"];
  maxH?: SystemProperties["maxHeight"];
  minW?: SystemProperties["minWidth"];
  maxW?: SystemProperties["maxWidth"];
  w?: SystemProperties["width"];
  h?: SystemProperties["height"];
  bg?: SystemProperties["backgroundColor"];
  color?: SystemProperties["color"];
  p?: SystemProperties["padding"];
  px?: SystemProperties["paddingInline"];
  py?: SystemProperties["paddingBlock"];
  borderWidth?: SystemProperties["borderWidth"];
  borderStyle?: SystemProperties["borderStyle"];
  borderColor?: SystemProperties["borderColor"];
  borderRadius?: SystemProperties["borderRadius"];
  overflow?: SystemProperties["overflow"];
  overflowX?: SystemProperties["overflowX"];
  overflowY?: SystemProperties["overflowY"];
  boxShadow?: SystemProperties["boxShadow"];
  display?: SystemProperties["display"];
  flex?: SystemProperties["flex"];
  flexGrow?: SystemProperties["flexGrow"];
  flexShrink?: SystemProperties["flexShrink"];
}

export const Box: ParentComponent<BoxProps> = (props) => {
  const rest = omit(
    props,
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
    "class",
    "children",
    "style" as any,
  );
  return (
    <div
      {...rest}
      class={cx(
        box({
          position: props.position,
          top: props.top,
          bottom: props.bottom,
          left: props.left,
          right: props.right,
          inset: props.inset,
          zIndex: props.zIndex,
          minH: props.minH,
          maxH: props.maxH,
          minW: props.minW,
          maxW: props.maxW,
          w: props.w,
          h: props.h,
          bg: props.bg,
          color: props.color,
          p: props.p,
          px: props.px,
          py: props.py,
          borderWidth: props.borderWidth,
          borderStyle: props.borderStyle,
          borderColor: props.borderColor,
          borderRadius: props.borderRadius,
          overflow: props.overflow,
          overflowX: props.overflowX,
          overflowY: props.overflowY,
          boxShadow: props.boxShadow,
          display: props.display,
          flex: props.flex,
          flexGrow: props.flexGrow,
          flexShrink: props.flexShrink,
          boxSizing: "border-box",
        }),
        props.class as string,
      )}
    >
      {props.children}
    </div>
  );
};

export interface ContainerProps extends Omit<ComponentProps<"div">, "style"> {
  maxW?: SystemProperties["maxWidth"];
  p?: SystemProperties["padding"];
  px?: SystemProperties["paddingInline"];
  py?: SystemProperties["paddingBlock"];
}

export const Container: ParentComponent<ContainerProps> = (props) => {
  const rest = omit(props, "maxW", "p", "px", "py", "class", "children", "style" as any);
  return (
    <div
      {...rest}
      class={cx(
        container({
          maxW: props.maxW,
          p: props.p,
          px: props.px,
          py: props.py,
          w: "full",
        }),
        props.class as string,
      )}
    >
      {props.children}
    </div>
  );
};

export interface VStackProps extends Omit<ComponentProps<"div">, "style"> {
  gap?: SystemProperties["gap"];
  alignItems?: SystemProperties["alignItems"];
  justifyContent?: SystemProperties["justifyContent"];
  position?: SystemProperties["position"];
  zIndex?: SystemProperties["zIndex"];
  minH?: SystemProperties["minHeight"];
  maxH?: SystemProperties["maxHeight"];
  h?: SystemProperties["height"];
  minW?: SystemProperties["minWidth"];
  maxW?: SystemProperties["maxWidth"];
  w?: SystemProperties["width"];
  overflow?: SystemProperties["overflow"];
  overflowX?: SystemProperties["overflowX"];
  overflowY?: SystemProperties["overflowY"];
  borderWidth?: SystemProperties["borderWidth"];
  borderStyle?: SystemProperties["borderStyle"];
  borderColor?: SystemProperties["borderColor"];
  borderRadius?: SystemProperties["borderRadius"];
  p?: SystemProperties["padding"];
  px?: SystemProperties["paddingInline"];
  py?: SystemProperties["paddingBlock"];
  bg?: SystemProperties["backgroundColor"];
  color?: SystemProperties["color"];
  boxShadow?: SystemProperties["boxShadow"];
  flex?: SystemProperties["flex"];
  flexGrow?: SystemProperties["flexGrow"];
  flexShrink?: SystemProperties["flexShrink"];
}

export const VStack: ParentComponent<VStackProps> = (props) => {
  const rest = omit(
    props,
    "gap",
    "alignItems",
    "justifyContent",
    "position",
    "zIndex",
    "minH",
    "maxH",
    "h",
    "minW",
    "maxW",
    "w",
    "overflow",
    "overflowX",
    "overflowY",
    "borderWidth",
    "borderStyle",
    "borderColor",
    "borderRadius",
    "p",
    "px",
    "py",
    "bg",
    "color",
    "boxShadow",
    "flex",
    "flexGrow",
    "flexShrink",
    "class",
    "children",
    "style" as any,
  );
  return (
    <div
      {...rest}
      class={cx(
        vstack({
          gap: props.gap ?? "4",
          alignItems: props.alignItems ?? "stretch",
          justify: props.justifyContent,
          position: props.position,
          zIndex: props.zIndex,
          minH: props.minH,
          maxH: props.maxH,
          h: props.h,
          minW: props.minW,
          maxW: props.maxW,
          w: props.w,
          overflow: props.overflow,
          overflowX: props.overflowX,
          overflowY: props.overflowY,
          borderWidth: props.borderWidth,
          borderStyle: props.borderStyle,
          borderColor: props.borderColor,
          borderRadius: props.borderRadius,
          p: props.p,
          px: props.px,
          py: props.py,
          bg: props.bg,
          color: props.color,
          boxShadow: props.boxShadow,
          flex: props.flex,
          flexGrow: props.flexGrow,
          flexShrink: props.flexShrink,
        }),
        props.class as string,
      )}
    >
      {props.children}
    </div>
  );
};

export interface HStackProps extends Omit<ComponentProps<"div">, "style"> {
  gap?: SystemProperties["gap"];
  alignItems?: SystemProperties["alignItems"];
  justifyContent?: SystemProperties["justifyContent"];
  position?: SystemProperties["position"];
  zIndex?: SystemProperties["zIndex"];
  minH?: SystemProperties["minHeight"];
  maxH?: SystemProperties["maxHeight"];
  h?: SystemProperties["height"];
  minW?: SystemProperties["minWidth"];
  maxW?: SystemProperties["maxWidth"];
  w?: SystemProperties["width"];
  flexWrap?: SystemProperties["flexWrap"];
  overflow?: SystemProperties["overflow"];
  overflowX?: SystemProperties["overflowX"];
  overflowY?: SystemProperties["overflowY"];
  borderWidth?: SystemProperties["borderWidth"];
  borderStyle?: SystemProperties["borderStyle"];
  borderColor?: SystemProperties["borderColor"];
  borderRadius?: SystemProperties["borderRadius"];
  p?: SystemProperties["padding"];
  px?: SystemProperties["paddingInline"];
  py?: SystemProperties["paddingBlock"];
  bg?: SystemProperties["backgroundColor"];
  color?: SystemProperties["color"];
  boxShadow?: SystemProperties["boxShadow"];
  flex?: SystemProperties["flex"];
  flexGrow?: SystemProperties["flexGrow"];
  flexShrink?: SystemProperties["flexShrink"];
}

export const HStack: ParentComponent<HStackProps> = (props) => {
  const rest = omit(
    props,
    "gap",
    "alignItems",
    "justifyContent",
    "position",
    "zIndex",
    "minH",
    "maxH",
    "h",
    "minW",
    "maxW",
    "w",
    "flexWrap",
    "overflow",
    "overflowX",
    "overflowY",
    "borderWidth",
    "borderStyle",
    "borderColor",
    "borderRadius",
    "p",
    "px",
    "py",
    "bg",
    "color",
    "boxShadow",
    "flex",
    "flexGrow",
    "flexShrink",
    "class",
    "children",
    "style" as any,
  );
  return (
    <div
      {...rest}
      class={cx(
        hstack({
          gap: props.gap ?? "3",
          alignItems: props.alignItems ?? "center",
          justify: props.justifyContent,
          position: props.position,
          zIndex: props.zIndex,
          minH: props.minH,
          maxH: props.maxH,
          h: props.h,
          minW: props.minW,
          maxW: props.maxW,
          w: props.w,
          flexWrap: props.flexWrap,
          overflow: props.overflow,
          overflowX: props.overflowX,
          overflowY: props.overflowY,
          borderWidth: props.borderWidth,
          borderStyle: props.borderStyle,
          borderColor: props.borderColor,
          borderRadius: props.borderRadius,
          p: props.p,
          px: props.px,
          py: props.py,
          bg: props.bg,
          color: props.color,
          boxShadow: props.boxShadow,
          flex: props.flex,
          flexGrow: props.flexGrow,
          flexShrink: props.flexShrink,
        }),
        props.class as string,
      )}
    >
      {props.children}
    </div>
  );
};

export interface GridProps extends Omit<ComponentProps<"div">, "style"> {
  columns?: ConditionalValue<number>;
  gap?: SystemProperties["gap"];
  rowGap?: SystemProperties["rowGap"];
  columnGap?: SystemProperties["columnGap"];
  alignItems?: SystemProperties["alignItems"];
  justifyContent?: SystemProperties["justifyContent"];
  w?: SystemProperties["width"];
  minH?: SystemProperties["minHeight"];
  p?: SystemProperties["padding"];
  px?: SystemProperties["paddingInline"];
  py?: SystemProperties["paddingBlock"];
}

export const Grid: ParentComponent<GridProps> = (props) => {
  const rest = omit(
    props,
    "columns",
    "gap",
    "rowGap",
    "columnGap",
    "alignItems",
    "justifyContent",
    "w",
    "minH",
    "p",
    "px",
    "py",
    "class",
    "children",
    "style" as any,
  );
  return (
    <div
      {...rest}
      class={cx(
        grid({
          columns: props.columns ?? 1,
          gap: props.gap ?? "6",
          rowGap: props.rowGap,
          columnGap: props.columnGap,
          alignItems: props.alignItems,
          justifyContent: props.justifyContent,
          w: props.w ?? "full",
          minH: props.minH,
          p: props.p,
          px: props.px,
          py: props.py,
        }),
        props.class as string,
      )}
    >
      {props.children}
    </div>
  );
};

export interface DividerProps extends Omit<ComponentProps<"hr">, "style"> {
  orientation?: "horizontal" | "vertical";
  thickness?: SystemProperties["borderWidth"];
  color?: ColorToken;
  borderColor?: ColorToken;
}

export const Divider: ParentComponent<DividerProps> = (props) => {
  const rest = omit(
    props,
    "orientation",
    "thickness",
    "color",
    "borderColor",
    "class",
    "children",
    "style" as any,
  );
  return (
    <hr
      {...rest}
      class={cx(
        divider({
          orientation: props.orientation ?? "horizontal",
          thickness: props.thickness ?? "1px",
          color: props.borderColor ?? props.color ?? "border.subtle",
        }),
        props.class as string,
      )}
    />
  );
};
