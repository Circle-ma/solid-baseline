import { type ComponentProps, Dynamic } from "@solidjs/web";
import type { ParentComponent } from "solid-js";
import { cx } from "styled-system/css";
import { type TextVariant, text } from "styled-system/recipes";
import { omitProps, toClass } from "./tokens";

export interface HeadingProps extends Omit<ComponentProps<"h2">, "style"> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  size?: TextVariant["size"];
  tone?: TextVariant["tone"];
  weight?: TextVariant["weight"];
  leading?: TextVariant["leading"];
  tracking?: TextVariant["tracking"];
  tabular?: boolean;
}

export const Heading: ParentComponent<HeadingProps> = (props) => {
  const rest = omitProps(
    props,
    "as",
    "size",
    "tone",
    "weight",
    "leading",
    "tracking",
    "tabular",
    "class",
    "children",
    "style",
  );
  return (
    <Dynamic
      component={props.as ?? "h2"}
      {...rest}
      class={cx(
        text({
          variant: "heading",
          size: props.size ?? "xl",
          tone: props.tone,
          weight: props.weight,
          leading: props.leading,
          tracking: props.tracking,
          tabular: props.tabular,
        }),
        toClass(props.class),
      )}
    >
      {props.children}
    </Dynamic>
  );
};

export interface TextProps extends Omit<ComponentProps<"p">, "style"> {
  as?: "p" | "span" | "label" | "div";
  size?: TextVariant["size"];
  tone?: TextVariant["tone"];
  weight?: TextVariant["weight"];
  leading?: TextVariant["leading"];
  tracking?: TextVariant["tracking"];
  tabular?: boolean;
}

export const Text: ParentComponent<TextProps> = (props) => {
  const rest = omitProps(
    props,
    "as",
    "size",
    "tone",
    "weight",
    "leading",
    "tracking",
    "tabular",
    "class",
    "children",
    "style",
  );
  return (
    <Dynamic
      component={props.as ?? "p"}
      {...rest}
      class={cx(
        text({
          variant: "body",
          size: props.size ?? "md",
          tone: props.tone,
          weight: props.weight,
          leading: props.leading,
          tracking: props.tracking,
          tabular: props.tabular,
        }),
        toClass(props.class),
      )}
    >
      {props.children}
    </Dynamic>
  );
};

export interface CodeProps extends Omit<ComponentProps<"code">, "style"> {
  size?: TextVariant["size"];
  tone?: TextVariant["tone"];
  tabular?: boolean;
}

export const Code: ParentComponent<CodeProps> = (props) => {
  const rest = omitProps(props, "size", "tone", "tabular", "class", "children", "style");
  return (
    <code
      {...rest}
      class={cx(
        text({
          variant: "code",
          size: props.size ?? "sm",
          tone: props.tone,
          tabular: props.tabular,
        }),
        toClass(props.class),
      )}
    >
      {props.children}
    </code>
  );
};
