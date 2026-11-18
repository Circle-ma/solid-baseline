import { type ComponentProps, Dynamic } from "@solidjs/web";
import { omit, type ParentComponent } from "solid-js";
import { type TextVariant, text } from "styled-system/recipes";

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
  const rest = omit(
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
  );
  return (
    <Dynamic
      component={props.as ?? "h2"}
      {...rest}
      class={[
        text({
          variant: "heading",
          size: props.size ?? "xl",
          tone: props.tone,
          weight: props.weight,
          leading: props.leading,
          tracking: props.tracking,
          tabular: props.tabular,
        }),
        props.class,
      ]}
    >
      {props.children}
    </Dynamic>
  );
};

export interface TextProps extends Omit<ComponentProps<"p">, "style"> {
  as?: "p" | "span" | "label" | "div";
  for?: string;
  size?: TextVariant["size"];
  tone?: TextVariant["tone"];
  weight?: TextVariant["weight"];
  leading?: TextVariant["leading"];
  tracking?: TextVariant["tracking"];
  tabular?: boolean;
}

export const Text: ParentComponent<TextProps> = (props) => {
  const rest = omit(
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
  );
  return (
    <Dynamic
      component={props.as ?? "p"}
      {...rest}
      class={[
        text({
          variant: "body",
          size: props.size ?? (props.as === "span" ? undefined : "md"),
          tone: props.tone,
          weight: props.weight,
          leading: props.leading,
          tracking: props.tracking,
          tabular: props.tabular,
        }),
        props.class,
      ]}
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
  const rest = omit(props, "size", "tone", "tabular", "class", "children");
  return (
    <code
      {...rest}
      class={[
        text({
          variant: "code",
          size: props.size ?? "sm",
          tone: props.tone,
          tabular: props.tabular,
        }),
        props.class,
      ]}
    >
      {props.children}
    </code>
  );
};
