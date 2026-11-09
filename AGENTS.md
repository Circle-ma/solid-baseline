# Agent Development & Operational Guidelines (2026 Paved Path Edition)

Welcome, AI Agent. This document outlines your operational boundaries, development philosophy, and execution requirements for this project.

## Core Philosophical Directive: 鋪鐵軌而非設陷阱 (Lay the Rails, Don't Set Traps)

When generating UI and business logic, you must operate within strict rails:
1. **Never freestyle styles**: You must NEVER invent arbitrary CSS values (`padding: "13px"`, `color: "#3b82f6"`). The compiler has `strictTokens: true` enabled and will reject your code if you violate the token dictionary.
2. **Never write inline styles (`style={{ ... }}` is strictly BANNED)**: The framework strips the `style` attribute from all UI primitives at the type level. Passing `style` causes a TypeScript compilation error.
3. **Never push with margins**: Declare Margin Dead. Components never dictate their outer positioning. All spacing belongs to the parent container via `gap`.
4. **Never invent arbitrary z-indices**: Magic z-index numbers (`60`, `50`) destroy the stacking context. Always use canonical stacking tokens (`"sticky"`, `"overlay"`, `"modal"`).
5. **Never guess schemas**: Schema is the Single Source of Truth. All data types must import from `~/schema`.
6. **Never use raw HTML elements in features**: Use Systematic UI primitives from `~/components/ui`.
7. **Never use type escape hatches**: `as any`, `@ts-ignore`, and `@ts-expect-error` are strictly banned.

---

## 1. Toolchain & Command Protocol

- **Architecture**: Solid 2.0 Start-Mode SPA (`start: true, ssr: false, diagnostics: true`). Follows the official 2.0 convention (`src/Document.tsx` + `src/App.tsx`), with instant 1-boolean migration to streaming SSR (`ssr: true`).
- **Runtime**: Strictly `bun` and `bunx`. Never execute `npm`, `npx`, `yarn`, or `pnpm`.
- **Formatting**: `bun run format` (`biome format --write .`).
- **Linting & Rail Verification**: `bun run check` (`oxlint src && biome check . && bun run scripts/check-rails.ts`).
- **Type Checking**: `bun run typecheck` (`tsc --noEmit`).
- **Build**: `bun run build` (`panda codegen && vite build`).

---

## 2. Design System Rails: The Token Closed World

All visual properties must resolve to tokens exported from `~/components/ui/tokens`:
- **Spacing Scale (4px / 8px Grid)**:
  `"0"`, `"1"` (4px), `"1.5"` (6px), `"2"` (8px), `"2.5"` (10px), `"3"` (12px), `"4"` (16px), `"5"` (20px), `"6"` (24px), `"8"` (32px), `"10"` (40px), `"12"` (48px).
- **Surfaces**: `"bg.canvas"`, `"bg.default"`, `"bg.elevated"`, `"bg.subtle"`, `"bg.muted"`, `"bg.backdrop"`.
- **Foregrounds**: `"fg.default"`, `"fg.muted"`, `"fg.subtle"`.
- **Borders**: `"border.subtle"`, `"border.default"`.
- **Accents**: `"accent.default"`, `"accent.emphasized"`, `"accent.fg"`.
- **Status & Feedback Tokens**:
  - Success: `"success.default"`, `"success.subtle"`, `"success.fg"`, `"success.border"`, `"success.text"`.
  - Danger / Error: `"danger.default"`, `"danger.subtle"`, `"danger.fg"`, `"danger.border"`, `"danger.text"`.
  - Warning: `"warning.default"`, `"warning.subtle"`, `"warning.fg"`, `"warning.border"`, `"warning.text"`.
  - Info: `"info.default"`, `"info.subtle"`, `"info.fg"`, `"info.border"`, `"info.text"`.
- **Stacking Context (Z-Index Scale)**:
  `"hide"` (-1), `"base"` (0), `"docked"` (10), `"dropdown"` (1000), `"sticky"` (1100), `"banner"` (1200), `"overlay"` (1300), `"modal"` (1400), `"popover"` (1500), `"toast"` (1600), `"tooltip"` (1700), `"max"` (9999).

---

## 3. Layout & UI Rails: Containers & Compounds

Never write raw layout styling, inline styles, or raw unstyled HTML elements. Use pre-composed primitives from `~/components/ui`:
- `<Container maxW="4xl">`: Centered responsive container bounded by token scale.
- `<VStack gap="4">`: Vertical column stack (supports `position`, `zIndex`, `minH`, `maxH`, `w`, `p`, `px`, `py`, `bg`, `color`, `boxShadow`, `borderWidth`, `borderColor`).
- `<HStack gap="3">`: Horizontal row stack (supports `position`, `zIndex`, `minH`, `maxH`, `w`, `flexWrap`, `p`, `px`, `py`, `bg`, `color`, `boxShadow`).
- `<Grid columns={2} gap="6">`: Responsive grid layout.
- `<Box>`: Viewport, canvas, or layered box (supports `position`, `zIndex`, `inset`, `minH`, `w`, `bg`, `p`, `borderRadius`, `borderWidth`, `borderColor`).
- `<Divider />`: Visual section separator (`borderColor="border.subtle"`).
- `<Button variant="solid" size="sm">`: Systematic button primitive.
  - Variants: `"solid"`, `"outline"`, `"ghost"`, `"subtle"`, `"danger"`, `"success"`.
  - Sizes: `"xs"`, `"sm"`, `"md"`, `"lg"`.
- `<Badge variant="subtle" intent="success" size="sm">`: Semantic status badge primitive.
  - Variants: `"subtle"`, `"solid"`, `"outline"`.
  - Intents: `"default"`, `"success"`, `"danger"`, `"warning"`, `"info"`.
  - Sizes: `"sm"`, `"md"`.
- `<Input size="md">`: Systematic input primitive with Solid 2.0 draft synchronization (`createSignal` + `createEffect`), preventing `[UNCOMMITTED_INPUT_OVERWRITTEN]` diagnostics.
- `<NavLink href="...">`: Accessible navigation link primitive with active route matching and focus-visible rings.
- `<AsyncBoundary>`: Systematic async boundary combining Solid 2.0 `<Errored>` (with `err()` getter and `reset` action) and `<Loading on={...}>` with token-based fallback surfaces.
- `<Heading>`, `<Text>`, `<Code>`: Zero-runtime typography primitives powered by Panda recipes.
  - Variants: `tone` (`"default"`, `"muted"`, `"subtle"`, `"accent"`, `"success"`, `"danger"`, `"warning"`, `"info"`), `weight` (`"normal"`, `"medium"`, `"semibold"`, `"bold"`), `leading` (`"none"`, `"tight"`, `"snug"`, `"normal"`, `"relaxed"`), `tracking` (`"tighter"`, `"tight"`, `"normal"`, `"wide"`, `"wider"`, `"widest"`).
  - Use `tabular` boolean prop for numbers and timestamps to prevent horizontal layout shift.
  - Legacy props `color=`, `fontWeight=`, `lineHeight=`, and `letterSpacing=` are strictly banned in favor of recipe variants.
- `<Card.Root>`: Encapsulated card surface with pre-configured 24px padding and elevation.
- `<Dialog.Content>`: Encapsulated modal container with pre-configured 24px padding, 20px gap, max width, and top-right close trigger.

---

## 4. Solid.js 2.0 Invariants

- **No Prop Destructuring**: Always use `props.property`.
- **Props Forwarding**: Use `const rest = omitProps(props, "class", "children", "style")` from `"~/components/ui/tokens"`. Never cast `"style" as any`.
- **Signal Invocation**: In JSX values, call accessors: `<Text>{count()}</Text>`.
- **Signal Attribution**: Always provide `{ name: "..." }` when creating signals and memos for `@solidjs/diagnostics`.
- **SSR-Safe State & Context**: Never declare module-scope mutable signals or stores. Mount state via default-less Context Providers (`TelemetryProvider` + `useTelemetry`).
- **Deterministic Hydration**: Use deterministic seed values during initial server rendering (`timestamp: "00:00:00"`, `clientIdentity: "usr_local_node_01"`). Generate dynamic client values only inside `onSettled` or actions.
- **Actions & Optimistic State**: In transition handlers, use `createOptimistic(false, { name: "..." })` and `action(function* () { setFlag(true); ... })` to immediately acknowledge the hold before the first `yield`.
- **Store Mutations**: Modify stores via draft closures: `setStore(draft => { draft.prop = val; })`.
- **Web Primitives**: Import `Dynamic`, `Portal`, and `isServer` from `@solidjs/web`.

---

## 5. Data Layer & Schema SSOT

- Tables, reducers, and RPC types must be derived from `src/schema/`.
- No ad-hoc `interface` or `type` declarations in `src/routes/` or `src/lib/`.
- SpacetimeDB state changes run through transactional reducers (`callReducer`).

---

## 6. Automated Rail Gatekeeper (`scripts/check-rails.ts`)

The verification script enforces 12 architectural invariants:
1. `INLINE_STYLE_FORBIDDEN`: No `style=` attributes anywhere.
2. `HEX_COLOR_HARDCODED`: No `#hex` colors anywhere.
3. `RAW_COLOR_FUNCTION`: No `rgb()`, `rgba()`, `hsl()`, `hsla()`, `oklch()` in `src/`.
4. `ARBITRARY_Z_INDEX`: No numeric `zIndex` values.
5. `MARGIN_PROP_FORBIDDEN`: Global ban on `margin`, `m`, `mt`, `mb`, `ml`, `mr`, `mx`, `my`, `marginTop`, `marginBottom`, `marginLeft`, `marginRight`, `marginInline`, `marginBlock` props.
6. `RAW_DOM_ELEMENT_BANNED`: Outside `src/components/ui/` and `src/Document.tsx`, strictly forbid raw `<div`, `<span`, `<p`, `<h1`..`<h6`, `<button`, `<a `, `<input`, `<textarea`, `<select`, `<label`, `<hr`, `<svg`, `<table`.
7. `ADHOC_CSS_IN_FEATURE_BANNED`: Outside `src/components/ui/`, strictly forbid importing from `"styled-system/css"`, `"styled-system/patterns"`, or `"styled-system/jsx"`.
8. `UNSCOPED_TYPE_DEFINITION`: In `src/routes/` and `src/lib/`, forbid declaring ad-hoc `interface` or `type` definitions (all contracts and context types must live in `src/schema/` or `src/components/ui/`).
9. `TYPE_ESCAPE_HATCH_BANNED`: Forbid `as any`, `@ts-ignore`, and `@ts-expect-error` across `src/`.
10. `LEGACY_SOLID_API_BANNED`: Forbid legacy Solid 1.x APIs (`onMount`, `splitProps`, `mergeProps`, `createResource`, `createComputed`, `Suspense`, `SuspenseList`, `ErrorBoundary`, `Index`, `batch`, `.Provider`).
11. `UNNAMED_REACTIVE_PRIMITIVE`: Enforce diagnostic name attribute (e.g. `{ name: "..." }`) within 4 lines on `createSignal`, `createMemo`, and `createOptimistic`.
12. `LEGACY_TYPOGRAPHY_PROP_BANNED`: Forbid legacy props (`color=`, `fontWeight=`, `lineHeight=`, `letterSpacing=`) on `<Text>`, `<Heading>`, `<Code>`.
