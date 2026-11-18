# Architecture & Operational Constitution (2026 Paved Path Edition)

This document is the Single Source of Truth (SSOT) for all architectural invariants, directory boundaries, toolchain protocols, and design system contracts.

---

## 1. Toolchain & Protocol

- **Architecture**: Solid 2.0.0 Start-Mode SPA (`start: true, ssr: false, diagnostics: true`), SSR-isolation ready via per-request `createAppRouter()` and tree-scoped Context Providers.
- **Core Stack Versions**:
  - `solid-js`, `@solidjs/web`, `@solidjs/router`, `@solidjs/diagnostics`: `^2.0.0` (GA)
  - `@solidjs/vite-plugin`: `^3.0.1`
  - `@pandacss/{dev,preset-base,preset-panda,vite}`: `^2.5.0`
  - `@ark-ui/solid`: `^5.39.3` (paired with temporary `patches/solid-js@2.0.0.patch`)
  - `spacetimedb`: `^2.15.0`
  - `@biomejs/biome`: `^2.6.4` (`2.6.8` resolved)
- **Temporary Ecosystem Bridge (`patches/solid-js@2.0.0.patch`)**:
  - Scoped strictly as a **temporary compatibility bridge for `@ark-ui/solid@5.x` / Zag.js** (`provider.Provider = provider`, `splitProps`, `mergeProps`, `on`, `onMount` -> `onSettled`, cleanup forwarding, 1-arg `createEffect(fn)` -> `createTrackedEffect`, and runtime-only `./web` + `JSX` type re-export). `createSignal` is strictly untouched.
  - Application code in `src/` must **never** call 1-arg `createEffect(fn)` or any legacy 1.x API (enforced by `scripts/check-rails.ts` & Oxlint).
  - **Removal condition**: Once `@ark-ui/solid` v6 releases with native Solid 2.0 support, delete `patches/solid-js@2.0.0.patch` and remove `patchedDependencies` from `package.json`.
- **Runtime**: Strictly `bun` and `bunx`. Never invoke `npm`, `npx`, `yarn`, or `pnpm`.
- **Pre-Commit Verification**: `bun run codegen && bun run check && bun run typecheck && bun run build` must pass with 0 errors and 0 warnings.
- **Commands**:
  - Format: `bun run format` (`biome format --write .`)
  - Rails Gatekeeper: `bun run check:rails` (`bun run scripts/check-rails.ts`)
  - Check Pipeline: `bun run check` (`oxlint src && biome check . && bun run check:rails && vitest run`)
  - Typecheck: `bun run typecheck` (`tsc --noEmit`)
  - Codegen: `bun run codegen` (`panda codegen --spec`)
  - Build: `bun run build` (`panda codegen && vite build`)

---

## 2. Architectural Boundaries & Directory Matrix

| Directory            | Allowed Imports                                        | Forbidden Imports / Actions                                                                                                      | Responsibility                                                                                                 |
| :------------------- | :----------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| `src/routes/`        | `~/components/ui`, `~/lib`, `~/schema`, Solid core     | `styled-system/*`, raw DOM (`div`, `section`, `nav`, `ul`, `li`, `form`, etc.), direct `fetch`, `DbConnection`, entity/RPC types | Routed page views. Local non-exported `*Props`/`*View`/`*ViewModel`/`*State` UI types allowed; no direct I/O.  |
| `src/lib/`           | `~/schema`, `@connectrpc/*`, `spacetimedb`, Solid core | Raw DOM, UI primitives, module-level mutable singletons, ad-hoc `type`/`interface`                                               | Single-responsibility Providers (`TransportProvider`, `RpcProvider`, `SpacetimeProvider`), adapters.           |
| `src/schema/`        | `@bufbuild/protobuf`, generated contracts              | UI primitives, DOM, runtime side-effects                                                                                         | Pure SSOT data schemas, tables, reducers, RPC contracts, and shared context interfaces.                        |
| `src/components/ui/` | `styled-system/*`, `@ark-ui/solid`, `@solidjs/router`  | Feature routes, schema reducers, ad-hoc inline styles                                                                            | Systematic atomic (`<Icon>`, `<Button>`, `<Input>`), semantic layout (`as="section" \| "nav"`), and compounds. |

---

## 3. Design System Token Closed World & Zero-Runtime Extraction

All visual properties must resolve to **static, build-time extractable tokens** derived from `~/components/ui/tokens` and `panda.config.ts`:

- **Panda CSS 2.5 Compilation**: Zero-runtime static extraction with `optimize: { removeUnusedTokens: true, removeUnusedKeyframes: true, smartCompoundVariants: true }`. Wildcard `staticCss` matrices are prohibited.
- **Static Style Token Rule**: Never pass runtime variables, computed object keys, or dynamic spreads into `css()` or style props (which cause silent missing CSS at build time). Always use literal token strings or static conditional branches (e.g., `tone={ok() ? "success" : "danger"}`, `boxShadow="card"`).
- **Typography Fonts**:
  - `heading`: `'Google Sans Flex', 'MiSans TC', 'PingFang TC', 'Microsoft JhengHei', system-ui, sans-serif`
  - `body`: `'Geist', 'MiSans TC', 'PingFang TC', 'Microsoft JhengHei', system-ui, sans-serif`
  - `mono`: `'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace`
- **Spacing Scale (4px/8px Grid)**: `"0"`, `"1"`, `"1.5"`, `"2"`, `"2.5"`, `"3"`, `"4"`, `"5"`, `"6"`, `"8"`, `"10"`, `"12"`, `"16"`, `"20"`.
- **Surfaces**: `"bg.canvas"`, `"bg.default"`, `"bg.elevated"`, `"bg.subtle"`, `"bg.muted"`, `"bg.backdrop"`.
- **Foregrounds**: `"fg.default"`, `"fg.muted"`, `"fg.subtle"`, `"accent.default"`, `"accent.emphasized"`, `"accent.fg"`.
- **Borders**: `"border.subtle"`, `"border.default"`, status borders.
- **Semantic Shadows**: `"card"`, `"modal"` (defined in `semanticTokens.shadows` with automatic `_dark` variants — zero raw `rgba(...)` in recipes).
- **Stacking Scale (Z-Index)**: `"hide"` (-1), `"base"` (0), `"docked"` (10), `"dropdown"` (1000), `"sticky"` (1100), `"banner"` (1200), `"overlay"` (1300), `"modal"` (1400), `"popover"` (1500), `"toast"` (1600), `"tooltip"` (1700), `"max"` (9999).
- **Radii Scale**: `"none"`, `"sm"`, `"md"`, `"l1"`, `"l2"`, `"l3"`, `"full"`.
- **Iconography Primitive**: Use `<Icon size="sm" | "md" | "lg">` from `~/components/ui` instead of raw `<svg>` elements.
- **Semantic Layout Primitives**: Use `<Box as="main">`, `<VStack as="section">`, `<HStack as="nav">`, `<VStack as="ul">`, `<HStack as="li">` via the unified `BaseStyleProps` and `extractStyleProps` architecture.

---

## 4. Solid 2.0 Invariants

1. **No Destructuring**: Component props must never be destructured (`props.prop` only).
2. **Prop Omission**: Strip handled props using `omitProps(props, ...keys, "class", "children", "style")`.
3. **Signal Attribution**: Always provide `{ name: "..." }` when creating signals, memos, or optimistic states.
4. **Split Effects Only**: Never call single-argument `createEffect(fn)`. Always use Solid 2.0 two-argument `createEffect(compute, apply)` (or `createEffect(compute, { effect, error })`) or `onSettled()`.
5. **Controlled & Uncontrolled `<Input>` Contract**: Never write signals inside owned scopes without `{ ownedWrite: true }`.
   - For **controlled** inputs, always pass a defined string value: `<Input value={val() ?? ""} onValueChange={setVal} />` (backed internally by `createSignal(() => String(props.value ?? ""))`). Never flip between `value={undefined}` and `value="..."`.
   - For **uncontrolled** inputs, pass `defaultValue` only and omit `value` so sibling attribute updates never trigger `UNCOMMITTED_INPUT_OVERWRITTEN`.
6. **Deterministic Hydration & SSR Isolation**:
   - Initial render seeds must be deterministic; never store mutable routers, transports, or clients at module scope — create routers inside `App` via `createAppRouter()` and scope clients to `TransportContext` / `RpcProvider` / `SpacetimeProvider`.
   - Avoid post-mount DOM reads (`onSettled`) for theme icons; use pure Panda CSS `_dark` visibility branches (`ThemeToggle`) and sync theme preferences to `document.cookie` (`theme=dark|light`) + `localStorage` + `<meta name="color-scheme">`.
7. **Declarative Async Queries**: Use `createMemo` returning Promises with `affects()` / `refresh()`, `isPending(() => query())`, and `<AsyncBoundary>`. Never abuse `createOptimistic(false)` as an imperative `isLoading` boolean (reserve `createOptimistic` / `createOptimisticStore` strictly for genuine optimistic domain data updates).
8. **Fine-Grained Store Draft Mutations**: On incremental table streams (`onInsert` / `onUpdate` / `onDelete`), mutate Solid 2.0 `createStore` drafts in place (`setRecords(draft => { draft.unshift(row); if (draft.length > 50) draft.pop(); })`) instead of spread-copying arrays. Use `reconcile` only for bulk snapshots (`onApplied`).
9. **SPA Router Primitives**: Use `<NavLink>` backed by `@solidjs/router` 2.0 native link delegation, `useHref()`, and `useLinkState(..., { end })` for zero-reload SPA transitions and `aria-current="page"` semantics.

---

## 5. Automated Rail Gatekeeper (`scripts/check-rails.ts`)

The semantic AST analyzer (configured with `jsxImportSource: "@solidjs/web"`) enforces 15 invariants across `src/`:

1. `INLINE_STYLE_FORBIDDEN`: No `style=` attributes.
2. `HEX_COLOR_HARDCODED`: No `#hex` colors in JSX attributes or style objects (excluding URLs/anchors).
3. `RAW_COLOR_FUNCTION`: No `rgb()`, `rgba()`, `hsl()`, `hsla()`, `oklch()` in `src/`.
4. `ARBITRARY_Z_INDEX`: TypeChecker verification ensuring all `zIndex` values resolve to canonical tokens.
5. `MARGIN_PROP_FORBIDDEN`: Push margins banned globally (only `ml/mr/mx="auto"` allowed for flex alignment).
6. `RAW_DOM_ELEMENT_BANNED`: Raw HTML tags (including `div`, `span`, `p`, `h1`-`h6`, `button`, `input`, `a`, `ul`, `li`, `nav`, `main`, `section`, `header`, `footer`, `form`, `svg`) banned outside `src/components/ui/` and `src/Document.tsx`; use semantic `<Box as="...">` and `<Icon>` primitives.
7. `ADHOC_CSS_IN_FEATURE_BANNED`: Importing `styled-system/*` banned outside `src/components/ui/`.
8. `UNSCOPED_TYPE_DEFINITION`: Database entity, RPC contract, and shared context types must be declared in `src/schema/` (local non-exported `*Props`, `*View`, `*ViewModel`, `*State` UI types are permitted in `src/routes/**`).
9. `TYPE_ESCAPE_HATCH_BANNED`: `as any`, `@ts-ignore`, and `@ts-expect-error` banned.
10. `LEGACY_SOLID_API_BANNED`: Solid 1.x APIs (`onMount`, `splitProps`, `mergeProps`, etc.) banned.
11. `UNNAMED_REACTIVE_PRIMITIVE`: Name attribute `{ name: "..." }` enforced on reactive primitives.
12. `LEGACY_TYPOGRAPHY_PROP_BANNED`: Legacy props (`color=`, `fontWeight=`, etc.) banned on `<Text>`/`<Heading>`/`<Code>`.
13. `COMPONENT_PARAM_DESTRUCTURE_BANNED`: Component parameter destructuring banned.
14. `UNSCOPED_IO_CALL_BANNED`: Direct `fetch()` calls or `DbConnection` instantiations banned in `src/routes/`.
15. `SINGLE_ARG_CREATE_EFFECT_BANNED`: Single-argument `createEffect(fn)` banned across `src/` to prevent accidentally invoking the temporary Ark UI 5.x compatibility bridge; requires split `createEffect(compute, apply)` or `onSettled()`.
