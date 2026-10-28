# Modern Solid 2.0 Baseline Architecture (2026 Foundation)

A high-performance, type-safe, zero-tech-debt starter framework engineered for the 2026 web platform and AI-assisted development.

---

## ⚡ The 2026 Tech Stack

| Domain           | Technology                              | Version    | Purpose & Rationale                                                           |
| :--------------- | :-------------------------------------- | :--------- | :---------------------------------------------------------------------------- |
| **Architecture** | Solid 2.0 Start-Mode SPA                | `Standard` | Unified 2.0 convention (`Document.tsx` + `App.tsx`), 1-boolean SSR readiness. |
| **Runtime & PM** | [Bun](https://bun.sh/)                  | `1.4.x`    | Blazing fast execution, unified package manager, native TS/JSX support.       |
| **Bundler**      | [Vite](https://vite.dev/) (Rolldown)    | `8.3.x`    | Instant HMR and lightning-fast ESNext client bundle extraction (<120ms).      |
| **Reactive UI**  | [Solid.js 2.0](https://v2.solidjs.com/) | `2.0.0-rc` | Fine-grained reactivity, Zero-VDOM, async-first computations, draft stores.   |
| **Headless UI**  | [Ark UI](https://ark-ui.com/)           | `5.39.x`   | Accessible, robust state machines powered by [Zag.js](https://zagjs.com/).    |
| **Styling**      | [Panda CSS](https://panda-css.com/)     | `2.4.x`    | Zero-runtime build-time CSS-in-JS with strict tokens & native slot recipes.   |
| **Linter**       | [Oxlint](https://oxc.rs/)               | `1.79.x`   | Rust-based ultra-fast linter with Solid 2.0 reactivity rules.                 |
| **Formatter**    | [Biome](https://biomejs.dev/)           | `2.6.x`    | Blazing-fast Rust formatter and import organizer (replaces Prettier).         |
| **Realtime DB**  | [SpacetimeDB](https://spacetimedb.com/) | `2.13.x`   | In-memory relational database with WebSocket client cache synchronization.    |
| **Typed RPC**    | [ConnectRPC](https://connectrpc.com/)   | `2.3.x`    | Type-safe Protobuf and JSON RPC for microservices & payment APIs.             |

---

## 🏛️ Architecture & Golden Rules

### 1. Solid.js 2.0 Reactive Contract

- **Never Destructure Props**: Always access props directly as `props.name`. Destructuring strips reactivity.
- **Pass Values, Not Accessors**: Pass `value={count()}`, not `value={count}`.
- **Split `createEffect`**: Effects take two functions: `createEffect(() => trackSignal(), val => { /* side effect */ })`.
- **Draft Stores**: Modify stores inside draft closures: `setStore(draft => { draft.user.name = "Alex"; })`.
- **Boundaries**: Use `<Loading>` for async boundaries and `<Errored>` for error handling. (No `<Suspense>` or `<ErrorBoundary>`).

### 2. Layout & Styling: Paved Path Design Rails

- **Container-First Layout**: Sibling spacing MUST be handled by framework containers (`<Container>`, `<VStack>`, `<HStack>`, `<Grid>`) using `gap`.
- **Layout Alignment**: While sibling push-margins are banned, layout alignment margins (`m="auto"`, `ml="auto"`) are permitted for flex positioning.
- **Typography First**: Do NOT use raw unstyled `<p>`, `<span>`, `<h1>`-`<h6>` tags. Use `<Heading>`, `<Text>`, and `<Code>` primitives from `~/components/ui/typography`.
- **Native Slot Recipes**: Components bind cleanly to Panda CSS 2.4 slot recipes (`card`, `dialog`, `button`, `badge`, `text`) without redundant duplicate inline overrides.
- **Strict Tokens**: Compiler enforces `strictTokens: true` and `strictPropertyValues: true`. No magic pixel values or random hex colors.

### 3. Headless UI (Ark UI + Zag.js)

- **Autonomous Modal Lifecycle**: Modals operate headlessly via Zag.js state machines. `<Dialog.Portal>` internally binds to `useDialogContext()` and `<Show when={dialog().open}>`, guaranteeing 100% clean physical DOM teardown on ESC or dismissal with zero ghost overlays and zero signal boilerplate.
- **No Boolean `asChild`**: Ark UI Solid components are already polymorphic elements. Style them with typesafe variants: `<Dialog.Trigger variant="outline">` or use `<Button>`.
- **DOM Utilities**: Import `<Portal>` from `@solidjs/web`, not `solid-js`.

### 4. Data Layer: Schema as Single Source of Truth (SSOT)

- **Ban Arbitrary API Types**: NEVER handcraft loose, arbitrary `interface Record { ... }` or `type ApiPayload = { ... }` in component or service files.
- **Schema as Single Source of Truth**: All database tables, reducers, and RPC contracts MUST be formally defined in `src/schema/` (or generated from `spacetime generate` / `buf generate`).
- **SpacetimeDB**: Real-time client synchronization runs through WebSocket subscriptions with fine-grained Solid 2.0 store bindings. Local in-memory cache acts as fallback.
- **ConnectRPC**: Use type-safe Connect clients (`@connectrpc/connect-web`) with typed request/response contracts for backend microservices and payment gateways.

---

## 📁 Project Structure

```
├── .agents/
│   └── skills/           # Curated AI Agent Skills (Solid 2.0, Panda CSS, Ark UI, etc.)
├── .mcp.json             # Model Context Protocol configuration
├── .cursorrules          # Strict 2026 architectural directives for AI agents
├── AGENTS.md             # Standard agent guidelines and migration contracts
├── biome.json            # Biome 2.6 formatting & import organization rules
├── docs/
│   └── ai/               # Machine-readable documentation (llms.txt index)
├── index.html            # Standard SPA HTML entry point
├── oxlint.config.ts      # Oxlint configuration with Solid 2.0 linting plugin
├── package.json          # Modern dependency declarations & scripts
├── panda.config.ts       # Panda CSS 2.4 tokens, semantic tokens, and slot recipes
├── patches/              # Upstream compatibility patch (Ark UI 5.x <-> Solid 2.0 bridge)
├── src/
│   ├── App.tsx           # Canonical foundation starter application
│   ├── index.tsx         # Clean client mount entry (render -> #root)
│   ├── index.css         # Panda CSS cascade layer imports
│   ├── components/
│   │   └── ui/           # Paved Path UI Primitives (Button, Badge, Card, Dialog, Layout, Typography, Tokens)
│   ├── lib/
│   │   ├── connect.ts    # ConnectRPC type-safe client pipeline
│   │   └── spacetime.ts  # SpacetimeDB reactive signal bridge
│   └── schema/           # Schema as Single Source of Truth (SSOT)
│       ├── connect.ts    # ConnectRPC message & service contracts
│       ├── index.ts      # Centralized schema export
│       └── spacetimedb.ts# SpacetimeDB table & reducer schemas
├── tsconfig.json         # Strict TypeScript compiler options
└── vite.config.ts        # Vite + Panda CSS + Solid 2.0 compiler pipeline
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
Open [http://localhost:3000](http://localhost:3000).

### Code Quality & Verification

```bash
# Lint with Oxlint and verify format with Biome
bun run check

# Format files and organize imports
bun run format

# Run TypeScript typechecker
bun run typecheck

# Build for production
bun run build
```

---

## 🧩 Upstream Ecosystem Bridge (`patches/`)

Solid.js 2.0 introduces major architectural improvements (fine-grained async computations, removal of `splitProps` / `onMount` in favor of direct property access and `onCleanup`).

To allow headless UI component libraries powered by Zag.js (`@ark-ui/solid`) to run smoothly on Solid 2.0 without runtime crashes, this baseline includes a lightweight compatibility bridge via Bun's `patchedDependencies`:
- Restores shim interfaces for `splitProps`, `mergeProps`, and `onMount`.
- Adds `provider.Provider = provider` for React/Solid 1.x style context providers.
- Sets `ownedWrite: true` for internal Zag.js signal updates.

This ensures you can build with full Solid 2.0 reactivity today while maintaining 100% accessible Ark UI primitives.
