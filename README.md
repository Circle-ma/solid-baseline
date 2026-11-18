# Modern Solid 2.0 Baseline Architecture (2026 Foundation)

A high-performance, type-safe, zero-tech-debt starter framework engineered for the 2026 web platform and AI-assisted development.

---

## ⚡ The 2026 Tech Stack

| Domain           | Technology                                              | Version     | Purpose & Rationale                                                                                                     |
| :--------------- | :------------------------------------------------------ | :---------- | :---------------------------------------------------------------------------------------------------------------------- |
| **Architecture** | Solid 2.0 Start-Mode SPA                                | `Standard`  | Unified 2.0 convention (`Document.tsx` + `App.tsx`), module-level typed `router.paths`, lazy route splitting.           |
| **Runtime & PM** | [Bun](https://bun.sh/)                                  | `1.4.x`     | Blazing fast execution, unified package manager, native TS/JSX support.                                                 |
| **Bundler**      | [Vite](https://vite.dev/) + `@solidjs/vite-plugin`      | `8.3 / 3.0` | Instant HMR, same-origin dev proxy (`/system.v1.SystemService`, `/healthz`), ESNext code-split production build.        |
| **Reactive UI**  | [Solid.js 2.0](https://v2.solidjs.com/)                 | `2.0.0`     | Fine-grained reactivity, Zero-VDOM, async-first computations, native `omit`, draft stores, array/object `class`.        |
| **Routing**      | [Solid Router](https://github.com/solidjs/solid-router) | `2.0.0`     | Declarative routing with `createRouter`, `defineRoute`, type-safe `router.paths`, and `lazy()` route boundaries.        |
| **Headless UI**  | [Ark UI](https://ark-ui.com/)                           | `5.39.x`    | Accessible, robust state machines powered by [Zag.js](https://zagjs.com/) with explicit `Dialog.CloseButton`/`asChild`. |
| **Styling**      | [Panda CSS](https://panda-css.com/)                     | `2.5.x`     | Zero-runtime extraction via `@pandacss/vite`, Solid 2.0 `codegen:prepare` JSX plugin, strict tokens & slot recipes.     |
| **Linter**       | [Oxlint](https://oxc.rs/)                               | `1.90.x`    | Rust-based ultra-fast linter (`src`, `server`, `scripts`, `spacetimedb`) with Solid 2.0 `v2-strict`.                    |
| **Formatter**    | [Biome](https://biomejs.dev/)                           | `2.6.x`     | Blazing-fast Rust formatter and import organizer (replaces Prettier).                                                   |
| **Realtime DB**  | [SpacetimeDB](https://spacetimedb.com/)                 | `2.15.x`    | Single-source SDK schema (`schema()`/`table()`/`reducers()`), ISO-8601 UTC timestamps, typed reducers & live WebSocket. |
| **Typed RPC**    | [ConnectRPC](https://connectrpc.com/)                   | `2.3.x`     | Type-safe Protobuf/JSON RPC (`system.v1.SystemService`), composable `createRpcQuery()`, validated `createRpcHandler()`. |
| **Testing**      | [Vitest](https://vitest.dev/) + `@solidjs/diagnostics`  | `5.1 / 2.0` | 18 reactive diagnostics, controlled input sync, typography inheritance, live reconnect & ConnectRPC server tests.       |

---

## 🏛️ Architecture & Single Source of Truth (SSOT)

All architectural invariants, Solid 2.0 reactive contracts, design system closed-world tokens, TypeScript environment boundaries, and automated gatekeeper rules are governed by **[AGENTS.md](AGENTS.md)** alongside curated agent skills in `.agents/skills/`.

Engineers and AI agents must treat `AGENTS.md` as the single architectural constitution:

- **Design System Rails**: Closed-world static token dictionary (`~/components/ui/tokens`), semantic shadow tokens (`card`, `modal`, `focusRing`, `focusRingDanger` using Panda opacity syntax with zero raw `rgba`), concentric radii (`l3` -> `l2` -> `l1`), inherited inline `<Text as="span">` typography, global `prefers-reduced-motion: reduce` downgrade, polymorphic Panda JSX layout wrappers (`styled-system/jsx`), `<Icon size="sm" | "md" | "lg">`, one-off `css()` in routes (repetition `< 3`), and container-first spatial rhythm (`gap`).
- **Solid.js 2.0 Contract**: No prop destructuring (`props.prop`), native `omit(props, ...)`, diagnostic signal attribution (`{ name: ... }`) in `src/lib/`, split `createEffect(compute, apply)`, synchronously routed controlled/uncontrolled `<Input>` with `flush()` DOM reconciliation, draft stores, composable `createRpcQuery()` (`flush()` + `resolve()`), route-scoped `<SpacetimeProvider>`, and self-healing `<AsyncBoundary onRetry={...}>`.
- **Headless UI Primitives**: Autonomous Zag.js state machines via Ark UI, encapsulated `<Dialog.Portal>` lifecycles, pure unstyled `<Dialog.CloseTrigger>` (compose with `<Button>` via `asChild` render prop), and explicit `<Dialog.CloseButton />` for the top-right close icon button.
- **Data Layer SSOT & Environment Isolation**: Single-source ConnectRPC Protobuf contracts and SpacetimeDB 2.15 SDK `table()`/`schema()`/`reducers()` definitions in `src/schema/`, paired with isolated TypeScript project references (`tsconfig.app.json`, `tsconfig.server.json`, `tsconfig.module.json`) ensuring backend/module code can never reference browser DOM types.
- **Automated Rail Gatekeeper**: 16 calibrated AST & TypeChecker architectural invariants verified across `src/`, `server/`, and `spacetimedb/` via `bun run check:rails` (`scripts/check-rails.ts`).

---

## 🛠️ Verification & Toolchain Commands

All verification, compilation, and code generation protocols run through `bun`:

```bash
# Code generation (Design system spec + Panda CSS Solid 2.0 JSX runtime)
bun run codegen

# Generate SpacetimeDB TypeScript client bindings from spacetimedb/ module
bun run spacetime:generate

# Full static & dynamic verification pipeline (Oxlint + Biome + 16-rule AST check-rails + Vitest)
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
├── package.json          # Latest stable dependency declarations & scripts (incl. spacetime:generate)
├── panda.config.ts       # Panda CSS 2.5 tokens, semantic shadows, slot recipes, Solid 2.0 JSX codegen plugin
├── patches/              # Temporary compatibility bridge (Ark UI 5.x <-> Solid 2.0.0)
├── proto/                # Protobuf SSOT definitions (system/v1)
├── public/
│   └── MisansTC VF.ttf   # Local variable CJK font loaded on-demand via unicode-range
├── scripts/
│   ├── check-rails.ts    # 16 calibrated AST & TypeChecker invariants across src/, server/, spacetimedb/
│   └── dev.ts            # Concurrent dev server orchestrator (Bun.spawn, clean SIGINT/SIGTERM)
├── server/
│   ├── index.ts          # Pure createRpcHandler() ConnectRPC server (service validation, JSON logs, server.stop(true))
│   └── __tests__/
│       └── rpc.test.ts   # Real HTTP/ConnectRPC tests (/healthz, CheckHealth validation, CORS, structured logs)
├── spacetimedb/
│   ├── package.json      # SpacetimeDB 2.x server module manifest (`system_db`)
│   ├── tsconfig.json     # Extends ../tsconfig.module.json (pure module environment)
│   └── src/
│       └── index.ts      # Real SpacetimeDB 2.x server module (`event_log` table + `tx_event` reducer)
├── src/
│   ├── Document.tsx      # Official Solid 2.0 Document HTML Shell (structured bootstrapDocumentHead + non-blocking fonts)
│   ├── App.tsx           # Canonical SPA root (module-level router, lazy /realtime split, service-agnostic RpcProvider)
│   ├── index.css         # Panda CSS cascade layers & local MiSans TC VF @font-face (imported once in App.tsx)
│   ├── __tests__/
│   │   ├── diagnostics.test.tsx # 13-scenario @solidjs/diagnostics matrix (input sync, text inheritance, live reconnect, RPC retry)
│   │   └── setup.ts             # HappyDOM spec-compliant textContent test environment setup
│   ├── gen/              # Buf-generated Protobuf & ConnectRPC typed schemas (system/v1)
│   ├── routes/           # Declarative page views (one-off css() layout constants allowed, < 3 repetitions)
│   │   ├── overview.tsx  # Reactivity counter, controlled/uncontrolled Input & Ark UI Dialog (CloseButton + asChild)
│   │   └── realtime.tsx  # Route-scoped SpacetimeProvider, on-demand createHealthCheckQuery(), SVG <Icon> buttons
│   ├── components/
│   │   └── ui/           # Paved Path UI Primitives (native array `class` composition, native `omit`)
│   │       ├── boundary.tsx     # Self-healing AsyncBoundary (`onRetry` before `reset()`, <Errored> + <Loading>)
│   │       ├── dialog.tsx       # Ark UI Dialog compound (unstyled CloseTrigger + explicit CloseButton)
│   │       ├── icon.tsx         # Canonical <Icon size="sm" | "md" | "lg"> SVG primitive
│   │       ├── input.tsx        # Synchronously routed controlled/uncontrolled Input with InputBase & flush() sync
│   │       ├── layout.tsx       # Polymorphic Panda JSX wrappers (styled-system/jsx) preserving generic `as` HTML attrs
│   │       ├── link.tsx         # Accessible SPA NavLink primitive (Solid Router 2.0 useHref + useLinkState)
│   │       ├── theme-toggle.tsx # Zero-flicker pure-CSS `_dark` ThemeToggle (aria-label/title + cookie/localStorage sync)
│   │       ├── tokens.ts        # Pure compile-time closed-world token union types (zero runtime helpers)
│   │       └── typography.tsx   # Heading, Text (inline span size inheritance), and Code primitives
│   ├── lib/              # Single-Responsibility Providers, Composable Queries & Adapters
│   │   ├── connect.tsx          # Tree-scoped TransportProvider (same-origin default `import.meta.env?.VITE_API_URL ?? ""`)
│   │   ├── index.ts             # Unified lib exports
│   │   ├── rpc-provider.tsx     # Service-agnostic RpcProvider, useRpcClient(), composable createRpcQuery() (flush + resolve)
│   │   ├── spacetime.ts         # Hardened Live & Offline adapters (ISO-8601 UTC, disconnect/reconnect reset, typed reducers)
│   │   └── spacetime-provider.tsx # Route-scoped SpacetimeProvider with useOptionalSpacetime(), draft mutations & error sync
│   └── schema/           # Schema as Single Source of Truth (SSOT)
│       ├── connect.ts    # ConnectRPC SystemService, Transport/RPC context, conditional RpcQueryHandle contracts
│       ├── index.ts      # Centralized schema export
│       └── spacetimedb.ts# Unified SpacetimeDB SDK schema()/table()/reducers(), typed SpacetimeReducersClient & derived types
├── tsconfig.json         # Root TypeScript project references coordinator
├── tsconfig.app.json     # Isolated client SPA environment (ESNext + DOM, vite/client)
├── tsconfig.server.json  # Isolated backend & tooling environment (ESNext + bun, strictly zero DOM types)
├── tsconfig.module.json  # Isolated SpacetimeDB serverless module environment (ESNext, types: [])
├── vite.config.ts        # Vite + Panda CSS + Solid 2.0 compiler pipeline & same-origin dev proxy
└── vitest.config.ts      # Vitest + happy-dom + Solid 2.0 diagnostics test config
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

This launches both the ConnectRPC backend ([http://localhost:8080/healthz](http://localhost:8080/healthz)) and the Solid 2.0 Vite client ([http://localhost:3000](http://localhost:3000)) via `scripts/dev.ts`, with Vite proxying `/system.v1.SystemService` and `/healthz` transparently on the same origin. Solid Reactivity Diagnostics dev panel is available at [http://localhost:3000/__solid/diagnostics](http://localhost:3000/__solid/diagnostics).

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

Solid.js 2.0.0 introduces major architectural improvements (fine-grained async computations, split `createEffect(compute, apply)`, and removal of 1.x `splitProps` / `onMount` in favor of direct property access, `omit`, and `onSettled`/`onCleanup`).

To allow `@ark-ui/solid@5.x` (powered by Zag.js) to run cleanly on Solid 2.0.0 until **Ark UI v6** releases with native Solid 2.0 support, this baseline includes a minimal, temporary compatibility bridge (`patches/solid-js@2.0.0.patch`) via Bun's `patchedDependencies`:

- Restores shim interfaces for `splitProps`, `mergeProps`, `on`, and `onMount` (backed by Solid 2.0 `onSettled`), plus `onCleanup` forwarding.
- Adds `provider.Provider = provider` for legacy context providers.
- Routes legacy 1-argument `createEffect(fn)` calls to Solid 2.0 native `createTrackedEffect` while preserving hydration-aware 2-argument `createEffect(compute, apply)`. Application code is prevented from calling 1-argument `createEffect(fn)` by AST rail rule #15 (`SINGLE_ARG_CREATE_EFFECT_BANNED`).
- Leaves native `createSignal` completely unmodified and avoids global `resolve.alias` hacks in Vite/Vitest.

Once Ark UI v6 ships, delete `patches/solid-js@2.0.0.patch` and remove `patchedDependencies` from `package.json`.
