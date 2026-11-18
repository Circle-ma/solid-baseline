import { reconcile } from "solid-js";
import {
  DbConnectionBuilder,
  DbConnectionImpl,
  procedures,
  reducerSchema,
  reducers,
  schema,
  t,
  table,
} from "spacetimedb";
import type {
  EventLogRecord,
  SpacetimeClientAdapter,
  SpacetimeConnectionOptions,
  SpacetimeDeleteCallback,
  SpacetimeEventCallback,
  SpacetimeSnapshotCallback,
  SpacetimeTransactionResult,
  TxReducerParams,
} from "~/schema";

/**
 * Canonical SpacetimeDB 2.15.x RemoteModule descriptor derived from SSOT event_log & tx_event.
 */
const eventLogTables = schema({
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

const eventLogReducers = reducers(
  reducerSchema("tx_event", {
    action: t.string(),
    payload: t.string(),
  }),
);

const eventLogProcedures = procedures();

const EVENT_LOG_REMOTE_MODULE = {
  ...eventLogTables.schemaType,
  ...eventLogReducers.reducersType,
  ...eventLogProcedures,
  versionInfo: { cliVersion: "2.0.0" },
};

/**
 * Offline Sandbox SpacetimeDB Engine
 * Executes deterministic transactions in-memory and dispatches committed state
 * events to listeners via unidirectional data flow.
 */
export class OfflineSandboxSpacetimeAdapter implements SpacetimeClientAdapter {
  readonly mode = "offline-sandbox" as const;
  private connected = true;
  private connectionStateListeners = new Set<(connected: boolean) => void>();
  private snapshotListeners = new Map<string, Set<SpacetimeSnapshotCallback<EventLogRecord>>>();
  private insertListeners = new Map<string, Set<SpacetimeEventCallback<EventLogRecord>>>();
  private updateListeners = new Map<string, Set<SpacetimeEventCallback<EventLogRecord>>>();
  private deleteListeners = new Map<string, Set<SpacetimeDeleteCallback>>();

  get isConnected(): boolean {
    return this.connected;
  }

  onConnectionStateChange(cb: (connected: boolean) => void): () => void {
    this.connectionStateListeners.add(cb);
    return () => {
      this.connectionStateListeners.delete(cb);
    };
  }

  private notifyConnectionState() {
    for (const cb of this.connectionStateListeners) {
      cb(this.connected);
    }
  }

  async connect(): Promise<void> {
    this.connected = true;
    this.notifyConnectionState();
  }

  disconnect(): void {
    this.connected = false;
    this.notifyConnectionState();
  }

  onSnapshot(tableName: string, callback: SpacetimeSnapshotCallback<EventLogRecord>): () => void {
    let set = this.snapshotListeners.get(tableName);
    if (!set) {
      set = new Set();
      this.snapshotListeners.set(tableName, set);
    }
    set.add(callback);
    return () => {
      set.delete(callback);
    };
  }

  onInsert(tableName: string, callback: SpacetimeEventCallback<EventLogRecord>): () => void {
    let set = this.insertListeners.get(tableName);
    if (!set) {
      set = new Set();
      this.insertListeners.set(tableName, set);
    }
    set.add(callback);
    return () => {
      set.delete(callback);
    };
  }

  onUpdate(tableName: string, callback: SpacetimeEventCallback<EventLogRecord>): () => void {
    let set = this.updateListeners.get(tableName);
    if (!set) {
      set = new Set();
      this.updateListeners.set(tableName, set);
    }
    set.add(callback);
    return () => {
      set.delete(callback);
    };
  }

  onDelete(tableName: string, callback: SpacetimeDeleteCallback): () => void {
    let set = this.deleteListeners.get(tableName);
    if (!set) {
      set = new Set();
      this.deleteListeners.set(tableName, set);
    }
    set.add(callback);
    return () => {
      set.delete(callback);
    };
  }

  /**
   * Emits a synthetic update event in sandbox mode (useful for tests and local simulation).
   */
  emitUpdate(record: EventLogRecord): void {
    const listeners = this.updateListeners.get("event_log");
    if (listeners) {
      for (const listener of listeners) {
        listener(record);
      }
    }
  }

  /**
   * Emits a synthetic delete event in sandbox mode (useful for tests and local simulation).
   */
  emitDelete(recordId: string): void {
    const listeners = this.deleteListeners.get("event_log");
    if (listeners) {
      for (const listener of listeners) {
        listener(recordId);
      }
    }
  }

  async callReducer(params: TxReducerParams): Promise<SpacetimeTransactionResult> {
    const start = performance.now();
    const txHash = `0x${Math.random().toString(16).substring(2, 10)}${Date.now().toString(16)}`;

    const newRecord: EventLogRecord = {
      id: `rec_${Math.random().toString(36).substring(2, 8)}`,
      sender: "sandbox_node_local",
      action: params.action,
      payload: params.payload,
      timestamp: new Date().toLocaleTimeString(),
    };

    // Microtask async dispatch following real event loop
    await Promise.resolve();

    const listeners = this.insertListeners.get("event_log");
    if (listeners) {
      for (const listener of listeners) {
        listener(newRecord);
      }
    }

    const duration = Math.round((performance.now() - start) * 100) / 100;
    return {
      status: "committed",
      txHash,
      executionDurationMs: duration,
    };
  }
}

function isEventLogRecord(value: unknown): value is EventLogRecord {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.sender === "string" &&
    typeof candidate.action === "string" &&
    typeof candidate.payload === "string" &&
    typeof candidate.timestamp === "string"
  );
}

/**
 * Live WebSocket SpacetimeDB Adapter
 * Connects to a running SpacetimeDB instance via SpacetimeDB SDK 2.15.x,
 * subscribes to `event_log`, and binds real `onInsert` / `onUpdate` / `onDelete` table streams.
 */
export class LiveSpacetimeAdapter implements SpacetimeClientAdapter {
  readonly mode = "live" as const;
  private connected = false;
  private connection: DbConnectionImpl<typeof EVENT_LOG_REMOTE_MODULE> | null = null;
  private unbindTableHandlers: (() => void) | null = null;
  private connectionStateListeners = new Set<(connected: boolean) => void>();
  private snapshotListeners = new Map<string, Set<SpacetimeSnapshotCallback<EventLogRecord>>>();
  private insertListeners = new Map<string, Set<SpacetimeEventCallback<EventLogRecord>>>();
  private updateListeners = new Map<string, Set<SpacetimeEventCallback<EventLogRecord>>>();
  private deleteListeners = new Map<string, Set<SpacetimeDeleteCallback>>();

  constructor(private options?: SpacetimeConnectionOptions) {}

  get isConnected(): boolean {
    return this.connected;
  }

  onConnectionStateChange(cb: (connected: boolean) => void): () => void {
    this.connectionStateListeners.add(cb);
    return () => {
      this.connectionStateListeners.delete(cb);
    };
  }

  private notifyConnectionState() {
    for (const cb of this.connectionStateListeners) {
      cb(this.connected);
    }
  }

  async connect(): Promise<void> {
    const uri =
      this.options?.uri ||
      (typeof import.meta !== "undefined" && import.meta.env?.VITE_SPACETIMEDB_URI) ||
      "ws://localhost:3000";
    const databaseName =
      this.options?.databaseName ||
      (typeof import.meta !== "undefined" && import.meta.env?.VITE_SPACETIMEDB_NAME) ||
      "system_db";

    const builder = new DbConnectionBuilder(
      EVENT_LOG_REMOTE_MODULE,
      (config) => new DbConnectionImpl(config),
    )
      .withUri(uri)
      .withDatabaseName(databaseName)
      .withAutomaticReconnect();

    if (this.options?.token) {
      builder.withToken(this.options.token);
    }

    builder.onConnect((conn) => {
      this.connected = true;
      this.notifyConnectionState();

      // Tear down any previous table handlers before rebinding on reconnect
      this.unbindTableHandlers?.();

      const handleInsert = (_ctx: unknown, row: EventLogRecord) => {
        const listeners = this.insertListeners.get("event_log");
        if (listeners) {
          for (const listener of listeners) {
            listener(row);
          }
        }
      };

      const handleUpdate = (_ctx: unknown, _oldRow: EventLogRecord, newRow: EventLogRecord) => {
        const listeners = this.updateListeners.get("event_log");
        if (listeners) {
          for (const listener of listeners) {
            listener(newRow);
          }
        }
      };

      const handleDelete = (_ctx: unknown, row: EventLogRecord) => {
        const listeners = this.deleteListeners.get("event_log");
        if (listeners) {
          for (const listener of listeners) {
            listener(row.id);
          }
        }
      };

      // 1. Bind incremental real-time table event callbacks
      conn.db.event_log.onInsert(handleInsert);
      conn.db.event_log.onUpdate(handleUpdate);
      conn.db.event_log.onDelete(handleDelete);

      // 2. Subscribe to event_log table and hydrate initial snapshot on apply
      const subscription = conn
        .subscriptionBuilder()
        .onApplied((ctx) => {
          const initialRows: EventLogRecord[] = [];
          for (const row of ctx.db.event_log.iter()) {
            if (isEventLogRecord(row)) {
              initialRows.push(row);
            }
          }
          const listeners = this.snapshotListeners.get("event_log");
          if (listeners && initialRows.length > 0) {
            for (const listener of listeners) {
              listener(initialRows);
            }
          }
        })
        .subscribe(["SELECT * FROM event_log"]);

      this.unbindTableHandlers = () => {
        conn.db.event_log.removeOnInsert(handleInsert);
        conn.db.event_log.removeOnUpdate(handleUpdate);
        conn.db.event_log.removeOnDelete(handleDelete);
        if (!subscription.isEnded()) {
          subscription.unsubscribe();
        }
      };
    });

    builder.onDisconnect(() => {
      this.connected = false;
      this.notifyConnectionState();
    });

    this.connection = builder.build();
  }

  disconnect(): void {
    this.unbindTableHandlers?.();
    this.unbindTableHandlers = null;
    if (this.connection) {
      this.connection.disconnect();
      this.connection = null;
    }
    this.connected = false;
    this.notifyConnectionState();
  }

  onSnapshot(tableName: string, callback: SpacetimeSnapshotCallback<EventLogRecord>): () => void {
    let set = this.snapshotListeners.get(tableName);
    if (!set) {
      set = new Set();
      this.snapshotListeners.set(tableName, set);
    }
    set.add(callback);
    return () => {
      set.delete(callback);
    };
  }

  onInsert(tableName: string, callback: SpacetimeEventCallback<EventLogRecord>): () => void {
    let set = this.insertListeners.get(tableName);
    if (!set) {
      set = new Set();
      this.insertListeners.set(tableName, set);
    }
    set.add(callback);
    return () => {
      set.delete(callback);
    };
  }

  onUpdate(tableName: string, callback: SpacetimeEventCallback<EventLogRecord>): () => void {
    let set = this.updateListeners.get(tableName);
    if (!set) {
      set = new Set();
      this.updateListeners.set(tableName, set);
    }
    set.add(callback);
    return () => {
      set.delete(callback);
    };
  }

  onDelete(tableName: string, callback: SpacetimeDeleteCallback): () => void {
    let set = this.deleteListeners.get(tableName);
    if (!set) {
      set = new Set();
      this.deleteListeners.set(tableName, set);
    }
    set.add(callback);
    return () => {
      set.delete(callback);
    };
  }

  async callReducer(params: TxReducerParams): Promise<SpacetimeTransactionResult> {
    const start = performance.now();
    const txHash = `0x${Math.random().toString(16).substring(2, 10)}${Date.now().toString(16)}`;

    if (!this.connection || !this.connected) {
      return {
        status: "failed",
        txHash,
        executionDurationMs: Math.round((performance.now() - start) * 100) / 100,
      };
    }

    try {
      await this.connection.reducers.txEvent({
        action: params.action,
        payload: params.payload,
      });
      return {
        status: "committed",
        txHash,
        executionDurationMs: Math.round((performance.now() - start) * 100) / 100,
      };
    } catch {
      return {
        status: "failed",
        txHash,
        executionDurationMs: Math.round((performance.now() - start) * 100) / 100,
      };
    }
  }
}

/**
 * Factory creating the SpacetimeDB adapter according to configured mode.
 */
export function createSpacetimeAdapter(
  mode: "live" | "offline-sandbox" = "offline-sandbox",
  options?: SpacetimeConnectionOptions,
): SpacetimeClientAdapter {
  if (mode === "live") {
    return new LiveSpacetimeAdapter(options);
  }
  return new OfflineSandboxSpacetimeAdapter();
}

/**
 * Solid 2.0 Bulk Snapshot Store Synchronization via `reconcile`
 * Used for initial bulk subscription hydration (`onApplied`) to preserve row identities.
 * For incremental `onInsert` / `onUpdate` / `onDelete`, mutate the store draft directly.
 */
export function reconcileTableStore<T extends { id: string }>(
  setStore: (fn: (draft: T[]) => void) => void,
  nextRows: T[],
  key: keyof T = "id",
) {
  setStore((draft) => {
    reconcile(nextRows, key as string)(draft);
  });
}
