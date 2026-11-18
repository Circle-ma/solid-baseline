import type { Component } from "solid-js";
import { css } from "styled-system/css";
import { Button } from "./button";
import { Icon } from "./icon";

const showInDarkClass = css({
  display: "none",
  alignItems: "center",
  _dark: {
    display: "inline-flex",
  },
});

const showInLightClass = css({
  display: "inline-flex",
  alignItems: "center",
  _dark: {
    display: "none",
  },
});

const srOnlyClass = css({
  srOnly: true,
});

/**
 * Systematic Theme Toggle Primitive
 * Renders both Sun and Moon branches and toggles visibility purely via Panda CSS `_dark`
 * conditions so there is zero hydration flicker, zero post-mount icon jump, and automatic
 * assistive-technology label switching (`display: none` removes the inactive branch).
 * Synchronizes user overrides to `documentElement.classList`, `<meta name="color-scheme">`,
 * `localStorage`, and `document.cookie` for SSR readiness.
 */
export const ThemeToggle: Component = () => {
  const toggleTheme = () => {
    const nextIsDark = !document.documentElement.classList.contains("dark");
    const nextTheme = nextIsDark ? "dark" : "light";

    document.documentElement.classList.toggle("dark", nextIsDark);

    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) {
      meta.setAttribute("content", nextTheme);
    }

    try {
      localStorage.setItem("theme", nextTheme);
    } catch {
      // Safe fallback in restricted environments
    }

    try {
      document.cookie = `theme=${nextTheme}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Safe fallback in restricted environments
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={toggleTheme}>
      <span class={showInDarkClass}>
        <Icon size="sm">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </Icon>
        <span class={srOnlyClass}>Switch to light mode</span>
      </span>
      <span class={showInLightClass}>
        <Icon size="sm">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </Icon>
        <span class={srOnlyClass}>Switch to dark mode</span>
      </span>
    </Button>
  );
};

export default ThemeToggle;
