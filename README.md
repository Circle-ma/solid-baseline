# Modern Solid 2.0 Baseline Architecture (2026 Foundation)

A high-performance, type-safe, zero-tech-debt starter framework engineered for the 2026 web platform and AI-assisted development.

---

## ⚡ The 2026 Tech Stack

| Domain           | Technology                                              | Version     | Purpose & Rationale                                                                   |
| :--------------- | :------------------------------------------------------ | :---------- | :------------------------------------------------------------------------------------ |
| **Architecture** | Solid 2.0 Start-Mode SPA                                | `Standard`  | Unified 2.0 convention (`Document.tsx` + `App.tsx`), SSR-isolated per-request router. |
| **Runtime & PM** | [Bun](https://bun.sh/)                                  | `1.4.x`     | Blazing fast execution, unified package manager, native TS/JSX support.               |
| **Bundler**      | [Vite](https://vite.dev/) + `@solidjs/vite-plugin`      | `8.3 / 3.0` | Instant HMR and lightning-fast ESNext client bundle extraction.                       |
| **Reactive UI**  | [Solid.js 2.0](https://v2.solidjs.com/)                 | `2.0.0`     | Fine-grained reactivity, Zero-VDOM, async-first computations, draft stores.           |
| **Routing**      | [Solid Router](https://github.com/solidjs/solid-router) | `2.0.0`     | Declarative routing with `createRouter`, `defineRoute`, typed `paths`.                |
| **Headless UI**  | [Ark UI](https://ark-ui.com/)                           | `5.39.x`    | Accessible, robust state machines powered by [Zag.js](https://zagjs.com/).            |
| **Styling**      | [Panda CSS](https://panda-css.com/)                     | `2.5.x`     | Zero-runtime build-time CSS-in-JS with strict tokens & native slot recipes.           |
| **Linter**       | [Oxlint](https://oxc.rs/)                               | `1.90.x`    | Rust-based ultra-fast linter with Solid 2.0 `v2-strict` reactivity rules.             |
| **Formatter**    | [Biome](https://biomejs.dev/)                           | `2.6.x`     | Blazing-fast Rust formatter and import organizer (replaces Prettier).                 |
| **Realtime DB**  | [SpacetimeDB](https://spacetimedb.com/)                 | `2.15.x`    | In-memory relational database with WebSocket client cache synchronization.            |
| **Typed RPC**    | [ConnectRPC](https://connectrpc.com/)                   | `2.3.x`     | Type-safe Protobuf and JSON RPC (`system.v1.SystemService`).                          |
| **Testing**      | [Vitest](https://vitest.dev/) + `@solidjs/diagnostics`  | `5.1 / 2.0` | Automated reactive graph diagnostics (zero waste, zero silent holds).                 |

---

## 🏛️ Architecture & Single Source of Truth (SSOT)

All architectural invariants, Solid 2.0 reactive contracts, design system closed-world tokens, and automated gatekeeper rules are strictly governed by **[AGENTS.md](AGENTS.md)**.

Engineers and AI agents must treat `AGENTS.md` as the single architectural constitution:

- **Design System Rails**: Closed-world static token dictionary (`~/components/ui/tokens`), semantic shadow tokens (`card`, `modal`), `<Icon size="sm" | "md" | "lg">` atomic primitive, zero inline styles, zero hardcoded colors, zero magic numbers, and container-first spatial rhythm (`gap`).
- **Solid.js 2.0 Contract**: No prop destructuring (`props.prop`), diagnostic signal attribution (`{ name: "..." }`), split `createEffect(compute, apply)`, controlled `<Input value={val() ?? ""} onValueChange={...} />`, draft stores, and `<Loading>`/`<Errored>` boundaries.
- **Headless UI Primitives**: Autonomous Zag.js state machines via Ark UI, encapsulated `<Dialog.Portal>` lifecycles, and no boolean `asChild`.
- **Data Layer SSOT**: Formal database, reducer, and RPC contracts in `src/schema/` (derived via ConnectRPC Protobuf and SpacetimeDB 2.15).
- **Automated Rail Gatekeeper**: 15 AST-level architectural invariants verified via `bun run check:rails` (`scripts/check-rails.ts`).

---

## 🛠️ Verification & Toolchain Commands

All verification, compilation, and code generation protocols run through `bun`:

```bash
# Code generation (Design system spec + Panda CSS)
bun run codegen

# Full static & dynamic verification pipeline (Oxlint + Biome + AST check-rails + Vitest)
bun run check

# Run reactive diagnostics test suite
bun run test

# TypeScript type verification
bun run typecheck

# Code formatting
bun run format

# Concurrent fullstack development server (ConnectRPC :8080 + Vite :3000)
bun run dev

# Production build
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
├── docs/
│   └── ai/               # Machine-readable library guides & llms.txt index
├── oxlint.config.ts      # Oxlint configuration with Solid 2.0 v2-strict rules
├── package.json          # Latest stable dependency declarations & scripts
├── panda.config.ts       # Panda CSS 2.5 tokens, semantic tokens (incl. shadows), and slot recipes
├── patches/              # Temporary compatibility bridge (Ark UI 5.x <-> Solid 2.0.0)
├── proto/                # Protobuf SSOT definitions (system/v1)
├── public/
│   └── MisansTC VF.ttf   # Local variable CJK font loaded on-demand via unicode-range
├── scripts/
│   ├── check-rails.ts    # 15 AST & TypeChecker architectural rail invariants
│   └── dev.ts            # Concurrent dev server orchestrator (Bun.spawn, clean SIGINT/SIGTERM)
├── server/
│   └── index.ts          # ConnectRPC backend server (Bun.serve, CORS, /healthz, graceful shutdown)
├── src/
│   ├── Document.tsx      # Official Solid 2.0 Document HTML Shell (non-blocking fonts + zero-FOUC theme)
│   ├── App.tsx           # Canonical starter application (SSR-isolated createAppRouter + Layout)
│   ├── index.css         # Panda CSS cascade layers & local MiSans TC VF @font-face
│   ├── __tests__/
│   │   ├── diagnostics.test.tsx # 8-scenario @solidjs/diagnostics + Vitest verification matrix
│   │   └── setup.ts             # HappyDOM spec-compliant textContent test environment setup
│   ├── gen/              # Buf-generated Protobuf & ConnectRPC typed schemas (system/v1)
│   ├── routes/           # Declarative page views
│   │   ├── overview.tsx  # Reactivity counter, controlled/uncontrolled Input & Ark UI dialog
│   │   └── realtime.tsx  # SpacetimeDB realtime store & ConnectRPC declarative async query views
│   ├── components/
│   │   └── ui/           # Paved Path UI Primitives (Button, Badge, Card, Dialog, Icon, Layout, Typography, Input, NavLink, Boundary, ThemeToggle, Tokens)
│   │       ├── boundary.tsx     # Systematic AsyncBoundary (Solid 2.0 <Errored> + <Loading>)
│   │       ├── icon.tsx         # Canonical <Icon size="sm" | "md" | "lg"> SVG primitive
│   │       ├── input.tsx        # Controlled (`value={val() ?? ""}`) / uncontrolled (`defaultValue`) Input primitive
│   │       ├── layout.tsx       # Semantic layout primitives (BaseStyleProps + extractStyleProps + `as` prop)
│   │       ├── link.tsx         # Accessible SPA NavLink primitive (Solid Router 2.0 useHref + useLinkState)
│   │       └── theme-toggle.tsx # Zero-flicker pure-CSS `_dark` ThemeToggle with `document.cookie` + `localStorage` sync
│   ├── lib/              # Single-Responsibility Providers & Service Integrations
│   │   ├── connect.tsx          # SSR-isolated TransportContext, TransportProvider & typed service clients
│   │   ├── index.ts             # Unified lib exports
│   │   ├── rpc-provider.tsx     # Declarative ConnectRPC async query provider (createMemo + affects/refresh)
│   │   ├── spacetime.ts         # Dual-mode SpacetimeDB 2.15 adapter (Live subscription + Offline Sandbox)
│   │   └── spacetime-provider.tsx # Single-responsibility SpacetimeDB Provider with draft store mutations
│   └── schema/           # Schema as Single Source of Truth (SSOT)
│       ├── connect.ts    # ConnectRPC SystemService, Transport/RPC context & Protobuf contracts
│       ├── index.ts      # Centralized schema export
│       └── spacetimedb.ts# SpacetimeDB adapter, table, reducer & SpacetimeProvider contracts
├── tsconfig.json         # Strict TypeScript compiler options
├── vite.config.ts        # Vite + Panda CSS + Solid 2.0 compiler pipeline (zero legacy aliases)
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
This launches both the ConnectRPC backend ([http://localhost:8080/healthz](http://localhost:8080/healthz)) and the Solid 2.0 Vite client ([http://localhost:3000](http://localhost:3000)) via `scripts/dev.ts`. Solid Reactivity Diagnostics dev panel is available at [http://localhost:3000/__solid/diagnostics](http://localhost:3000/__solid/diagnostics).

### Pre-Commit Verification

```bash
bun run codegen && bun run check && bun run typecheck && bun run build
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
