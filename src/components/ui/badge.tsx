import type { ComponentProps, ParentComponent } from "solid-js";
import { omit } from "solid-js";
import { cx } from "styled-system/css";
import { type BadgeVariant, badge } from "styled-system/recipes";

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
  const rest = omit(props, "variant", "intent", "size", "class", "children", "style" as any);
  return (
    <span
      {...rest}
      class={cx(
        badge({
          variant: props.variant,
          intent: props.intent,
          size: props.size,
        }),
        props.class as string,
      )}
    >
      {props.children}
    </span>
  );
};
