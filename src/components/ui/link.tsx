import { useHref, useInRouter, useLinkState } from "@solidjs/router";
import type { ComponentProps } from "@solidjs/web";
import { omit, type ParentComponent } from "solid-js";
import { type LinkVariant, link, navLink } from "styled-system/recipes";

export interface LinkProps extends Omit<ComponentProps<"a">, "style" | "href"> {
  href: string;
  /** Opens in a new tab with `rel="noopener noreferrer"` automatically applied. */
  external?: boolean;
  variant?: LinkVariant["variant"];
  size?: LinkVariant["size"];
}

function mergeExternalRel(rel: string | undefined): string {
  const tokens = new Set((rel ?? "").split(/\s+/).filter(Boolean));
  tokens.add("noopener");
  tokens.add("noreferrer");
  return Array.from(tokens).join(" ");
}

/**
 * Inline & External Hyperlink Primitive
 * Separated from `<NavLink>` (which is dedicated to SPA route navigation).
 * Automatically hardens `external` links with `target="_blank"` and `rel="noopener noreferrer"`.
 */
export const Link: ParentComponent<LinkProps> = (props) => {
  const rest = omit(
    props,
    "href",
    "external",
    "variant",
    "size",
    "target",
    "rel",
    "class",
    "children",
  );

  return (
    <a
      href={props.href}
      target={props.external ? (props.target ?? "_blank") : props.target}
      rel={
        props.external
          ? mergeExternalRel(typeof props.rel === "string" ? props.rel : undefined)
          : props.rel
      }
      {...rest}
      class={[
        link({
          variant: props.variant,
          size: props.size,
        }),
        props.class,
      ]}
    >
      {props.children}
    </a>
  );
};

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
  const rest = omit(
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

  const isActive = () =>
    typeof props.active === "boolean" ? props.active : (linkState?.active() ?? false);

  const isCurrent = () =>
    typeof props.active === "boolean" ? props.active : (linkState?.current() ?? false);

  return (
    <a
      href={resolvedHref ? (resolvedHref() ?? props.href) : props.href}
      replace={props.replace || undefined}
      noscroll={props.noScroll || undefined}
      {...rest}
      aria-current={isCurrent() ? "page" : undefined}
      data-active={isActive() ? "" : undefined}
      class={[
        isActive() ? navLink({ active: true }) : navLink({ active: false }),
        isActive() ? props.activeClass : props.inactiveClass,
        props.class,
      ]}
    >
      {props.children}
    </a>
  );
};

export default NavLink;
