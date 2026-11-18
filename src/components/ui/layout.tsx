import type { ComponentProps, JSX } from "@solidjs/web";
import { merge, omit } from "solid-js";
import {
  Box as PandaBox,
  type BoxProps as PandaBoxProps,
  Container as PandaContainer,
  type ContainerProps as PandaContainerProps,
  Divider as PandaDivider,
  type DividerProps as PandaDividerProps,
  Grid as PandaGrid,
  type GridProps as PandaGridProps,
  HStack as PandaHStack,
  type HstackProps as PandaHStackProps,
  VStack as PandaVStack,
  type VstackProps as PandaVStackProps,
} from "styled-system/jsx";
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

export type SemanticContainerProps<T extends SemanticContainerTag = "div"> = Omit<
  ComponentProps<T>,
  "style" | "color" | keyof BaseStyleProps
> &
  BaseStyleProps & {
    as?: T;
  };

export type BoxProps<T extends SemanticContainerTag = "div"> = SemanticContainerProps<T>;

export function Box<T extends SemanticContainerTag = "div">(props: BoxProps<T>): JSX.Element {
  return <PandaBox {...(props as PandaBoxProps)} />;
}

export type ContainerProps<T extends SemanticContainerTag = "div"> = SemanticContainerProps<T>;

export function Container<T extends SemanticContainerTag = "div">(
  props: ContainerProps<T>,
): JSX.Element {
  return <PandaContainer w="full" {...(props as PandaContainerProps)} />;
}

export type VStackProps<T extends SemanticContainerTag = "div"> = SemanticContainerProps<T> & {
  gap?: ConditionalValue<SpacingRailToken>;
  alignItems?: SystemProperties["alignItems"];
  justifyContent?: SystemProperties["justifyContent"];
};

export function VStack<T extends SemanticContainerTag = "div">(props: VStackProps<T>): JSX.Element {
  return <PandaVStack gap="4" alignItems="stretch" {...(props as PandaVStackProps)} />;
}

export type HStackProps<T extends SemanticContainerTag = "div"> = SemanticContainerProps<T> & {
  gap?: ConditionalValue<SpacingRailToken>;
  alignItems?: SystemProperties["alignItems"];
  justifyContent?: SystemProperties["justifyContent"];
  flexWrap?: SystemProperties["flexWrap"];
};

export function HStack<T extends SemanticContainerTag = "div">(props: HStackProps<T>): JSX.Element {
  return <PandaHStack gap="3" alignItems="center" {...(props as PandaHStackProps)} />;
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
  return <PandaGrid columns={1} gap="6" w="full" {...(props as PandaGridProps)} />;
}

export interface DividerProps extends Omit<ComponentProps<"hr">, "style" | "color"> {
  orientation?: "horizontal" | "vertical";
  thickness?: SystemProperties["borderWidth"];
  color?: BorderColorToken;
  borderColor?: BorderColorToken;
  h?: SystemProperties["height"];
}

export function Divider(props: DividerProps): JSX.Element {
  const rest = omit(props, "borderColor", "color");
  const mergedProps = merge(
    {
      as: "hr" as const,
      orientation: "horizontal" as const,
      thickness: "1px",
    },
    rest,
    {
      get color() {
        return props.borderColor ?? props.color ?? "border.subtle";
      },
    },
  );
  return <PandaDivider {...(mergedProps as PandaDividerProps)} />;
}
