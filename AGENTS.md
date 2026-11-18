# Architecture & Operational Constitution (2026 Paved Path Edition)

This document is the Single Source of Truth (SSOT) for all architectural invariants, directory boundaries, toolchain protocols, and design system contracts.

---

## 1. Toolchain & Protocol

- **Architecture**: Solid 2.0.0 Start-Mode SPA (`start: true, ssr: false, diagnostics: true`) with module-level `export const router = createRouter({ routes })`, type-safe `router.paths`, lazy route splitting (`lazy(() => import("~/routes/realtime"))`), and tree-scoped Context Providers.
- **Core Stack Versions**:
  - `solid-js`, `@solidjs/web`, `@solidjs/router`, `@solidjs/diagnostics`: `^2.0.0` (GA)
  - `@solidjs/vite-plugin`: `^3.0.1`
  - `@pandacss/{dev,preset-base,preset-panda,vite}`: `^2.5.0`
  - `@ark-ui/solid`: `^5.39.3` (paired with temporary `patches/solid-js@2.0.0.patch`)
  - `spacetimedb`: `^2.15.0`
  - `@biomejs/biome`: `^2.6.4` (`2.6.8` resolved)
- **Same-Origin Dev Proxy & Pure Server Handler**:
  - `server/index.ts` exports a side-effect-free `createRpcHandler()` factory (optional `CORS_ORIGIN` env override, structured JSON request logging, `HealthCheckRequest.service` validation, and graceful shutdown via `await server.stop(true)`). `Bun.serve` and `SIGINT`/`SIGTERM` handlers execute only under `import.meta.main`.
  - `vite.config.ts` proxies `/system.v1.SystemService` and `/healthz` to `http://localhost:8080`; `src/lib/connect.tsx` defaults `DEFAULT_API_BASE_URL` to `import.meta.env?.VITE_API_URL ?? ""` (same-origin relative path).
- **TypeScript Environment Isolation**:
  - Root `tsconfig.json` coordinates three isolated environments via `references`:
    - `tsconfig.app.json`: Client SPA (`src`, `styled-system`, `lib: ["ESNext", "DOM", "DOM.Iterable"]`, `types: ["vite/client"]`).
    - `tsconfig.server.json`: Backend & scripts (`server`, `scripts`, root config files, `lib: ["ESNext"]`, `types: ["bun"]` — strictly zero DOM types).
    - `tsconfig.module.json`: SpacetimeDB server module (`spacetimedb/src`, `lib: ["ESNext"]`, `types: []`).
- **Temporary Ecosystem Bridge (`patches/solid-js@2.0.0.patch`)**:
  - Scoped strictly as a **temporary compatibility bridge for `@ark-ui/solid@5.x` / Zag.js** (`provider.Provider = provider`, `splitProps`, `mergeProps`, `on`, `onMount` -> `onSettled`, cleanup forwarding, 1-arg `createEffect(fn)` -> `createTrackedEffect`, and runtime-only `./web` + `JSX` type re-export). `createSignal` is strictly untouched.
  - Application code in `src/` must **never** call 1-arg `createEffect(fn)` or any legacy 1.x API (enforced by `scripts/check-rails.ts` & Oxlint).
  - **Removal condition**: Once `@ark-ui/solid` v6 releases with native Solid 2.0 support, delete `patches/solid-js@2.0.0.patch` and remove `patchedDependencies` from `package.json`.
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

| Directory                 | Allowed Imports                                                            | Forbidden Imports / Actions                                                                                                                                                                                                     | Responsibility                                                                                                               |
| :------------------------ | :------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------- |
| `src/routes/`             | `~/components/ui`, `~/lib`, `~/schema`, `styled-system/css`, Solid core    | `styled-system/patterns`, `styled-system/jsx`, repeated identical `css()` (>= 3), raw visual/interactive DOM (`button`, `input`, `select`, `textarea`, `h1`-`h6`, `p`, `a`, `hr`, `svg`), direct I/O, `export type`/`interface` | Routed page views. One-off `css()` layout styles, structural HTML tags, and private helper types allowed; no direct I/O.     |
| `src/lib/`                | `~/schema`, `@connectrpc/*`, `spacetimedb`, Solid core                     | Raw visual/interactive DOM, UI primitives, module-level mutable singletons                                                                                                                                                      | Single-responsibility Providers (`TransportProvider`, `RpcProvider`, `SpacetimeProvider`), composable RPC queries, adapters. |
| `src/schema/`             | `@bufbuild/protobuf`, `spacetimedb`, generated contracts                   | UI primitives, DOM, runtime side-effects                                                                                                                                                                                        | Pure SSOT data schemas (ConnectRPC Protobuf + SpacetimeDB SDK `schema()`/`table()`/`reducers()`), context types.             |
| `src/components/ui/`      | `styled-system/*`, `@ark-ui/solid`, `@solidjs/router`                      | Feature routes, schema reducers, ad-hoc inline styles                                                                                                                                                                           | Systematic atomic (`<Icon>`, `<Button>`, `<Input>`), polymorphic Panda JSX layouts (`as="section" \| "form"`), compounds.    |
| `server/`, `spacetimedb/` | `src/schema/connect`, `@connectrpc/*`, `spacetimedb/server`, Bun/Node APIs | `src/components/*`, `@solidjs/web`, `@ark-ui/solid`, `styled-system/*`, browser DOM globals (`window`, `document`, `localStorage`, `HTMLElement`, etc.)                                                                         | Isolated ConnectRPC backend and SpacetimeDB serverless module runtimes.                                                      |

---

## 3. Design System Token Closed World & Zero-Runtime Extraction

All visual properties must resolve to **static, build-time extractable tokens** derived from `~/components/ui/tokens` and `panda.config.ts`:

- **Panda CSS 2.5 Compilation**: Zero-runtime static extraction with `optimize: { removeUnusedTokens: true, removeUnusedKeyframes: true, smartCompoundVariants: true }`, a Solid 2.0 `codegen:prepare` JSX plugin (`solid-2-jsx-compat`), and global `@media (prefers-reduced-motion: reduce)` animation downgrade. Wildcard `staticCss` matrices are prohibited.
- **Native Solid 2.0 `class` Composition**: All UI primitives (and generated Panda JSX components) compose classes with Solid 2.0 native arrays `class={[recipeClass, props.class]}` so array and reactive object `class` values (`class={["custom", { active: cond() }]}`) pass through intact.
- **Static Style Token Rule**: Never pass runtime variables, computed object keys, or dynamic spreads into `css()` or style props (which cause silent missing CSS at build time). Always use literal token strings or static conditional branches (e.g., `tone={ok() ? "success" : "danger"}`, `boxShadow="card"`).
- **Typography Fonts & Inheritance**:
  - `heading`: `'Google Sans Flex', 'MiSans TC', 'PingFang TC', 'Microsoft JhengHei', system-ui, sans-serif`
  - `body`: `'Geist', 'MiSans TC', 'PingFang TC', 'Microsoft JhengHei', system-ui, sans-serif`
  - `mono`: `'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace`
  - `textRecipe` omits `size` from `defaultVariants`; `<Text as="span">` inherits parent font-size when `size` is omitted while block `<Text>` defaults to `"md"`.
- **Spacing Scale (4px/8px Grid)**: `"0"`, `"1"`, `"1.5"`, `"2"`, `"2.5"`, `"3"`, `"4"`, `"5"`, `"6"`, `"8"`, `"10"`, `"12"`, `"16"`, `"20"`.
- **Surfaces**: `"bg.canvas"`, `"bg.default"`, `"bg.elevated"`, `"bg.subtle"`, `"bg.muted"`, `"bg.backdrop"`.
- **Foregrounds**: `"fg.default"`, `"fg.muted"`, `"fg.subtle"`, `"accent.default"`, `"accent.emphasized"`, `"accent.fg"`.
- **Borders**: `"border.subtle"`, `"border.default"`, status borders.
- **Semantic Shadows**: `"card"`, `"modal"`, `"focusRing"`, `"focusRingDanger"` (defined in `semanticTokens.shadows` using Panda opacity syntax `{colors.white/6}`, `{colors.black/40}`, `{colors.slate.900/15}` — zero raw `rgba(...)`).
- **Stacking Scale (Z-Index)**: `"hide"` (-1), `"base"` (0), `"docked"` (10), `"dropdown"` (1000), `"sticky"` (1100), `"banner"` (1200), `"overlay"` (1300), `"modal"` (1400), `"popover"` (1500), `"toast"` (1600), `"tooltip"` (1700), `"max"` (9999).
- **Radii Scale & Concentric Harmony**: `"none"`, `"sm"`, `"md"`, `"l1"`, `"l2"`, `"l3"`, `"full"`. Controls (`Button`, `Input`) standardize on `"l2"`, `NavLink` & `Dialog.CloseButton` & nested list items use `"l1"` inside `"l2"` / `"l3"` containers.
- **Iconography Primitive**: Use `<Icon size="sm" | "md" | "lg">` from `~/components/ui` instead of raw `<svg>` elements or raw UI emojis.
- **Explicit Dialog Close Primitives**: `Dialog.CloseTrigger` is a pure, unstyled Ark UI close trigger (compose with `<Button>` via `asChild={(props) => <Button {...props()} ...>...</Button>}`). Use `<Dialog.CloseButton />` for the canonical top-right close icon button.
- **Polymorphic Panda JSX Layout Primitives**: `<Box>`, `<Container>`, `<VStack>`, `<HStack>`, `<Grid>`, `<Divider>` are thin typed wrappers directly over `styled-system/jsx` with generic `<T extends SemanticContainerTag = "div">` HTML attribute preservation and zero runtime prop-copying helpers.

---

## 4. Solid 2.0 Invariants

1. **No Destructuring**: Component props must never be destructured (`props.prop` only).
2. **Prop Omission**: Strip handled props directly using Solid 2.0 native `omit(props, ...keys)` from `solid-js`.
3. **Shared Signal Attribution**: Always provide `{ name: "..." }` (literal or string-typed option) when creating shared signals, memos, or optimistic states in `src/lib/`.
4. **Split Effects Only**: Never call single-argument `createEffect(fn)`. Always use Solid 2.0 two-argument `createEffect(compute, apply)` (or `createEffect(compute, { effect, error })`) or `onSettled()`.
5. **Controlled & Uncontrolled `<Input>` Contract**: Never write signals inside owned scopes without `{ ownedWrite: true }`.
   - `<Input>` routes synchronously via `untrack(() => props.value !== undefined)` into `ControlledInput` or `UncontrolledInput` sharing `InputBase`.
   - **Controlled** mode binds directly to `props.value` and reconciles `e.currentTarget.value` after `onValueChange` + `flush()` so rejected or formatted input never desynchronizes the DOM.
   - **Uncontrolled** mode binds `defaultValue` only so sibling attribute updates never trigger `UNCOMMITTED_INPUT_OVERWRITTEN`.
6. **Deterministic Hydration & Scoped Providers**:
   - Define `export const router = createRouter({ routes })` once at module level in `src/App.tsx` and use type-safe `router.paths` for navigation links. Import `./index.css` once in `src/App.tsx` (the client entry graph).
   - Keep `<RpcProvider>` service-agnostic at the root (lazy per-service client registry via `useRpcClient()`) and sink `<SpacetimeProvider>` to routes that require realtime state (`/realtime`).
   - Avoid post-mount DOM reads (`onSettled`) for theme icons; use pure Panda CSS `_dark` visibility branches (`ThemeToggle` with explicit `aria-label` & `title`) and sync theme preferences to `document.cookie` (`theme=dark|light`) + `localStorage` + `<meta name="color-scheme">`.
7. **Declarative Async Queries & Self-Healing Boundaries**: Use composable `createRpcQuery()` (backed by `createMemo` returning Promises, `flush()` + `resolve()`, `affects()` / `refresh()`, and `isPending()`) paired with fine-grained `<AsyncBoundary onRetry={...}>` wrapping async result panels so headers and trigger buttons stay mounted.
8. **SpacetimeDB SSOT & Fine-Grained Draft Mutations**: Define tables and reducers once in `src/schema/spacetimedb.ts` via `spacetimedb` SDK `schema()` / `table()` / `reducers()`. All records use standard ISO-8601 UTC timestamps formatted in the UI layer. `LiveSpacetimeAdapter` clears `identity` and notifies listeners on `onDisconnect`, clears error state on `onAutomaticReconnect`, and exposes typed `reducers` methods (`adapter.reducers.txEvent(...)`). Mutate `createStore` drafts in place on `onInsert` / `onUpdate` / `onDelete`; use `reconcile` only for bulk snapshots (`onApplied`).
9. **SPA Router Primitives**: Use `<NavLink>` backed by `@solidjs/router` 2.0 native link delegation, `useHref()`, and `useLinkState(..., { end })` directly through lightweight accessors with `router.paths` for zero-reload SPA transitions and `aria-current="page"` semantics.

---

## 5. Automated Rail Gatekeeper (`scripts/check-rails.ts`)

The semantic AST analyzer (configured with `jsxImportSource: "@solidjs/web"`) enforces 16 invariants across `src/`, `server/`, and `spacetimedb/`:

1. `INLINE_STYLE_FORBIDDEN`: No `style=` attributes.
2. `HEX_COLOR_HARDCODED`: No `#hex` colors inside JSX style attributes or `css()`/`cva()`/`sva()` style objects.
3. `RAW_COLOR_FUNCTION`: No `rgb()`, `rgba()`, `hsl()`, `hsla()`, `oklch()` inside JSX style attributes or style objects.
4. `ARBITRARY_Z_INDEX`: TypeChecker verification ensuring all `zIndex` values in JSX/styles resolve to canonical tokens.
5. `MARGIN_PROP_FORBIDDEN`: Push margins banned in JSX attributes and style calls (only `ml/mr/mx="auto"` allowed for flex alignment).
6. `RAW_DOM_ELEMENT_BANNED`: Raw visual/interactive HTML tags (`button`, `input`, `select`, `textarea`, `h1`-`h6`, `p`, `a`, `hr`, `svg`) banned outside `src/components/ui/` and `src/Document.tsx`; structural tags (`div`, `section`, `main`, `nav`, `header`, `footer`, `article`, `aside`, `ul`, `ol`, `li`, `form`, `label`, `span`) are permitted.
7. `ADHOC_CSS_IN_FEATURE_BANNED` / `REPEATED_ADHOC_CSS_BANNED`: Direct imports from `styled-system/patterns` and `styled-system/jsx` are banned outside `src/components/ui/`; one-off `css()` from `styled-system/css` is permitted in routes/features, while identical `css()` blocks repeated `>= 3` times must be extracted into `cva()` or `panda.config.ts` recipes.
8. `UNSCOPED_TYPE_DEFINITION`: Exported `interface` / `type` declarations banned in `src/routes/` (domain contracts belong in `src/schema/`; `src/lib/` may export its own client/hook configuration types).
9. `TYPE_ESCAPE_HATCH_BANNED`: `as any`, `@ts-ignore`, and `@ts-expect-error` banned.
10. `LEGACY_SOLID_API_BANNED`: Solid 1.x APIs (`onMount`, `splitProps`, `mergeProps`, etc.) banned.
11. `UNNAMED_REACTIVE_PRIMITIVE`: Name attribute `{ name: ... }` enforced on shared reactive primitives in `src/lib/`.
12. `LEGACY_TYPOGRAPHY_PROP_BANNED`: Legacy props (`color=`, `fontWeight=`, etc.) banned on `<Text>`/`<Heading>`/`<Code>`.
13. `COMPONENT_PARAM_DESTRUCTURE_BANNED`: Component parameter destructuring banned.
14. `UNSCOPED_IO_CALL_BANNED`: Direct `fetch()` calls or `DbConnection` instantiations banned in `src/routes/`.
15. `SINGLE_ARG_CREATE_EFFECT_BANNED`: Single-argument `createEffect(fn)` banned across `src/` to prevent accidentally invoking the temporary Ark UI 5.x compatibility bridge; requires split `createEffect(compute, apply)` or `onSettled()`.
16. `CROSS_RUNTIME_IMPORT_BANNED`: `server/` and `spacetimedb/` must never import `src/components/*`, `@solidjs/web`, `@ark-ui/solid`, `styled-system/*`, or reference browser DOM globals (`window`, `document`, `localStorage`, `HTMLElement`, etc.).
