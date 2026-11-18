import { HydrationScript } from "@solidjs/web";
import type { ParentProps } from "solid-js";

const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400..700&family=Geist:wght@400..700&family=Google+Sans+Flex:opsz,wght@6..72,400..700&display=swap";

/**
 * Runs synchronously in `<head>` before first paint to:
 * 1. Restore the persisted color theme (`localStorage` -> `theme` cookie -> OS preference)
 * 2. Synchronize `<meta name="color-scheme">` to prevent dark/light flash
 * 3. Promote the non-blocking print stylesheet for Google Fonts once loaded
 */
function bootstrapDocumentHead(): void {
  try {
    const match = document.cookie.match(/(?:^|; )theme=(dark|light)/);
    const stored = localStorage.getItem("theme") || (match ? match[1] : null);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored === "dark" || (!stored && prefersDark);

    document.documentElement.classList.toggle("dark", isDark);

    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta && stored) {
      meta.setAttribute("content", stored);
    }
  } catch {
    // Ignore storage/cookie restrictions in sandboxed environments
  }

  const fontLink = document.getElementById("google-fonts-css");
  if (fontLink instanceof HTMLLinkElement) {
    if (fontLink.sheet) {
      fontLink.media = "all";
    } else {
      fontLink.addEventListener(
        "load",
        () => {
          fontLink.media = "all";
        },
        { once: true },
      );
    }
  }
}

const HEAD_BOOTSTRAP_SCRIPT = `(${bootstrapDocumentHead.toString()})();`;

export default function Document(props: ParentProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <link rel="icon" href="/favicon.ico" />
        <title>Solid 2.0 Baseline Architecture</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
        <link id="google-fonts-css" href={GOOGLE_FONTS_URL} rel="stylesheet" media="print" />
        <noscript>
          <link href={GOOGLE_FONTS_URL} rel="stylesheet" />
        </noscript>
        <script>{HEAD_BOOTSTRAP_SCRIPT}</script>
        <HydrationScript />
      </head>
      <body>{props.children}</body>
    </html>
  );
}
