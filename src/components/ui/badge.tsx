import type { ComponentProps, ParentComponent } from "solid-js";
import { cx } from "styled-system/css";
import { type BadgeVariant, badge } from "styled-system/recipes";
import { omitProps, toClass } from "./tokens";

export interface BadgeProps extends Omit<ComponentProps<"span">, "style"> {
  variant?: BadgeVariant["variant"];
  intent?: BadgeVariant["intent"];
  size?: BadgeVariant["size"];
}

/**
 * Badge Primitive
 * Encapsulates the Panda CSS badge recipe with Solid 2.0 fine-grained reactivity.
 * Fully supports status semantics (default, success, danger, warning, info).
 * Strictly bounded by design tokens. Inline `style` is forbidden at compile time.
 */
export const Badge: ParentComponent<BadgeProps> = (props) => {
  const rest = omitProps(props, "variant", "intent", "size", "class", "children", "style");
  return (
    <span
      {...rest}
      class={cx(
        badge({
          variant: props.variant,
          intent: props.intent,
          size: props.size,
        }),
        toClass(props.class),
      )}
    >
      {props.children}
    </span>
  );
};
