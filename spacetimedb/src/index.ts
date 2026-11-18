import { SenderError, schema, t, table } from "spacetimedb/server";

/**
 * SpacetimeDB 2.x Server Module (`system_db`)
 *
 * Schema-aligned counterpart to `src/schema/spacetimedb.ts`.
 * Publish locally on port 3001:
 *   spacetime start --listen-addr 127.0.0.1:3001
 *   bun run spacetime:publish
 */
const spacetimedb = schema({
  event_log: table(
    { name: "event_log", public: true },
    {
      id: t.string().primaryKey(),
      sender: t.string(),
      action: t.string(),
      payload: t.string(),
      timestamp: t.string(),
    },
  ),
});

export default spacetimedb;

export const init = spacetimedb.init((ctx) => {
  if (ctx.db.event_log.count() > 0n) {
    return;
  }

  ctx.db.event_log.insert({
    id: "rec_genesis",
    sender: "system",
    action: "INIT_GENESIS",
    payload: "SpacetimeDB 2.x live module initialized",
    timestamp: ctx.timestamp.toISOString(),
  });
});

export const tx_event = spacetimedb.reducer(
  {
    action: t.string(),
    payload: t.string(),
  },
  (ctx, { action, payload }) => {
    const trimmedAction = action.trim();
    if (!trimmedAction) {
      throw new SenderError("Reducer action must not be empty");
    }

    ctx.db.event_log.insert({
      id: ctx.newUuidV7().toString(),
      sender: ctx.sender.toHexString(),
      action: trimmedAction,
      payload,
      timestamp: ctx.timestamp.toISOString(),
    });
  },
);
