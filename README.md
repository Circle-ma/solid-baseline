# Modern Solid 2.0 Baseline Architecture (2026 Foundation)

A high-performance, type-safe, zero-tech-debt starter framework engineered for the 2026 web platform and AI-assisted development.

---

## ⚡ The 2026 Tech Stack

| Domain           | Technology                                              | Version     | Purpose & Rationale                                                                                                                |
| :--------------- | :------------------------------------------------------ | :---------- | :--------------------------------------------------------------------------------------------------------------------------------- |
| **Architecture** | Solid 2.0 Start-Mode Client SPA                         | `Standard`  | Unified 2.0 convention (`Document.tsx` + `App.tsx`, `ssr: false`), `intentPreload()`, `pendingLinks`, catch-all 404, skip link.    |
| **Runtime & PM** | [Bun](https://bun.sh/)                                  | `1.4.x`     | Fast execution, unified package manager, native TS/JSX support.                                                                    |
| **Bundler**      | [Vite](https://vite.dev/) + `@solidjs/vite-plugin`      | `8.3 / 3.0` | Instant HMR, same-origin dev proxy (`/system.v1.SystemService`, `/healthz`, `/readyz`), ESNext code-split production build.        |
| **Reactive UI**  | [Solid.js 2.0](https://v2.solidjs.com/)                 | `2.0.0`     | Fine-grained reactivity, Zero-VDOM, async-first computations, native `omit`, `onFlush`, draft stores, array/object `class`.        |
| **Routing**      | [Solid Router](https://github.com/solidjs/solid-router) | `2.0.0`     | Declarative routing with `createRouter`, `defineRoute`, type-safe `router.paths`, `intentPreload`, `pendingLinks`, and `lazy()`.   |
| **Headless UI**  | [Ark UI](https://ark-ui.com/)                           | `5.39.x`    | Accessible state machines via [Zag.js](https://zagjs.com/) with presence-aware exit animations and `Dialog.CloseButton`/`asChild`. |
| **Styling**      | [Panda CSS](https://panda-css.com/)                     | `2.5.x`     | Zero-runtime extraction via `@pandacss/vite`, pure Solid 2.0 pattern primitives (zero JSX regex hacks), strict tokens & recipes.   |
| **Linter**       | [Oxlint](https://oxc.rs/)                               | `1.90.x`    | Rust-based linter (`src`, `server`, `scripts`, `spacetimedb`) with Solid 2.0 `v2-strict`.                                          |
| **Formatter**    | [Biome](https://biomejs.dev/)                           | `2.6.x`     | Fast Rust formatter and import organizer (replaces Prettier).                                                                      |
| **Realtime DB**  | [SpacetimeDB](https://spacetimedb.com/)                 | `2.15.x`    | Single-source SDK schema (`schema()`/`table()`/`reducers()`), zero unsafe casts, empty-snapshot sync, ISO-8601 UTC timestamps.     |
| **Typed RPC**    | [ConnectRPC](https://connectrpc.com/)                   | `2.3.x`     | Type-safe Protobuf/JSON RPC, `AbortController`-aware `createRpcQuery()`, `/healthz`, `/readyz`, body limits & 2-stage shutdown.    |
| **Testing**      | [Vitest](https://vitest.dev/) + `@solidjs/diagnostics`  | `5.1 / 2.0` | 26 deterministic tests (18 reactive diagnostics/UI/data scenarios + 8 ConnectRPC server/readiness/shutdown tests).                 |

---

## 🏛️ Architecture & Single Source of Truth (SSOT)

All architectural invariants, Solid 2.0 reactive contracts, design system closed-world tokens, TypeScript environment boundaries, and automated gatekeeper rules are governed by **[AGENTS.md](AGENTS.md)** alongside curated agent skills in `.agents/skills/`.

- **Design System Rails**: Closed-world static token types (`~/components/ui/tokens`), distinct Light & Dark surface hierarchy (`bg.canvas`, `bg.default`, `bg.elevated`, `bg.subtle`, `bg.muted`), unified `outline` + `outlineOffset` `_focusVisible` ring across all interactive controls, semantic shadows (`card`, `elevated`, `modal`), unified concentric radii (`none`, `l1`, `l2`, `l3`, `full`), variant/density-driven `Card` slot recipe, pure Solid 2.0 `styled-system/patterns` layout primitives (`Box`, `Container`, `VStack`, `HStack`, `Grid`, `Divider`), `<Icon>`, `<Link>`, `<NavLink>`, `<Input>`, `<Textarea>`, `<Skeleton>`, and global `prefers-reduced-motion: reduce` downgrade.
- **Solid.js 2.0 Contract**: No prop destructuring (`props.prop`), native `omit(props, ...)`, diagnostic attribution `{ name: ... }` in `src/lib/`, split `createEffect(compute, apply)`, controlled/uncontrolled `<Input>` & `<Textarea>` using `onFlush()` with cursor preservation (no synchronous `flush()` in `onInput`), `AbortController`-backed `createRpcQuery()` (`onFlush()` + `resolve()`), route-scoped `<SpacetimeProvider>`, and reactive `<AsyncBoundary>` with `<Skeleton>` loading fallback.
- **Headless UI Primitives**: Zag.js state machines via Ark UI, presence-aware `<Dialog.Portal>` (`usePresenceContext()` keeping DOM mounted through `overlayFadeOut` / `dialogScaleOut` until `animationend`), unstyled `<Dialog.CloseTrigger>` (`asChild`), and `<Dialog.CloseButton />`.
- **Data Layer SSOT & Environment Isolation**: Single-source ConnectRPC Protobuf contracts and SpacetimeDB 2.15 SDK schemas in `src/schema/`, verified across three isolated TypeScript project references (`tsconfig.app.json`, `tsconfig.server.json`, `tsconfig.module.json`).
- **Automated Rail Gatekeeper**: 15 calibrated AST & TypeChecker architectural invariants verified across isolated app, server, and module TypeScript programs via `bun run check:rails` (`scripts/check-rails.ts`).

---

## 🛠️ Verification & Toolchain Commands

All verification, compilation, and code generation protocols run through `bun`:

```bash
# Code generation (Panda CSS design-system spec, tokens, patterns, and recipes)
bun run codegen

# Generate SpacetimeDB TypeScript client bindings from spacetimedb/ module
bun run spacetime:generate

# Full static & dynamic verification pipeline (Oxlint + Biome + 15-rule AST check-rails + Vitest)
bun run check

# Run reactive diagnostics & server RPC test suite
bun run test

# Isolated TypeScript verification (tsconfig.app.json + tsconfig.server.json + tsconfig.module.json)
bun run typecheck

# Code formatting
bun run format

# Concurrent fullstack development server (ConnectRPC :8080 + Vite :3000 with same-origin proxy)
bun run dev

# Production build (@pandacss/vite extracts CSS automatically + lazy route code-splitting)
bun run build
```

---

## 📁 Project Structure

```
├── .agents/
│   └── skills/           # Official & curated AI Agent Skills (Solid 2.0.0, Panda CSS, Ark UI, SpacetimeDB)
├── .mcp.json             # Model Context Protocol configuration
├── .cursorrules          # Strict 2026 architectural directives pointing to AGENTS.md
├── AGENTS.md             # Single Source of Truth (SSOT) architecture constitution
├── biome.json            # Biome 2.6 formatting & import organization rules
├── buf.yaml              # Buf Protobuf module configuration
├── buf.gen.yaml          # Buf codegen configuration (Protobuf-ES v2 -> src/gen/)
├── oxlint.config.ts      # Oxlint configuration with Solid 2.0 v2-strict rules
├── package.json          # Dependency declarations & scripts
├── panda.config.ts       # Panda CSS 2.5 tokens, staticCss layout defaults, surface hierarchy, focus rings & recipes
├── patches/              # Temporary compatibility bridge (Ark UI 5.x <-> Solid 2.0.0)
├── proto/                # Protobuf SSOT definitions (system/v1)
├── public/               # Static public assets (favicon; self-hosted .woff2 fonts optional on demand)
├── scripts/
│   ├── check-rails.ts    # 15 calibrated AST & TypeChecker invariants across isolated app/server/module programs
│   └── dev.ts            # Concurrent dev orchestrator (isolated stdin, child-exit propagation, clean SIGINT/SIGTERM)
├── server/
│   ├── index.ts          # Hardened createRpcHandler() (/healthz, /readyz, 413 payload limits, 2-stage gracefulShutdown)
│   └── __tests__/
│       └── rpc.test.ts   # 8 real HTTP/ConnectRPC server, readiness, payload-limit, and shutdown tests
├── spacetimedb/
│   ├── package.json      # SpacetimeDB 2.x server module manifest (`system_db`)
│   ├── tsconfig.json     # Extends ../tsconfig.module.json (pure module environment)
│   └── src/
│       └── index.ts      # Real SpacetimeDB 2.x server module (`event_log` table + `tx_event` reducer)
├── src/
│   ├── Document.tsx      # Solid 2.0 static Document HTML Shell (bootstrapDocumentHead + non-blocking fonts)
│   ├── App.tsx           # SPA root (intentPreload, pendingLinks, skip link, catch-all 404, lazy /realtime)
│   ├── index.css         # Panda CSS cascade layers & optional self-hosted .woff2 font template
│   ├── __tests__/
│   │   ├── diagnostics.test.tsx # 18-scenario @solidjs/diagnostics matrix (Dialog exit anims, AbortController, 404, Spacetime)
│   │   └── setup.ts             # HappyDOM spec-compliant textContent test setup
│   ├── gen/              # Buf-generated Protobuf & ConnectRPC typed schemas (system/v1)
│   ├── routes/           # Declarative page views
│   │   ├── overview.tsx  # Accessible form validation, controlled/uncontrolled sync, presence Dialog, Skeleton/EmptyState
│   │   └── realtime.tsx  # Symmetric SpacetimeProvider/RpcProvider boundaries, HealthCheckStatus enum handling
│   ├── components/
│   │   └── ui/           # Pure Solid 2.0 UI Primitives (native array `class`, native `omit`, `onFlush`)
│   │       ├── _form-helpers.ts # Shared Input/Textarea event-tuple dispatch & cursor-selection restoration helpers
│   │       ├── badge.tsx        # Status-intent Badge primitive
│   │       ├── boundary.tsx     # Reactive AsyncBoundary (<Skeleton> loading fallback + reactive error display)
│   │       ├── button.tsx       # Button primitive with unified outline focus ring
│   │       ├── card.tsx         # Variant & density-driven Card compound via CardStylesContext
│   │       ├── dialog.tsx       # Presence-aware Ark UI Dialog (exit animations + CloseButton + asChild CloseTrigger)
│   │       ├── icon.tsx         # Canonical <Icon size="sm" | "md" | "lg"> SVG primitive
│   │       ├── index.ts         # Public UI barrel export
│   │       ├── input.tsx        # Controlled/uncontrolled Input (`onFlush` sync + cursor preservation + tuple handlers)
│   │       ├── layout.tsx       # Pure Solid 2.0 polymorphic primitives over `styled-system/patterns` + `<Dynamic>`
│   │       ├── link.tsx         # Separated `<Link>` (auto external rel hardening) and `<NavLink>` (Solid Router 2.0)
│   │       ├── skeleton.tsx     # Accessible motion-safe `<Skeleton>` placeholder primitive
│   │       ├── textarea.tsx     # Controlled/uncontrolled Textarea aligned with Input tokens & `onFlush` sync
│   │       ├── theme-toggle.tsx # Zero-flicker pure-CSS `_dark` ThemeToggle with non-conflicting `sr-only` names
│   │       ├── tokens.ts        # Compile-time closed-world token types derived directly from Panda
│   │       └── typography.tsx   # Heading, Text (inline span size inheritance), and Code (`l1` radius) primitives
│   ├── lib/              # Single-Responsibility Providers, Composable Queries & Adapters
│   │   ├── connect.tsx          # Tree-scoped TransportProvider (same-origin default `import.meta.env?.VITE_API_URL ?? ""`)
│   │   ├── index.ts             # Unified lib exports
│   │   ├── rpc-provider.tsx     # RpcProvider, useOptionalRpc(), AbortController-aware createRpcQuery()
│   │   ├── spacetime.ts         # Typed Live & Offline adapters (empty snapshot sync, crypto.randomUUID, zero unsafe casts)
│   │   └── spacetime-provider.tsx # Route-scoped SpacetimeProvider, clean mode switching & draft mutations
│   └── schema/           # Schema as Single Source of Truth (SSOT)
│       ├── connect.ts    # ConnectRPC SystemService, Transport/RPC context, AbortSignal-aware RpcQuery contracts
│       ├── index.ts      # Centralized schema export
│       └── spacetimedb.ts# Unified SpacetimeDB 2.15 SDK schema()/table()/reducers() & derived types
├── tsconfig.json         # Root TypeScript project references coordinator
├── tsconfig.app.json     # Isolated client SPA environment (excludes styled-system/jsx)
├── tsconfig.server.json  # Isolated backend & tooling environment (ESNext + bun, zero DOM types)
├── tsconfig.module.json  # Isolated SpacetimeDB serverless module environment (ESNext, types: [])
├── vite.config.ts        # Vite + Panda CSS + Solid 2.0 SPA compiler pipeline & same-origin dev proxy
└── vitest.config.ts      # Vitest + happy-dom + targeted Solid/Ark/Zag dependency inlining
```

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (`curl -fsSL https://bun.sh/install | bash`)

### Installation

```bash
bun install
```

### Development

```bash
bun run dev
```

This launches both the ConnectRPC backend ([http://localhost:8080/healthz](http://localhost:8080/healthz), `/readyz`) and the Solid 2.0 Vite client ([http://localhost:3000](http://localhost:3000)) via `scripts/dev.ts`, with Vite proxying `/system.v1.SystemService`, `/healthz`, and `/readyz` on the same origin. Solid Reactivity Diagnostics dev panel is available at [http://localhost:3000/__solid/diagnostics](http://localhost:3000/__solid/diagnostics).

### Local SpacetimeDB Live Module (Optional)

To generate bindings and test real WebSocket synchronization via the "Connect Live" toggle:

```bash
spacetime start --listen-addr 127.0.0.1:3001
bun run spacetime:generate
bun run spacetime:publish
```

### Pre-Commit Verification

```bash
bun run codegen && bun run format && bun run check && bun run typecheck && bun run build
```

---

## 🧩 Temporary Upstream Ecosystem Bridge (`patches/`)

To allow `@ark-ui/solid@5.x` (powered by Zag.js) to run cleanly on Solid 2.0.0 until `@zag-js/solid` 2.x and `@ark-ui/solid` officially ship native Solid 2.0 support, this baseline includes a minimal, temporary compatibility bridge (`patches/solid-js@2.0.0.patch`) via Bun's `patchedDependencies`:

- Restores shim interfaces for `splitProps`, `mergeProps`, `on`, and `onMount` (backed by Solid 2.0 `onSettled`), plus `onCleanup` forwarding.
- Adds `provider.Provider = provider` for legacy context providers.
- Routes legacy 1-argument `createEffect(fn)` calls to Solid 2.0 native `createTrackedEffect` while preserving hydration-aware 2-argument `createEffect(compute, apply)`. Application code is prevented from calling 1-argument `createEffect(fn)` by AST rail rule #14 (`SINGLE_ARG_CREATE_EFFECT_BANNED`).
- Leaves native `createSignal` unmodified and avoids global `resolve.alias` hacks in Vite/Vitest.

**Upstream Timeline & Freeze Policy**: Do not assume the initial Ark UI v6.0 release automatically includes native Solid 2.0 support (Ark UI v6 prioritizes Zag v2 stabilization with Solid 2.0 support tracked as under evaluation, and plans to deprecate `asChild` in favor of a `render` prop). Until native Solid 2.0 support ships upstream, do **not** expand `patches/solid-js@2.0.0.patch` beyond the already diagnostics-verified `<Dialog>` template. When upstream support is ready, follow the **Zero-Residue Upstream Upgrade Checklist** in [AGENTS.md](AGENTS.md) to remove the patch, migrate `asChild` -> `render`, clean up `serializeArkClass`, and update Rule #14 and docs with zero residue.
