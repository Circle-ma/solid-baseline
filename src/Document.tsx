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
        <HydrationScript />
      </head>
      <body>{props.children}</body>
    </html>
  );
}
