import type { ComponentProps } from "@solidjs/web";
import { omit, type ParentComponent } from "solid-js";
import { card } from "styled-system/recipes";

const cardStyles = card();

/**
 * Root Card Container
 * Encapsulated container with pre-configured padding, borders, and elevation.
 * Inline `style` is strictly forbidden at compile time.
 */
export const CardRoot: ParentComponent<Omit<ComponentProps<"div">, "style">> = (props) => {
  const rest = omit(props, "class", "children");
  return (
    <div {...rest} class={[cardStyles.root, props.class]}>
      {props.children}
    </div>
  );
};

/**
 * Card Header Layout Slot
 * Tight vertical stack pairing title and description.
 */
export const CardHeader: ParentComponent<Omit<ComponentProps<"div">, "style">> = (props) => {
  const rest = omit(props, "class", "children");
  return (
    <div {...rest} class={[cardStyles.header, props.class]}>
      {props.children}
    </div>
  );
};

/**
 * Card Title Slot Component
 * High-contrast semantic heading.
 */
export const CardTitle: ParentComponent<Omit<ComponentProps<"h3">, "style">> = (props) => {
  const rest = omit(props, "class", "children");
  return (
    <h3 {...rest} class={[cardStyles.title, props.class]}>
      {props.children}
    </h3>
  );
};

/**
 * Card Description Slot Component
 * Muted explanatory text.
 */
export const CardDescription: ParentComponent<Omit<ComponentProps<"p">, "style">> = (props) => {
  const rest = omit(props, "class", "children");
  return (
    <p {...rest} class={[cardStyles.description, props.class]}>
      {props.children}
    </p>
  );
};

/**
 * Card Body Layout Slot
 * Systematic container for card contents with uniform vertical spacing.
 */
export const CardBody: ParentComponent<Omit<ComponentProps<"div">, "style">> = (props) => {
  const rest = omit(props, "class", "children");
  return (
    <div {...rest} class={[cardStyles.body, props.class]}>
      {props.children}
    </div>
  );
};

/**
 * Card Footer Layout Slot
 * Action container with right-aligned button stack.
 */
export const CardFooter: ParentComponent<Omit<ComponentProps<"div">, "style">> = (props) => {
  const rest = omit(props, "class", "children");
  return (
    <div {...rest} class={[cardStyles.footer, props.class]}>
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
