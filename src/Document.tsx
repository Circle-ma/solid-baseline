import { HydrationScript } from "@solidjs/web";
import type { ParentProps } from "solid-js";
import "./index.css";

export default function Document(props: ParentProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <title>Solid 2.0 Baseline Architecture</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&family=Geist:wght@100..900&family=Google+Sans+Flex:opsz,wght@6..72,100..1000&display=swap"
          rel="stylesheet"
        />
        <script>
          {
            '(function(){try{var stored=localStorage.getItem("theme");var prefersDark=window.matchMedia("(prefers-color-scheme: dark)").matches;if(stored==="dark"||(!stored&&prefersDark)){document.documentElement.classList.add("dark");}else{document.documentElement.classList.remove("dark");}}catch(e){}})();'
          }
        </script>
        <HydrationScript />
      </head>
      <body>{props.children}</body>
    </html>
  );
}
