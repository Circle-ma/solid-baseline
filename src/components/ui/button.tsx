import type { ComponentProps } from "@solidjs/web";
import type { ParentComponent } from "solid-js";
import { cx } from "styled-system/css";
import { type ButtonVariant, button } from "styled-system/recipes";
import { omitProps, toClass } from "./tokens";

export interface ButtonProps extends Omit<ComponentProps<"button">, "style"> {
  variant?: ButtonVariant["variant"];
  size?: ButtonVariant["size"];
}

/**
 * Button Primitive
 * Encapsulates the Panda CSS button recipe with Solid 2.0 fine-grained reactivity.
 * Automatically defaults type to "button" to prevent unwanted form submit triggers.
 * Strictly bounded by design tokens. Inline `style` is forbidden at compile time.
 */
export const Button: ParentComponent<ButtonProps> = (props) => {
  const rest = omitProps(props, "variant", "size", "class", "children", "type", "style");
  return (
    <button
      type={props.type ?? "button"}
      {...rest}
      class={cx(
        button({
          variant: props.variant,
          size: props.size,
        }),
        toClass(props.class),
      )}
    >
      {props.children}
    </button>
  );
};
