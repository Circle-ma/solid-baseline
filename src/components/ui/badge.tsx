import type { ComponentProps } from "@solidjs/web";
import { omit, type ParentComponent } from "solid-js";
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
  const rest = omit(props, "variant", "intent", "size", "class", "children");
  return (
    <span
      {...rest}
      class={[
        badge({
          variant: props.variant,
          intent: props.intent,
          size: props.size,
        }),
        props.class,
      ]}
    >
      {props.children}
    </span>
  );
};
