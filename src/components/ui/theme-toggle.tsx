import type { Component } from "solid-js";
import { createSignal, onSettled } from "solid-js";
import { Button } from "./button";

/**
 * Systematic Theme Toggle Primitive
 * Manages zero-FOUC light/dark theme switching synchronized with localStorage
 * and documentElement dark class name.
 */
export const ThemeToggle: Component = () => {
  const [isDark, setIsDark] = createSignal(false, { name: "theme-is-dark" });

  onSettled(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  });

  const toggleTheme = () => {
    const next = !isDark();
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      try {
        localStorage.setItem("theme", "dark");
      } catch {
        // Safe fallback in restricted environments
      }
    } else {
      document.documentElement.classList.remove("dark");
      try {
        localStorage.setItem("theme", "light");
      } catch {
        // Safe fallback in restricted environments
      }
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      aria-label={isDark() ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark() ? (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      )}
    </Button>
  );
};

export default ThemeToggle;
