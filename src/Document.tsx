import { HydrationScript } from "@solidjs/web";
import type { ParentProps } from "solid-js";
import "./index.css";

const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400..700&family=Geist:wght@400..700&family=Google+Sans+Flex:opsz,wght@6..72,400..700&display=swap";

const HEAD_BOOTSTRAP_SCRIPT =
  '(function(){try{var match=document.cookie.match(/(?:^|; )theme=(dark|light)/);var stored=localStorage.getItem("theme")||(match?match[1]:null);var prefersDark=window.matchMedia("(prefers-color-scheme: dark)").matches;var isDark=stored==="dark"||(!stored&&prefersDark);document.documentElement.classList.toggle("dark",isDark);var meta=document.querySelector(\'meta[name="color-scheme"]\');if(meta&&stored){meta.setAttribute("content",stored);}}catch(e){}var fontLink=document.getElementById("google-fonts-css");if(fontLink){if(fontLink.sheet){fontLink.media="all";}else{fontLink.addEventListener("load",function(){fontLink.media="all";},{once:true});}}})();';

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
        <link rel="preload" as="style" href={GOOGLE_FONTS_URL} />
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
