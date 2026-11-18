import type { ComponentProps } from "@solidjs/web";
import {
  type Accessor,
  createContext,
  createMemo,
  omit,
  type ParentComponent,
  useContext,
} from "solid-js";
import { type CardVariantProps, card } from "styled-system/recipes";

type CardSlotClasses = ReturnType<typeof card>;

const defaultCardStyles: CardSlotClasses = card();
const CardStylesContext = createContext<Accessor<CardSlotClasses>>(() => defaultCardStyles);

export interface CardRootProps extends Omit<ComponentProps<"div">, "style"> {
  variant?: CardVariantProps["variant"];
  density?: CardVariantProps["density"];
}

/**
 * Root Card Container
 * Encapsulated container driven by the `card` slot recipe (`variant` + `density`)
 * and propagated reactively to descendant slots via `CardStylesContext`.
 */
export const CardRoot: ParentComponent<CardRootProps> = (props) => {
  const rest = omit(props, "variant", "density", "class", "children");
  const styles = createMemo(() =>
    card({
      variant: props.variant,
      density: props.density,
    }),
  );

  return (
    <CardStylesContext value={styles}>
      <div {...rest} class={[styles().root, props.class]}>
        {props.children}
      </div>
    </CardStylesContext>
  );
};

/**
 * Card Header Layout Slot
 * Tight vertical stack pairing title and description.
 */
export const CardHeader: ParentComponent<Omit<ComponentProps<"div">, "style">> = (props) => {
  const rest = omit(props, "class", "children");
  const styles = useContext(CardStylesContext);
  return (
    <div {...rest} class={[styles().header, props.class]}>
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
  const styles = useContext(CardStylesContext);
  return (
    <h3 {...rest} class={[styles().title, props.class]}>
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
  const styles = useContext(CardStylesContext);
  return (
    <p {...rest} class={[styles().description, props.class]}>
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
  const styles = useContext(CardStylesContext);
  return (
    <div {...rest} class={[styles().body, props.class]}>
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
  const styles = useContext(CardStylesContext);
  return (
    <div {...rest} class={[styles().footer, props.class]}>
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
