---

name: spacetimedb
description: Guide for building real-time apps with SpacetimeDB 2.x and Solid.js 2.0. Use when setting up subscriptions, calling reducers, or binding database tables to Solid reactive signals.
---

# SpacetimeDB 2.15 with Solid.js 2.0

SpacetimeDB combines a relational database and serverless execution engine. Clients connect over WebSocket and synchronize local table state reactively into Solid 2.0 stores.

## 1. Package & Tooling

- **SDK**: `spacetimedb` (`^2.15.0`). Do NOT use the legacy `@spacetimedb/sdk`.
- **CLI**: `spacetime` (e.g. `bun run spacetime:generate`, `bun run spacetime:publish`).
- **Schema SSOT**: Define tables and reducers via `table()`, `schema()`, `reducerSchema()`, and `reducers()` in `src/schema/spacetimedb.ts`, aligned with `spacetimedb/src/index.ts`.

## 2. Code Generation Workflow

Generate typed TypeScript bindings from the server module when using generated client bindings:

```bash
bun run spacetime:generate
# -> spacetime generate --lang typescript --out-dir src/module_bindings --project-path spacetimedb
```

## 3. Connecting to Solid 2.0 Stores (Provider-Scoped)

Avoid module-level mutable singletons and `any[]`. Keep the reactive store scoped inside `<SpacetimeProvider>` with typed records (`EventLogRecord`), hydrate snapshots via `ctx.db.event_log.iter()` + Solid 2.0 `reconcile()` (including empty `[]` snapshots), and mutate drafts in place for incremental events:

```typescript
import { createStore, reconcile } from "solid-js";
import { DbConnectionBuilder, DbConnectionImpl } from "spacetimedb";
import { type EventLogRecord, SPACETIME_REMOTE_MODULE } from "~/schema/spacetimedb";

// Scoped inside a Provider component — never a module-level mutable singleton
const [records, setRecords] = createStore<EventLogRecord[]>([]);

const builder = new DbConnectionBuilder(
  SPACETIME_REMOTE_MODULE,
  (config) => new DbConnectionImpl(config),
)
  .withUri(import.meta.env.VITE_SPACETIMEDB_URI || "ws://localhost:3001")
  .withDatabaseName(import.meta.env.VITE_SPACETIMEDB_NAME || "system_db")
  .withAutomaticReconnect()
  .onConnect((conn) => {
    // 1. Bind incremental real-time mutations using Solid 2.0 draft setters
    conn.db.event_log.onInsert((_ctx, row) => {
      setRecords((draft) => {
        draft.unshift(row);
      });
    });

    conn.db.event_log.onUpdate((_ctx, _oldRow, newRow) => {
      setRecords((draft) => {
        const index = draft.findIndex((item) => item.id === newRow.id);
        if (index !== -1) draft[index] = newRow;
      });
    });

    conn.db.event_log.onDelete((_ctx, row) => {
      setRecords((draft) => {
        const index = draft.findIndex((item) => item.id === row.id);
        if (index !== -1) draft.splice(index, 1);
      });
    });

    // 2. Subscribe and always reconcile initial snapshot (including empty `[]`)
    conn
      .subscriptionBuilder()
      .onApplied((ctx) => {
        const snapshot = Array.from(ctx.db.event_log.iter());
        setRecords((draft) => {
          reconcile(snapshot, "id")(draft);
        });
      })
      .subscribe(["SELECT * FROM event_log"]);
  });

const conn = builder.build();
```

## 4. Invoking Transactions (Reducers)

Reducers execute ACID transactions on the server and return a Promise:

```typescript
await conn.reducers.txEvent({
  action: "TX_EVENT",
  payload: `Mutation @ ${new Date().toISOString()}`,
});
```
