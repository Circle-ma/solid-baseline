import { useHref, useInRouter, useLinkState } from "@solidjs/router";
import type { ComponentProps } from "@solidjs/web";
import { createMemo, type ParentComponent } from "solid-js";
import { cx } from "styled-system/css";
import { navLink } from "styled-system/recipes";
import { omitProps, toClass } from "./tokens";

export interface NavLinkProps extends Omit<ComponentProps<"a">, "style" | "href"> {
  href: string;
  /** Exact path match (mirrors Solid Router's `end` option). */
  end?: boolean;
  /** Explicit active state override (primarily for standalone/storybook usage). */
  active?: boolean;
  /** Optional class applied when the link matches the active route. */
  activeClass?: string;
  /** Optional class applied when the link is inactive. */
  inactiveClass?: string;
  /** Replace the current history entry instead of pushing a new one. */
  replace?: boolean;
  /** Suppress scroll reset after navigation. */
  noScroll?: boolean;
}

/**
 * Accessible SPA Navigation Link Primitive
 *
 * Integrates directly with `@solidjs/router` 2.0's native link delegation (`setupNativeEvents`),
 * `useHref()`, and `useLinkState()` for zero-reload SPA transitions, `end` exact matching,
 * `activeClass`/`inactiveClass` composition, and automatic `aria-current="page"` state.
 */
export const NavLink: ParentComponent<NavLinkProps> = (props) => {
  const rest = omitProps(
    props,
    "href",
    "end",
    "active",
    "activeClass",
    "inactiveClass",
    "replace",
    "noScroll",
    "class",
    "children",
    "style",
  );

  const inRouter = useInRouter();
  const resolvedHref = inRouter ? useHref(() => props.href) : undefined;
  const linkState = inRouter
    ? useLinkState(() => props.href, {
        get end() {
          return props.end;
        },
      })
    : undefined;

  const isActive = createMemo(
    () => (typeof props.active === "boolean" ? props.active : (linkState?.active() ?? false)),
    { name: "nav-link-active" },
  );

  const isCurrent = createMemo(
    () => (typeof props.active === "boolean" ? props.active : (linkState?.current() ?? false)),
    { name: "nav-link-current" },
  );

  return (
    <a
      href={resolvedHref ? (resolvedHref() ?? props.href) : props.href}
      replace={props.replace || undefined}
      noscroll={props.noScroll || undefined}
      {...rest}
      aria-current={isCurrent() ? "page" : undefined}
      data-active={isActive() ? "" : undefined}
      class={cx(
        isActive() ? navLink({ active: true }) : navLink({ active: false }),
        isActive() ? props.activeClass : props.inactiveClass,
        toClass(props.class),
      )}
    >
      {props.children}
    </a>
  );
};

export default NavLink;
