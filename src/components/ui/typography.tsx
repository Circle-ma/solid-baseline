import { Dynamic } from "@solidjs/web";
import type { ComponentProps, ParentComponent } from "solid-js";
import { omit } from "solid-js";
import { css, cx } from "styled-system/css";
import { text } from "styled-system/recipes";
import type {
  ColorToken,
  FontSizeToken,
  FontWeightToken,
  LetterSpacingToken,
  LineHeightToken,
} from "./tokens";

export interface HeadingProps extends ComponentProps<"h2"> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  size?: FontSizeToken;
  letterSpacing?: LetterSpacingToken;
  fontWeight?: FontWeightToken;
  color?: ColorToken;
}

/**
 * Heading Typography Primitive
 *
 * Canonical typography primitive for headers.
 * Uses Park UI text recipe with variant="heading".
 * Polymorphic `as` prop defaults to `h2`.
 * Tokens are strictly bounded to system scales.
 */
export const Heading: ParentComponent<HeadingProps> = (props) => {
  const rest = omit(
    props,
    "as",
    "size",
    "letterSpacing",
    "fontWeight",
    "color",
    "class",
    "children",
  );
  return (
    <Dynamic
      component={props.as ?? "h2"}
      {...rest}
      class={cx(
        text({
          variant: "heading",
          size: (props.size ?? "xl") as any,
        }),
        css({
          letterSpacing: props.letterSpacing,
          fontWeight: props.fontWeight,
          color: props.color ?? "fg.default",
        }),
        props.class as string,
      )}
    >
      {props.children}
    </Dynamic>
  );
};

export interface TextProps extends ComponentProps<"p"> {
  as?: "p" | "span" | "label" | "div";
  size?: FontSizeToken;
  color?: ColorToken;
  fontWeight?: FontWeightToken;
  lineHeight?: LineHeightToken;
}

/**
 * Text Typography Primitive
 *
 * Canonical typography primitive for body copy, descriptions, and labels.
 * Polymorphic `as` prop defaults to `p`.
 * Tokens are strictly bounded to system scales.
 */
export const Text: ParentComponent<TextProps> = (props) => {
  const rest = omit(props, "as", "size", "color", "fontWeight", "lineHeight", "class", "children");
  return (
    <Dynamic
      component={props.as ?? "p"}
      {...rest}
      class={cx(
        text({
          size: (props.size ?? "md") as any,
        }),
        css({
          color: props.color ?? "fg.default",
          fontWeight: props.fontWeight,
          lineHeight: props.lineHeight,
        }),
        props.class as string,
      )}
    >
      {props.children}
    </Dynamic>
  );
};

export interface CodeProps extends ComponentProps<"code"> {
  size?: FontSizeToken;
  color?: ColorToken;
}

/**
 * Code Typography Primitive
 *
 * Monospace typography for badges, identifiers, and telemetry values.
 * Tokens are strictly bounded to system scales.
 */
export const Code: ParentComponent<CodeProps> = (props) => {
  const rest = omit(props, "size", "color", "class", "children");
  return (
    <code
      {...rest}
      class={cx(
        text({
          size: (props.size ?? "sm") as any,
        }),
        css({
          fontFamily: "mono",
          color: props.color ?? "fg.muted",
          bg: "bg.muted",
          px: "1.5",
          py: "0.5",
          borderRadius: "sm",
        }),
        props.class as string,
      )}
    >
      {props.children}
    </code>
  );
};
