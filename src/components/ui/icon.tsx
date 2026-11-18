import type { ComponentProps } from "@solidjs/web";
import { omit, type ParentComponent } from "solid-js";
import { type IconVariant, icon } from "styled-system/recipes";

export interface IconProps extends Omit<ComponentProps<"svg">, "style" | "width" | "height"> {
  size?: IconVariant["size"];
}

/**
 * Icon Primitive
 * Canonical SVG icon container bounded by design-system size tokens (`sm` | `md` | `lg`).
 * Defaults to a 24x24 stroke-based viewBox and `aria-hidden="true"` unless explicitly labelled.
 */
export const Icon: ParentComponent<IconProps> = (props) => {
  const rest = omit(
    props,
    "size",
    "class",
    "children",
    "viewBox",
    "fill",
    "stroke",
    "stroke-width",
    "stroke-linecap",
    "stroke-linejoin",
    "aria-hidden",
  );
  return (
    <svg
      viewBox={props.viewBox ?? "0 0 24 24"}
      fill={props.fill ?? "none"}
      stroke={props.stroke ?? "currentColor"}
      stroke-width={props["stroke-width"] ?? "2"}
      stroke-linecap={props["stroke-linecap"] ?? "round"}
      stroke-linejoin={props["stroke-linejoin"] ?? "round"}
      aria-hidden={props["aria-label"] ? undefined : (props["aria-hidden"] ?? "true")}
      {...rest}
      class={[icon({ size: props.size }), props.class]}
    >
      {props.children}
    </svg>
  );
};

export default Icon;
