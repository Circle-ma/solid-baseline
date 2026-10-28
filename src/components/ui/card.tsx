import type { ComponentProps, ParentComponent } from "solid-js";
import { omit } from "solid-js";
import { css, cx } from "styled-system/css";
import { card } from "styled-system/recipes";
import { Heading, type HeadingProps, Text, type TextProps } from "./typography";

/**
 * Root Card Container
 * Pre-composed container with systematic 24px padding and subtle card elevation.
 * Strict tokenized borders, padding, and radii.
 */
export const CardRoot: ParentComponent<ComponentProps<"div">> = (props) => {
  const rest = omit(props, "class", "children");
  return (
    <div
      {...rest}
      class={cx(
        card().root,
        css({
          display: "flex",
          flexDirection: "column",
          gap: "6",
          p: "6",
          borderRadius: "l3",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "border.subtle",
          bg: "bg.default",
          boxShadow: "sm",
        }),
        props.class as string,
      )}
    >
      {props.children}
    </div>
  );
};

/**
 * Card Header Layout Slot
 * Tight vertical stack pairing title and description.
 */
export const CardHeader: ParentComponent<ComponentProps<"div">> = (props) => {
  const rest = omit(props, "class", "children");
  return (
    <div
      {...rest}
      class={cx(
        card().header,
        css({
          display: "flex",
          flexDirection: "column",
          gap: "1.5",
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
 * Card Title Slot Component
 * High-contrast semantic heading.
 */
export const CardTitle: ParentComponent<HeadingProps> = (props) => {
  return <Heading as="h3" size="lg" fontWeight="semibold" {...props} />;
};

/**
 * Card Description Slot Component
 * Muted explanatory text.
 */
export const CardDescription: ParentComponent<TextProps> = (props) => {
  return <Text size="sm" color="fg.muted" {...props} />;
};

/**
 * Card Body Layout Slot
 * Systematic container for card contents with uniform vertical spacing.
 */
export const CardBody: ParentComponent<ComponentProps<"div">> = (props) => {
  const rest = omit(props, "class", "children");
  return (
    <div
      {...rest}
      class={cx(
        card().body,
        css({
          display: "flex",
          flexDirection: "column",
          gap: "4",
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
 * Card Footer Layout Slot
 * Action container with right-aligned button stack.
 */
export const CardFooter: ParentComponent<ComponentProps<"div">> = (props) => {
  const rest = omit(props, "class", "children");
  return (
    <div
      {...rest}
      class={cx(
        card().footer,
        css({
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "3",
          w: "full",
        }),
        props.class as string,
      )}
    >
      {props.children}
    </div>
  );
};

export const Card = {
  Root: CardRoot,
  Header: CardHeader,
  Title: CardTitle,
  Description: CardDescription,
  Body: CardBody,
  Footer: CardFooter,
};

export default Card;
