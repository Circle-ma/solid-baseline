import { useLocation } from "@solidjs/router";
import { type ComponentProps, createMemo, type ParentComponent } from "solid-js";
import { cx } from "styled-system/css";
import { navLink } from "styled-system/recipes";
import { omitProps, toClass } from "./tokens";

export interface NavLinkProps extends Omit<ComponentProps<"a">, "style"> {
  href: string;
  active?: boolean;
}

/**
 * Accessible Navigation Link Primitive
 * Adheres to closed-world tokens with active/inactive state switching,
 * focus-visible rings, and automatic route matching.
 */
export const NavLink: ParentComponent<NavLinkProps> = (props) => {
  const rest = omitProps(props, "href", "active", "class", "children", "style");
  let location: { pathname: string } | null = null;
  try {
    location = useLocation();
  } catch {
    // In environments without router context fallback to inactive
  }

  const isActive = createMemo(
    () => (typeof props.active === "boolean" ? props.active : location?.pathname === props.href),
    { name: "nav-link-active" },
  );

  return (
    <a
      href={props.href}
      {...rest}
      aria-current={isActive() ? "page" : undefined}
      class={cx(navLink({ active: isActive() }), toClass(props.class))}
    >
      {props.children}
    </a>
  );
};

export default NavLink;
