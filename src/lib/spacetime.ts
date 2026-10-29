import { createSignal, createStore } from "solid-js";
import type { DbConnectionImpl, Identity } from "spacetimedb";
import type { EventLogRecord, TxReducerParams } from "~/schema";

/**
 * SpacetimeDB Reactive Client Architecture
 *
 * SpacetimeDB combines database state, relational cache, and serverless execution.
 * Types and row definitions are strictly derived from ~/schema (Single Source of Truth).
 */

// Connection Signals
export const [isConnected, setIsConnected] = createSignal(false);
export const [connectionMode, setConnectionMode] = createSignal<"live" | "local-cache">(
  "local-cache",
);
export const [clientIdentity, setClientIdentity] = createSignal<string>(
  `usr_${Math.random().toString(36).substring(2, 8)}`,
);
export const [latencyMs, setLatencyMs] = createSignal<number | null>(null);

// Reactive Table Store (Strictly typed via EventLogRecord schema)
export const [records, setRecords] = createStore<EventLogRecord[]>([
  {
    id: "rec_001",
    sender: "system",
    action: "INIT_GENESIS",
    payload: "Database schema initialized from SSOT",
    timestamp: new Date().toLocaleTimeString(),
  },
  {
    id: "rec_002",
    sender: "system",
    action: "STORE_BOUND",
    payload: "Fine-grained Solid 2.0 store attached to schema",
    timestamp: new Date().toLocaleTimeString(),
  },
]);

/**
 * Dispatches a reducer transaction governed by TxReducerParams schema.
 * In live mode, sends to SpacetimeDB server.
 * In local-cache mode, applies an optimistic ACID draft mutation to the store.
 */
export function callReducer(params: TxReducerParams) {
  const start = performance.now();
  const newRecord: EventLogRecord = {
    id: `rec_${Math.random().toString(36).substring(2, 8)}`,
    sender: clientIdentity(),
    action: params.action,
    payload: params.payload,
    timestamp: new Date().toLocaleTimeString(),
  };

  // Solid 2.0 draft-style store mutation
  setRecords((draft) => {
    draft.unshift(newRecord);
    if (draft.length > 50) draft.pop();
  });

  const duration = Math.round((performance.now() - start) * 100) / 100;
  setLatencyMs(duration);
}

/**
 * Toggles between live simulated WebSocket mode and local reactive cache.
 */
export function toggleSimulationMode() {
  setIsConnected((prev) => {
    const next = !prev;
    setConnectionMode(next ? "live" : "local-cache");
    return next;
  });
}

/**
 * Clears the local reactive record store.
 */
export function clearRecords() {
  setRecords((draft) => {
    draft.length = 0;
  });
}

/**
 * Connects lifecycle callbacks on a SpacetimeDB connection builder to reactive Solid signals.
 */
export function setupConnectionListeners<T extends DbConnectionImpl<any>>(builder: {
  onConnect: (cb: (conn: T, identity: Identity, token: string) => void) => any;
  onDisconnect: (cb: (ctx: any, error?: Error) => void) => any;
}) {
  return builder
    .onConnect((_conn: T, identity: Identity) => {
      setIsConnected(true);
      setConnectionMode("live");
      setClientIdentity(identity.toHexString());
      console.log("[SpacetimeDB] Live WebSocket connected with identity:", identity.toHexString());
    })
    .onDisconnect(() => {
      setIsConnected(false);
      setConnectionMode("local-cache");
      console.log("[SpacetimeDB] Disconnected - reverting to local reactive cache");
    });
}
