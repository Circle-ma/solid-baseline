# Architecture & Operational Constitution (2026 Paved Path Edition)

This document is the Single Source of Truth (SSOT) for all architectural invariants, directory boundaries, toolchain protocols, and design system contracts.

---

## 1. Toolchain & Protocol

- **Architecture**: Solid 2.0.0 Start-Mode Client SPA (`start: true, ssr: false, diagnostics: true`) mounted onto a prerendered static `Document.tsx` shell, with module-level `export const router = createRouter({ routes, preloadLinks: intentPreload(), links: pendingLinks })`, type-safe `router.paths`, catch-all `*` 404 route, `#main-content` skip link, lazy route splitting (`lazy(() => import("~/routes/realtime"))`), and tree-scoped Context Providers.
  - **SSR Boundary (Honest Contract)**: Full streaming SSR (`ssr: true`) is intentionally disabled by default because `src/lib/connect.tsx` defaults to client same-origin relative URLs (`""`) and theme state is bootstrapped client-side in `Document.tsx` (`localStorage` / `document.cookie`). Enabling `ssr: true` requires supplying an absolute server-side origin to `<RpcProvider baseUrl={...}>` and reading the `theme` cookie on the server.
- **Core Stack Versions**:
  - `solid-js`, `@solidjs/web`, `@solidjs/router`, `@solidjs/diagnostics`: `^2.0.0` (GA)
  - `@solidjs/vite-plugin`: `^3.0.1`
  - `@pandacss/{dev,preset-base,preset-panda,vite}`: `^2.5.0`
  - `@ark-ui/solid`: `^5.39.3` (paired with temporary `patches/solid-js@2.0.0.patch`)
  - `spacetimedb`: `^2.15.0`
  - `@biomejs/biome`: `^2.6.4`
- **Same-Origin Dev Proxy & Hardened Server Handler**:
  - `server/index.ts` exports a side-effect-free `createRpcHandler()` factory (optional `CORS_ORIGIN` env override, structured JSON request logging, `HealthCheckRequest.service` validation, `GET /healthz`, `GET /readyz` returning `200`/`503`, and bounded request payload defense returning `413 Payload Too Large` on oversized headers or streams) plus a two-stage `gracefulShutdown()` helper (`server.stop(false)` to drain in-flight requests up to 5s, escalating to `server.stop(true)` only on timeout). `Bun.serve` and `SIGINT`/`SIGTERM` handlers execute only under `import.meta.main`.
  - `vite.config.ts` proxies `/system.v1.SystemService`, `/healthz`, and `/readyz` to `http://localhost:8080`; `src/lib/connect.tsx` defaults `DEFAULT_API_BASE_URL` to `import.meta.env?.VITE_API_URL ?? ""` (same-origin relative path).
  - `scripts/dev.ts` spawns `server/index.ts` (`stdin: "ignore"`) and `dev:client` (`stdin: "inherit"`) without stdin contention, propagates unexpected child exits cleanly, and terminates both children on `SIGINT`/`SIGTERM`.
- **TypeScript Environment Isolation**:
  - Root `tsconfig.json` coordinates three isolated environments via `references`:
    - `tsconfig.app.json`: Client SPA (`src`, `styled-system`, excluding `styled-system/jsx` and `styled-system/types/jsx.d.ts`, `lib: ["ESNext", "DOM", "DOM.Iterable"]`, `types: ["vite/client"]`).
    - `tsconfig.server.json`: Backend & scripts (`server`, `scripts`, root config files, `lib: ["ESNext"]`, `types: ["bun"]` — strictly zero DOM types).
    - `tsconfig.module.json`: SpacetimeDB server module (`spacetimedb/src`, `lib: ["ESNext"]`, `types: []`).
- **Temporary Ecosystem Bridge (`patches/solid-js@2.0.0.patch`)**:
  - Scoped strictly as a **temporary compatibility bridge for `@ark-ui/solid@5.x` / Zag.js** (`provider.Provider = provider`, `splitProps`, `mergeProps`, `on`, `onMount` -> `onSettled`, cleanup forwarding, 1-arg `createEffect(fn)` -> `createTrackedEffect`, and runtime-only `./web` + `JSX` type re-export). `createSignal` is strictly untouched.
  - Application code in `src/` must **never** call 1-arg `createEffect(fn)` or any legacy 1.x API (enforced by `scripts/check-rails.ts` & Oxlint).
  - **Upstream Expectation (Honest Timeline)**: Do **not** assume the initial `@ark-ui/solid` v6.0 release automatically ships native Solid 2.0 support. Ark UI v6 currently gates on Zag v2 stabilization with Solid 2.0 support tracked as under evaluation; v6 also plans to deprecate `asChild` in favor of a `render` prop.
  - **Freeze Policy**: Until `@zag-js/solid` 2.x and `@ark-ui/solid` officially ship native Solid 2.0 support, **do not expand** the compatibility surface of `patches/solid-js@2.0.0.patch`. Keep only the diagnostics-verified `<Dialog>` primitive as the reference template.
  - **Zero-Residue Upstream Upgrade Checklist** (execute atomically once native Solid 2.0 support lands upstream):
    1. Delete `patches/solid-js@2.0.0.patch`, remove `patchedDependencies` from `package.json`, and upgrade `@ark-ui/solid` (or adopt `@zag-js/solid` 2.x directly as needed).
    2. Remove `serializeArkClass` from `src/components/ui/dialog.tsx`, verify native array `class` and Portal/Presence lifecycle, and migrate `Dialog.CloseTrigger` (including `src/routes/overview.tsx` and `src/__tests__/diagnostics.test.tsx`) from `asChild` to the new `render` prop.
    3. Update `scripts/check-rails.ts` Rule #14 (`SINGLE_ARG_CREATE_EFFECT_BANNED`) diagnostic wording — retain the two-argument `createEffect` check (or delegate to Oxlint `v2-strict`) while removing references to the temporary patch.
    4. Remove the temporary bridge sections from `AGENTS.md`, `README.md`, and `.agents/skills/ark-ui-solid/SKILL.md`.
- **Runtime**: Strictly `bun` and `bunx`. Never invoke `npm`, `npx`, `yarn`, or `pnpm`.
- **Pre-Commit Verification**: `bun run codegen && bun run format && bun run check && bun run typecheck && bun run build` must pass with 0 errors and 0 warnings.
- **Commands**:
  - Format: `bun run format` (`biome format --write .`)
  - Lint: `bun run lint` (`oxlint src server scripts spacetimedb`)
  - Rails Gatekeeper: `bun run check:rails` (`bun run scripts/check-rails.ts`)
  - Check Pipeline: `bun run check` (`oxlint src server scripts spacetimedb && biome check . && bun run scripts/check-rails.ts && vitest run`)
  - Typecheck: `bun run typecheck` (`tsc -p tsconfig.app.json --noEmit && tsc -p tsconfig.server.json --noEmit && tsc -p tsconfig.module.json --noEmit`)
  - Codegen: `bun run codegen` (`panda codegen --spec`)
  - SpacetimeDB Bindings: `bun run spacetime:generate` (`spacetime generate --lang typescript --out-dir src/module_bindings --project-path spacetimedb`)
  - SpacetimeDB Publish: `bun run spacetime:publish` (`spacetime publish --project-path spacetimedb --server http://localhost:3001 system_db`)
  - Build: `bun run build` (`vite build` — `@pandacss/vite` 2.5 handles CSS extraction automatically)

---

## 2. Architectural Boundaries & Directory Matrix

| Directory                 | Allowed Imports                                                                                            | Forbidden Imports / Actions                                                                                                                                                    | Responsibility                                                                                                                                                                   |
| :------------------------ | :--------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/routes/`             | `~/components/ui`, `~/lib`, `~/schema`, `styled-system/css`, Solid core                                    | `styled-system/jsx`, `styled-system/patterns`, raw token-bypassing controls (`button`, `input`, `textarea`, `svg`), direct `fetch()`/`DbConnection`, `export type`/`interface` | Routed page views. One-off `css()` styles, semantic/structural HTML (`div`, `section`, `p`, `h1`-`h6`, `select`, `a`), private types.                                            |
| `src/lib/`                | `~/schema`, `@connectrpc/*`, `spacetimedb`, Solid core                                                     | Raw visual/interactive DOM, UI primitives, module-level mutable singletons                                                                                                     | Single-responsibility Providers (`TransportProvider`, `RpcProvider`, `SpacetimeProvider`), composable RPC queries, adapters.                                                     |
| `src/schema/`             | `@bufbuild/protobuf`, `spacetimedb`, generated contracts                                                   | UI primitives, DOM, runtime side-effects                                                                                                                                       | Pure SSOT data schemas (ConnectRPC Protobuf + SpacetimeDB SDK `schema()`/`table()`/`reducers()`), context types.                                                                 |
| `src/components/ui/`      | `styled-system/css`, `styled-system/patterns`, `styled-system/recipes`, `@ark-ui/solid`, `@solidjs/router` | `styled-system/jsx`, feature routes, direct `fetch()`/`DbConnection`, inline `style=`                                                                                          | Systematic primitives (`Badge`, `AsyncBoundary`, `Button`, `Card`, `Dialog`, `Icon`, `Input`, `Textarea`, `Layout`, `Link`, `NavLink`, `Skeleton`, `ThemeToggle`, `Typography`). |
| `server/`, `spacetimedb/` | `src/schema/connect`, `@connectrpc/*`, `spacetimedb/server`, Bun/Node APIs                                 | `src/components/*`, `@solidjs/web`, `@ark-ui/solid`, `styled-system/*`, browser DOM globals (`window`, `document`, `localStorage`, `HTMLElement`, etc.)                        | Isolated ConnectRPC backend and SpacetimeDB serverless module runtimes.                                                                                                          |

---

## 3. Design System Token Closed World & Zero-Runtime Extraction

All visual properties must resolve to **static, build-time extractable tokens** derived from `~/components/ui/tokens` and `panda.config.ts`:

- **Panda CSS 2.5 Compilation (Zero Regex Hacks)**:
  - Zero-runtime static extraction with `optimize: { removeUnusedTokens: true, removeUnusedKeyframes: true, smartCompoundVariants: true }` and global `@media (prefers-reduced-motion: reduce)` animation downgrade.
  - `panda.config.ts` sets `jsxFramework: "solid"` purely so Panda's static extractor scans JSX recipe variants and layout style props (`<Box>`, `<VStack>`, `<Grid>`, `<Button>`, `<Card.Root>`, etc.); **zero codegen regex plugins exist**, `tsconfig.app.json` excludes `styled-system/jsx` and `styled-system/types/jsx.d.ts`, and `styled-system/jsx` imports are banned across all of `src/`.
  - `src/components/ui/layout.tsx` implements pure Solid 2.0 polymorphic primitives (`<Box>`, `<Container>`, `<VStack>`, `<HStack>`, `<Grid>`, `<Divider>`) directly on `styled-system/patterns`, `@solidjs/web` `<Dynamic>`, and native `omit()`. Callers pass pattern props explicitly (e.g., `<Divider color="border.subtle" />`) with zero hidden runtime prop remapping.
- **Native Solid 2.0 `class` Composition**: All UI primitives compose classes with Solid 2.0 native arrays `class={[recipeClass, props.class]}` so array and reactive object `class` values (`class={["custom", { active: cond() }]}`) pass through intact.
- **Static Style Token Rule**: Never pass runtime variables, computed object keys, or dynamic spreads into `css()` or style props. Always use literal token strings or static conditional branches (e.g., `tone={ok() ? "success" : "danger"}`, `variant="elevated"`).
- **Typography & Self-Hosted Fonts**:
  - `heading`: `'Google Sans Flex', 'PingFang TC', 'Microsoft JhengHei', system-ui, sans-serif`
  - `body`: `'Geist', 'PingFang TC', 'Microsoft JhengHei', system-ui, sans-serif`
  - `mono`: `'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace`
  - Do not commit multi-MB uncompressed `.ttf` fonts into `public/`. Optional self-hosted fonts must use compressed `.woff2`, lowercase kebab-case filenames without spaces (e.g., `/fonts/misans-tc-vf.woff2`), and `unicode-range` (documented in `src/index.css`).
  - `textRecipe` omits `size` from `defaultVariants`; `<Text as="span">` inherits parent font-size when `size` is omitted while block `<Text>` defaults to `"md"`.
- **Spacing Scale**: `SpacingRailToken = Exclude<SpacingToken, \`-\${string}\`>`derived directly from Panda's generated`SpacingToken` union (no manual duplicate lists).
- **Distinct Light & Dark Surface Hierarchy**:
  - `bg.canvas` (`slate.100` / `slate.950`) -> `bg.default` (`slate.50` / `slate.900`) -> `bg.elevated` (`white` / `slate.800`) -> `bg.subtle` (`slate.200/60` / `slate.800/70`) -> `bg.muted` (`slate.200` / `slate.700`), plus `bg.backdrop`.
- **Unified Focus Ring Specification**: All interactive primitives (`Button`, `Input`, `Textarea`, `NavLink`, `Link`, `Dialog.CloseButton`) standardize on `_focusVisible` `outline` (`2px solid accent.default`, `outlineOffset: "2px"`, switching to `danger.default` on danger/invalid states) for High Contrast Mode (`forced-colors`) compatibility.
- **Semantic Shadows**: `"card"`, `"elevated"`, `"modal"` (defined in `semanticTokens.shadows` using Panda opacity syntax — zero raw `rgba(...)`).
- **Stacking Scale (Z-Index)**: `"hide"` (-1), `"base"` (0), `"docked"` (10), `"dropdown"` (1000), `"sticky"` (1100), `"banner"` (1200), `"overlay"` (1300), `"modal"` (1400), `"popover"` (1500), `"toast"` (1600), `"tooltip"` (1700), `"max"` (9999).
- **Unified Radii Scale & Concentric Harmony**: `"none"`, `"l1"`, `"l2"`, `"l3"`, `"full"` across all recipes (including `Code` using `"l1"`). Controls (`Button`, `Input`, `Textarea`) standardize on `"l2"`; `NavLink`, `Link`, `Code`, `Dialog.CloseButton`, and nested list items use `"l1"` inside `"l2"` / `"l3"` containers.
- **Card Slot Recipe**: `Card.Root` supports `variant="outline" | "elevated" | "subtle"` and `density="normal" | "compact"`, propagated reactively to `Card.Header`, `Card.Title`, `Card.Description`, `Card.Body`, and `Card.Footer` via `CardStylesContext`.
- **UI Primitive Inventory (`~/components/ui`)**:
  - Layout: `Box`, `Container`, `VStack`, `HStack`, `Grid`, `Divider`
  - Typography & Media: `Heading`, `Text`, `Code`, `Icon`, `Badge`, `Skeleton`
  - Navigation & Links: `NavLink` (Solid Router 2.0 SPA navigation with `data-active`, `data-pending`, `aria-current="page"`), `Link` (inline/external hyperlinks with automatic `target="_blank"` + `rel="noopener noreferrer"` when `external`)
  - Inputs & Actions: `Button`, `Input`, `Textarea`, `ThemeToggle`
  - Surfaces & Overlays: `Card` (`Root`, `Header`, `Title`, `Description`, `Body`, `Footer`), `Dialog` (`Root`, `Trigger`, `Portal`, `Backdrop`, `Positioner`, `Content`, `Header`, `Title`, `Description`, `Body`, `Footer`, `CloseTrigger`, `CloseButton`), `AsyncBoundary`

---

## 4. Solid 2.0 Invariants

1. **No Destructuring**: Component props must never be destructured (`props.prop` only).
2. **Prop Omission**: Strip handled props directly using Solid 2.0 native `omit(props, ...keys)` from `solid-js`.
3. **Shared Signal Attribution**: Always provide `{ name: "..." }` (literal or string-typed option) when creating shared signals, memos, or optimistic states in `src/lib/`.
4. **Split Effects Only**: Never call single-argument `createEffect(fn)`. Always use Solid 2.0 two-argument `createEffect(compute, apply)` (or `createEffect(compute, { effect, error })`) or `onSettled()`.
5. **Controlled & Uncontrolled `<Input>` / `<Textarea>` Contract**:
   - Synchronously routes via `untrack(() => props.value !== undefined)` into dedicated controlled/uncontrolled branches with direct fine-grained attribute bindings (no double-spreads).
   - **Controlled** mode never calls synchronous `flush()` in `onInput`; it schedules DOM drift reconciliation inside Solid 2.0 `onFlush()` and preserves cursor `selectionStart`/`selectionEnd` when a parent rejects or formats input. Supports both function and Solid `[handler, data]` tuple `onInput` handlers.
   - **Uncontrolled** mode binds `defaultValue` only so sibling attribute updates never trigger `UNCOMMITTED_INPUT_OVERWRITTEN`.
6. **Presence-Aware `<Dialog>` & Accessible `<ThemeToggle>`**:
   - `<Dialog.Root>` defaults `lazyMount` and `unmountOnExit` to `true`; `<Dialog.Portal>` gates on `usePresenceContext()` (`presence().present || !presence().unmounted`), and `DialogBackdrop`/`DialogPositioner`/`DialogContent` bind `useDialogContext()` + `usePresenceContext()` directly with `untrack(() => presence().ref)` so `overlayFadeOut` / `dialogScaleOut` animations play on the same DOM node before unmounting on `animationend`.
   - `<ThemeToggle>` uses pure Panda CSS `_dark` visibility branches with non-conflicting `sr-only` accessible text (`Switch to dark mode` / `Switch to light mode`) and no overriding static `aria-label`, syncing to `document.documentElement.classList`, `<meta name="color-scheme">`, `localStorage`, and `document.cookie`.
7. **Declarative Async Queries & Self-Healing Boundaries**:
   - `createRpcQuery()` uses `createMemo` returning a Promise + `isPending()` + `affects()` / `refresh()`, settles `execute()` via `onFlush()` + `resolve()` (zero synchronous `flush()`), and aborts superseded or unmounted in-flight requests via `AbortController` + `onCleanup()` passed to ConnectRPC (`{ signal }`).
   - `<AsyncBoundary>` reads `err()` reactively inside JSX (no stale `untrack` snapshot) and renders `<Skeleton>` as its default loading fallback.
   - `Realtime` symmetrically guards both `<SpacetimeProvider>` and `<RpcProvider>` via `useOptionalSpacetime()` / `useOptionalRpc()` and accurately distinguishes all `HealthCheckStatus` enum states (`SERVING`, `NOT_SERVING`, `UNKNOWN`, `UNSPECIFIED`).
8. **SpacetimeDB SSOT & Authoritative Snapshot Sync**:
   - Tables and reducers derive from `src/schema/spacetimedb.ts` (`spacetimedb@^2.15.0` `schema()` / `table()` / `reducers()`), with a fully typed SDK builder adapter (zero `as unknown as` casts) and `crypto.randomUUID()`-backed short IDs.
   - `LiveSpacetimeAdapter` always dispatches `onSnapshot(initialRows)` on `onApplied` — including empty `[]` snapshots — so connecting to an empty live database clears any local rows. `toggleSimulationMode()` clears simulated data on switching to `live` and re-initializes clean local seeds when returning to `local-cache`.
   - Mutate `createStore` drafts in place on `onInsert` / `onUpdate` / `onDelete`; use `reconcileTableStore` (`reconcile`) for bulk snapshots.
9. **SPA Router Primitives**: Use `<NavLink>` backed by `@solidjs/router` 2.0 `useHref()` and `useLinkState(..., { end })` with `router.paths`, `preloadLinks: intentPreload()`, and `links: pendingLinks` (`data-pending` transition styling). Use `<Link>` for inline and external links (`external` auto-hardens `target="_blank"` and `rel="noopener noreferrer"`).

---

## 5. Automated Rail Gatekeeper (`scripts/check-rails.ts`)

The semantic AST analyzer constructs isolated strict TypeScript programs from `tsconfig.app.json`, `tsconfig.server.json`, and `tsconfig.module.json` and enforces **15** calibrated architectural invariants across `src/`, `server/`, and `spacetimedb/src/`:

1. `INLINE_STYLE_FORBIDDEN`: No `style=` attributes on JSX.
2. `HEX_COLOR_HARDCODED`: No `#hex` colors inside JSX style attributes or `css()`/`cva()`/`sva()`/pattern calls.
3. `RAW_COLOR_FUNCTION`: No `rgb()`, `rgba()`, `hsl()`, `hsla()`, `oklch()` inside JSX style attributes or style objects.
4. `ARBITRARY_Z_INDEX`: TypeChecker verification ensuring all `zIndex` values in JSX/styles resolve to canonical tokens.
5. `RAW_DOM_ELEMENT_BANNED`: Raw interactive/icon controls that bypass canonical UI primitives (`button`, `input`, `textarea`, `svg`) banned outside `src/components/ui/` and `src/Document.tsx` (semantic content tags `p`, `h1`-`h6`, `hr`, structural tags, `select`, and `a` are permitted).
6. `STYLE_RUNTIME_IMPORT_BANNED`: `styled-system/jsx` banned everywhere in `src/`; `styled-system/patterns` banned outside `src/components/ui/` (one-off `css()` from `styled-system/css` is permitted freely).
7. `UNSCOPED_TYPE_DEFINITION`: Exported `interface` / `type` declarations banned in `src/routes/` (domain contracts live in `src/schema/`).
8. `TYPE_ESCAPE_HATCH_BANNED`: `as any`, `@ts-ignore`, and `@ts-expect-error` banned across `src/`, `server/`, and `spacetimedb/src/`.
9. `LEGACY_SOLID_API_BANNED`: Solid 1.x APIs (`onMount`, `splitProps`, `mergeProps`, `createResource`, `createComputed`, `Suspense`, `SuspenseList`, `ErrorBoundary`, `Index`, `batch`) banned in `src/`.
10. `UNNAMED_REACTIVE_PRIMITIVE`: `{ name: ... }` diagnostic attribution enforced on shared reactive primitives in `src/lib/`.
11. `LEGACY_TYPOGRAPHY_PROP_BANNED`: Legacy props (`color=`, `fontWeight=`, `lineHeight=`, `letterSpacing=`) banned on `<Text>`/`<Heading>`/`<Code>`.
12. `COMPONENT_PARAM_DESTRUCTURE_BANNED`: Component parameter destructuring banned in `src/`.
13. `UNSCOPED_IO_CALL_BANNED`: Direct `fetch()` calls or `DbConnection` instantiations banned in `src/routes/` and `src/components/`.
14. `SINGLE_ARG_CREATE_EFFECT_BANNED`: Single-argument `createEffect(fn)` banned across `src/` to prevent accidentally invoking the temporary Ark UI 5.x compatibility bridge.
15. `CROSS_RUNTIME_IMPORT_BANNED`: `server/` and `spacetimedb/` must never import `src/components/*`, `@solidjs/web`, `@ark-ui/solid`, `styled-system/*`, or reference browser DOM globals (`window`, `document`, `localStorage`, `HTMLElement`, etc.).
