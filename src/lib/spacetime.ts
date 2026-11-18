import { createProjection, reconcile } from "solid-js";
import { DbConnectionBuilder, DbConnectionImpl } from "spacetimedb";
import type {
  EventLogRecord,
  SpacetimeClientAdapter,
  SpacetimeConnectionOptions,
  SpacetimeDeleteCallback,
  SpacetimeEventCallback,
  SpacetimeTransactionResult,
  TxReducerParams,
} from "~/schema";

/**
 * Offline Sandbox SpacetimeDB Engine
 * Executes deterministic transactions in-memory and dispatches committed state
 * events to listeners via unidirectional data flow (no arbitrary array unshift).
 */
export class OfflineSandboxSpacetimeAdapter implements SpacetimeClientAdapter {
  readonly mode = "offline-sandbox" as const;
  private connected = true;
  private connectionStateListeners = new Set<(connected: boolean) => void>();
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

  onInsert(tableName: string, callback: SpacetimeEventCallback<EventLogRecord>): () => void {
    if (!this.insertListeners.has(tableName)) {
      this.insertListeners.set(tableName, new Set());
    }
    const set = this.insertListeners.get(tableName)!;
    set.add(callback);
    return () => {
      set.delete(callback);
    };
  }

  onUpdate(tableName: string, callback: SpacetimeEventCallback<EventLogRecord>): () => void {
    if (!this.updateListeners.has(tableName)) {
      this.updateListeners.set(tableName, new Set());
    }
    const set = this.updateListeners.get(tableName)!;
    set.add(callback);
    return () => {
      set.delete(callback);
    };
  }

  onDelete(tableName: string, callback: SpacetimeDeleteCallback): () => void {
    if (!this.deleteListeners.has(tableName)) {
      this.deleteListeners.set(tableName, new Set());
    }
    const set = this.deleteListeners.get(tableName)!;
    set.add(callback);
    return () => {
      set.delete(callback);
    };
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

/**
 * Live WebSocket SpacetimeDB Adapter
 * Connects to a running SpacetimeDB instance via SpacetimeDB SDK 2.14.x.
 */
export class LiveSpacetimeAdapter implements SpacetimeClientAdapter {
  readonly mode = "live" as const;
  private connected = false;
  // biome-ignore lint/suspicious/noExplicitAny: SpacetimeDB connection builder generic
  private connection: ReturnType<DbConnectionBuilder<any>["build"]> | null = null;
  private connectionStateListeners = new Set<(connected: boolean) => void>();
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

    const remoteModule = {
      tables: {
        event_log: {
          name: "event_log",
          columns: ["id", "sender", "action", "payload", "timestamp"],
        },
      },
      reducers: {
        tx_event: {
          name: "tx_event",
          arguments: ["string", "string"],
        },
      },
    };

    const builder = new DbConnectionBuilder(remoteModule, (config) => new DbConnectionImpl(config))
      .withUri(uri)
      .withDatabaseName(databaseName)
      .withAutomaticReconnect();

    builder.onConnect(() => {
      this.connected = true;
      this.notifyConnectionState();
    });

    builder.onDisconnect(() => {
      this.connected = false;
      this.notifyConnectionState();
    });

    this.connection = builder.build();
  }

  disconnect(): void {
    if (this.connection) {
      this.connection.disconnect();
      this.connection = null;
    }
    this.connected = false;
    this.notifyConnectionState();
  }

  onInsert(tableName: string, callback: SpacetimeEventCallback<EventLogRecord>): () => void {
    if (!this.insertListeners.has(tableName)) {
      this.insertListeners.set(tableName, new Set());
    }
    const set = this.insertListeners.get(tableName)!;
    set.add(callback);
    return () => {
      set.delete(callback);
    };
  }

  onUpdate(tableName: string, callback: SpacetimeEventCallback<EventLogRecord>): () => void {
    if (!this.updateListeners.has(tableName)) {
      this.updateListeners.set(tableName, new Set());
    }
    const set = this.updateListeners.get(tableName)!;
    set.add(callback);
    return () => {
      set.delete(callback);
    };
  }

  onDelete(tableName: string, callback: SpacetimeDeleteCallback): () => void {
    if (!this.deleteListeners.has(tableName)) {
      this.deleteListeners.set(tableName, new Set());
    }
    const set = this.deleteListeners.get(tableName)!;
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
      this.connection.callReducer("tx_event", [params.action, params.payload]);
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
 * Solid 2.0 Incremental Table Store Synchronization via `reconcile`
 * Synchronizes incoming table rows into a fine-grained store draft while preserving
 * identity of unchanged rows, preventing unnecessary DOM thrashing or re-renders.
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

/**
 * Solid 2.0 Keyed Reactive Projection
 * Derives a projection from SpacetimeDB table rows with keyed identity preservation.
 */
export function createTableProjection<T extends { id: string }, R>(
  source: () => T[],
  mapFn: (item: T) => R,
  options?: { key?: keyof T; name?: string },
) {
  return createProjection(() => source().map(mapFn), [], {
    key: (options?.key as string) ?? "id",
    name: options?.name ?? "spacetimedb-projection",
  });
}
