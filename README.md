# Modern Solid 2.0 Fullstack Architecture (2026 Foundation)

A high-performance, type-safe, zero-tech-debt starter framework engineered for the 2026 web platform and AI-assisted development.

---

## ⚡ The 2026 Tech Stack

| Domain            | Technology                              | Version    | Purpose & Rationale                                                           |
| :---------------- | :-------------------------------------- | :--------- | :---------------------------------------------------------------------------- |
| **Runtime & PM**  | [Bun](https://bun.sh/)                  | `1.4.x`    | Blazing fast execution, unified package manager, native TS/JSX support.       |
| **Bundler**       | [Vite](https://vite.dev/) (Rolldown)    | `8.3.x`    | Instant HMR, static prerendering, and streaming SSR capability.               |
| **Reactive UI**   | [Solid.js 2.0](https://v2.solidjs.com/) | `2.0.0-rc` | Fine-grained reactivity, Zero-VDOM, async-first computations, draft stores.   |
| **Headless UI**   | [Ark UI](https://ark-ui.com/)           | `5.39.x`   | Accessible, robust state machines powered by [Zag.js](https://zagjs.com/).    |
| **Styling**       | [Panda CSS](https://panda-css.com/)     | `2.4.x`    | Zero-runtime, build-time static CSS-in-JS extraction with CSS cascade layers. |
| **Design System** | [Park UI](https://park-ui.com/)         | `0.43.x`   | Production-grade Panda CSS presets and accessible slot recipes.               |
| **Linter**        | [Oxlint](https://oxc.rs/)               | `1.79.x`   | Rust-based ultra-fast linter (50-100x faster than legacy ESLint).             |
| **Formatter**     | [Biome](https://biomejs.dev/)           | `2.6.x`    | Blazing-fast Rust formatter and import organizer (replaces Prettier).         |
| **Realtime DB**   | [SpacetimeDB](https://spacetimedb.com/) | `2.13.x`   | In-memory relational database with WebSocket client cache synchronization.    |
| **Typed RPC**     | [ConnectRPC](https://connectrpc.com/)   | `2.3.x`    | Type-safe Protobuf RPC for microservices and payment gateways (e.g. Stripe).  |

---

## 🏛️ Architecture & Golden Rules

### 1. Solid.js 2.0 Reactive Contract

- **Never Destructure Props**: Always access props directly as `props.name`. Destructuring strips reactivity.
- **Pass Values, Not Accessors**: Pass `value={count()}`, not `value={count}`.
- **Split `createEffect`**: Effects take two functions: `createEffect(() => trackSignal(), val => { /* side effect */ })`.
- **Draft Stores**: Modify stores inside draft closures: `setStore(draft => { draft.user.name = "Alex"; })`.
- **Boundaries**: Use `<Loading>` for async boundaries and `<Errored>` for error handling. (No `<Suspense>` or `<ErrorBoundary>`).

### 2. Layout & Styling: 宣告 Margin 死亡 (Declare Margin Dead)

- **Margin is DEAD**: NEVER use `margin`, `marginTop`, `marginBottom`, `marginLeft`, `marginRight`, `mt`, `mb`, `ml`, `mr`, `mx`, `my` anywhere.
- **Container-First Layout**: All layout spacing MUST be handled by framework containers (`<Container>`, `<Stack>`, `<VStack>`, `<HStack>`, `<Grid>`, `<Flex>`) using `gap`.
- **Typography First**: Do NOT use raw unstyled `<p>`, `<span>`, `<h1>`-`<h6>` tags. Use `<Heading>`, `<Text>`, and `<Code>` primitives from `~/components/ui/typography` which wrap Park UI's text recipe.
- **No Tailwind CSS**: All styling is statically analyzed through Panda CSS JSX layout primitives, `css({})`, `cva({})`, or Park UI recipes (`styled-system/recipes`).
- **Static Tokens**: Never interpolate runtime variables into style keys. Use recipe variants or style objects.

### 3. Headless UI (Ark UI + Park UI)

- **Autonomous Modal Lifecycle**: Modals operate headlessly via Zag.js state machines. `<Dialog.Portal>` internally encapsulates `<Show when={dialog().open}>` and `<SolidPortal>`, guaranteeing 100% clean physical DOM teardown on ESC or dismissal with zero ghost overlays and zero signal boilerplate.
- **No Boolean `asChild`**: Ark UI Solid components (`Dialog.Trigger`, etc.) are already polymorphic `<ark.button>` elements. Style them directly: `<Dialog.Trigger class={button({ variant: "outline" })}>`.
- **DOM Utilities**: Import `<Portal>` from `@solidjs/web`, not `solid-js`.

### 4. Data Layer: Schema 為單一真理來源 (Schema as SSOT)

- **Ban Arbitrary API Types**: NEVER handcraft loose, arbitrary `interface Record { ... }` or `type ApiPayload = { ... }` in component or service files.
- **Schema as Single Source of Truth**: All database tables, reducers, and RPC contracts MUST be formally defined in `src/schema/` (or generated from `spacetime generate` / `.proto`).
- **SpacetimeDB**: Real-time client synchronization runs through WebSocket subscriptions with fine-grained Solid 2.0 store bindings. Local in-memory cache acts as fallback.
- **ConnectRPC**: Use type-safe Connect clients (`@connectrpc/connect-web`) with schemas for microservices and third-party APIs (e.g. Stripe checkout).

---

## 📁 Project Structure

```
├── .agents/
│   └── skills/           # 9 Curated AI Agent Skills (Solid 2.0, Panda CSS, Ark UI, etc.)
├── .cursor/
│   └── mcp.json          # MCP configuration for Cursor IDE
├── .cursorrules          # Strict 2026 architectural directives for AI agents
├── .mcp.json             # Global Model Context Protocol configuration
├── AGENTS.md             # Standard agent guidelines and migration contracts
├── biome.json            # Biome 2.6 formatting & import organization rules
├── docs/
│   └── ai/               # Machine-readable documentation (llms.txt index)
├── oxlint.config.ts      # Oxlint configuration with Solid 2.0 linting plugin
├── package.json          # Modern dependency declarations & scripts
├── panda.config.ts       # Panda CSS design tokens & Park UI preset
├── patches/              # Upstream compatibility patches (Solid 2.0 ecosystem bridge)
├── src/
│   ├── App.tsx           # Canonical foundation starter application
│   ├── Document.tsx      # Zero-client-JS HTML shell & head manager
│   ├── index.css         # Panda CSS cascade layer imports
│   ├── components/
│   │   └── ui/
│   │       └── typography.tsx # SSOT Typography Primitives (Heading, Text, Code)
│   ├── lib/
│   │   ├── connect.ts    # ConnectRPC type-safe client setup
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
- [SpacetimeDB CLI](https://spacetimedb.com/install) (optional, for realtime database)

### Installation

```bash
bun install
```

### Development

```bash
bun run dev
```
Open [http://localhost:3000](http://localhost:3000) (or `http://localhost:3001` if SpacetimeDB is occupying port 3000).

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

## 🤖 AI Agent & MCP Integration

This template is purpose-built for seamless pair-programming with AI coding agents:
1. **MCP Servers**:
   - `panda`: `@pandacss/mcp` generates and queries design tokens.
   - `ark-ui`: `@ark-ui/mcp` queries headless component state machines.
   - `spacetimedb`: `spacetime mcp` inspects live tables and reducers.
2. **Context Documentation**:
   - `docs/ai/llms.txt`: Central machine-readable index.
   - `docs/ai/llms-solid-2.0.txt`, `llms-ark-ui.txt`, `llms-panda-css.txt`, `llms-spacetimedb.txt`, `llms-connect-rpc.txt`.
3. **Agent Skills (`.agents/skills/`)**:
   - `solid-2.0`, `solid-2.0-cheatsheet`, `reactivity-diagnostics`, `agent-loops`.
   - `panda-css`, `panda-css-migrate`, `panda-css-theming`.
   - `ark-ui-solid`, `spacetimedb`.
