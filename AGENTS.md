# Architecture & Operational Constitution (2026 Paved Path Edition)

This document is the Single Source of Truth (SSOT) for all architectural invariants, directory boundaries, toolchain protocols, and design system contracts.

---

## 1. Toolchain & Protocol

- **Architecture**: Solid 2.0 Start-Mode SPA (`start: true, ssr: false, diagnostics: true`).
- **Runtime**: Strictly `bun` and `bunx`. Never invoke `npm`, `npx`, `yarn`, or `pnpm`.
- **Pre-Commit Verification**: `bun run check && bun run typecheck` must pass with 0 errors and 0 warnings.
- **Commands**:
  - Format: `bun run format` (`biome format --write .`)
  - Rails Gatekeeper: `bun run check:rails` (`bun run scripts/check-rails.ts`)
  - Check Pipeline: `bun run check` (`oxlint src && biome check . && bun run check:rails && vitest run`)
  - Typecheck: `bun run typecheck` (`tsc --noEmit`)
  - Codegen: `bun run codegen` (`panda codegen --spec`)
  - Build: `bun run build` (`panda codegen && vite build`)

---

## 2. Architectural Boundaries & Directory Matrix

| Directory            | Allowed Imports                                        | Forbidden Imports / Actions                                                                                   | Responsibility                                                       |
| :------------------- | :----------------------------------------------------- | :------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------- |
| `src/routes/`        | `~/components/ui`, `~/lib`, `~/schema`, Solid core     | `styled-system/*`, raw DOM (`div`, `button`, etc.), direct `fetch`, `DbConnection`, ad-hoc `type`/`interface` | Routed page views. No direct external I/O or inline styling.         |
| `src/lib/`           | `~/schema`, `@connectrpc/*`, `spacetimedb`, Solid core | Raw DOM, UI primitives, ad-hoc `type`/`interface`                                                             | State machines, Context Providers, SpacetimeDB & ConnectRPC clients. |
| `src/schema/`        | `@bufbuild/protobuf`, generated contracts              | UI primitives, DOM, runtime side-effects                                                                      | Pure SSOT data schemas, tables, reducers, RPC contracts.             |
| `src/components/ui/` | `styled-system/*`, `@ark-ui/solid`, Solid core         | Feature routes, schema reducers, ad-hoc inline styles                                                         | Systematic atomic & compound design system primitives.               |

---

## 3. Design System Token Closed World

All visual properties must resolve to tokens derived from `~/components/ui/tokens`:
- **Typography Fonts**:
  - `heading`: `'Google Sans Flex', 'MiSans TC', 'PingFang TC', 'Microsoft JhengHei', system-ui, sans-serif`
  - `body`: `'Geist', 'MiSans TC', 'PingFang TC', 'Microsoft JhengHei', system-ui, sans-serif`
  - `mono`: `'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace`
- **Spacing Scale (4px/8px Grid)**: `"0"`, `"1"`, `"1.5"`, `"2"`, `"2.5"`, `"3"`, `"4"`, `"5"`, `"6"`, `"8"`, `"10"`, `"12"`, `"16"`, `"20"`.
- **Surfaces**: `"bg.canvas"`, `"bg.default"`, `"bg.elevated"`, `"bg.subtle"`, `"bg.muted"`, `"bg.backdrop"`.
- **Foregrounds**: `"fg.default"`, `"fg.muted"`, `"fg.subtle"`, `"accent.default"`, `"accent.emphasized"`, `"accent.fg"`.
- **Borders**: `"border.subtle"`, `"border.default"`, status borders.
- **Stacking Scale (Z-Index)**: `"hide"` (-1), `"base"` (0), `"docked"` (10), `"dropdown"` (1000), `"sticky"` (1100), `"banner"` (1200), `"overlay"` (1300), `"modal"` (1400), `"popover"` (1500), `"toast"` (1600), `"tooltip"` (1700), `"max"` (9999).
- **Radii Scale**: `"none"`, `"sm"`, `"md"`, `"l1"`, `"l2"`, `"l3"`, `"full"`.

---

## 4. Solid 2.0 Invariants

1. **No Destructuring**: Component props must never be destructured (`props.prop` only).
2. **Prop Omission**: Strip handled props using `omitProps(props, ...keys, "class", "children", "style")`.
3. **Signal Attribution**: Always provide `{ name: "..." }` when creating signals, memos, or optimistic states.
4. **No Owned Writes**: Never write signals inside owned scopes without `{ ownedWrite: true }`. Use derived writable signals `createSignal(() => props.value ?? "")`.
5. **Deterministic Hydration**: Initial render seeds must be deterministic; generate dynamic client data only in `onSettled` or user actions.
6. **Optimistic Actions**: In transition handlers, acknowledge holds prior to the first async yield using `createOptimistic`.
7. **Unidirectional Flow**: State mutations must be triggered via Reducer transactions or Context Actions; never mutate stores via direct array manipulations.

---

## 5. Automated Rail Gatekeeper (`scripts/check-rails.ts`)

The semantic AST analyzer enforces 14 invariants across `src/`:
1. `INLINE_STYLE_FORBIDDEN`: No `style=` attributes.
2. `HEX_COLOR_HARDCODED`: No `#hex` colors in JSX attributes or style objects (excluding URLs/anchors).
3. `RAW_COLOR_FUNCTION`: No `rgb()`, `rgba()`, `hsl()`, `hsla()`, `oklch()` in `src/`.
4. `ARBITRARY_Z_INDEX`: TypeChecker verification ensuring all `zIndex` values resolve to canonical tokens.
5. `MARGIN_PROP_FORBIDDEN`: Push margins banned globally (only `ml/mr/mx="auto"` allowed for flex alignment).
6. `RAW_DOM_ELEMENT_BANNED`: Raw HTML tags banned outside `src/components/ui/` and `src/Document.tsx`.
7. `ADHOC_CSS_IN_FEATURE_BANNED`: Importing `styled-system/*` banned outside `src/components/ui/`.
8. `UNSCOPED_TYPE_DEFINITION`: Ad-hoc `interface`/`type` banned in `src/routes/` and `src/lib/`.
9. `TYPE_ESCAPE_HATCH_BANNED`: `as any`, `@ts-ignore`, and `@ts-expect-error` banned.
10. `LEGACY_SOLID_API_BANNED`: Solid 1.x APIs (`onMount`, `splitProps`, `mergeProps`, etc.) banned.
11. `UNNAMED_REACTIVE_PRIMITIVE`: Name attribute `{ name: "..." }` enforced on reactive primitives.
12. `LEGACY_TYPOGRAPHY_PROP_BANNED`: Legacy props (`color=`, `fontWeight=`, etc.) banned on `<Text>`/`<Heading>`/`<Code>`.
13. `COMPONENT_PARAM_DESTRUCTURE_BANNED`: Component parameter destructuring banned.
14. `UNSCOPED_IO_CALL_BANNED`: Direct `fetch()` calls or `DbConnection` instantiations banned in `src/routes/`.
