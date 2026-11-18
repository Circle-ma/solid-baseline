import type { ComponentProps } from "@solidjs/web";
import type { ParentComponent } from "solid-js";
import { cx } from "styled-system/css";
import { card } from "styled-system/recipes";
import { omitProps, toClass } from "./tokens";

const cardStyles = card();

/**
 * Root Card Container
 * Encapsulated container with pre-configured padding, borders, and elevation.
 * Inline `style` is strictly forbidden at compile time.
 */
export const CardRoot: ParentComponent<Omit<ComponentProps<"div">, "style">> = (props) => {
  const rest = omitProps(props, "class", "children", "style");
  return (
    <div {...rest} class={cx(cardStyles.root, toClass(props.class))}>
      {props.children}
    </div>
  );
};

/**
 * Card Header Layout Slot
 * Tight vertical stack pairing title and description.
 */
export const CardHeader: ParentComponent<Omit<ComponentProps<"div">, "style">> = (props) => {
  const rest = omitProps(props, "class", "children", "style");
  return (
    <div {...rest} class={cx(cardStyles.header, toClass(props.class))}>
      {props.children}
    </div>
  );
};

/**
 * Card Title Slot Component
 * High-contrast semantic heading.
 */
export const CardTitle: ParentComponent<Omit<ComponentProps<"h3">, "style">> = (props) => {
  const rest = omitProps(props, "class", "children", "style");
  return (
    <h3 {...rest} class={cx(cardStyles.title, toClass(props.class))}>
      {props.children}
    </h3>
  );
};

/**
 * Card Description Slot Component
 * Muted explanatory text.
 */
export const CardDescription: ParentComponent<Omit<ComponentProps<"p">, "style">> = (props) => {
  const rest = omitProps(props, "class", "children", "style");
  return (
    <p {...rest} class={cx(cardStyles.description, toClass(props.class))}>
      {props.children}
    </p>
  );
};

/**
 * Card Body Layout Slot
 * Systematic container for card contents with uniform vertical spacing.
 */
export const CardBody: ParentComponent<Omit<ComponentProps<"div">, "style">> = (props) => {
  const rest = omitProps(props, "class", "children", "style");
  return (
    <div {...rest} class={cx(cardStyles.body, toClass(props.class))}>
      {props.children}
    </div>
  );
};

/**
 * Card Footer Layout Slot
 * Action container with right-aligned button stack.
 */
export const CardFooter: ParentComponent<Omit<ComponentProps<"div">, "style">> = (props) => {
  const rest = omitProps(props, "class", "children", "style");
  return (
    <div {...rest} class={cx(cardStyles.footer, toClass(props.class))}>
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
