import { reconcile } from "solid-js";
import { DbConnectionBuilder, DbConnectionImpl } from "spacetimedb";
import {
  type EventLogRecord,
  SPACETIME_REMOTE_MODULE,
  type SpacetimeClientAdapter,
  type SpacetimeConnectionOptions,
  type SpacetimeDbConnection,
  type SpacetimeDeleteCallback,
  type SpacetimeErrorCallback,
  type SpacetimeEventCallback,
  type SpacetimeIdentityCallback,
  type SpacetimeLiveConnectionBuilderLike,
  type SpacetimeLiveConnectionLike,
  type SpacetimeReducerName,
  type SpacetimeReducerParamsMap,
  type SpacetimeReducersClient,
  type SpacetimeSnapshotCallback,
  type SpacetimeTransactionResult,
  type TxReducerParams,
} from "~/schema/spacetimedb";

const DEFAULT_SPACETIMEDB_URI = "ws://localhost:3001";
const DEFAULT_SPACETIMEDB_NAME = "system_db";

/**
 * Generates a collision-resistant short identifier using Web Crypto (`crypto.randomUUID`),
 * falling back safely to `crypto.getRandomValues` or a monotonic counter in restricted runtimes.
 */
let fallbackIdCounter = 0;
export function createShortId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
  }
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${prefix}_${hex}`;
  }
  fallbackIdCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${fallbackIdCounter.toString(36)}`;
}

/**
 * Adapts a concrete SpacetimeDB 2.15 `DbConnectionImpl` instance into the
 * structural `SpacetimeLiveConnectionLike` contract with full compile-time verification.
 */
function adaptSpacetimeConnection(conn: SpacetimeDbConnection): SpacetimeLiveConnectionLike {
  return {
    db: {
      event_log: {
        onInsert: (cb) => conn.db.event_log.onInsert(cb),
        onUpdate: (cb) => conn.db.event_log.onUpdate(cb),
        onDelete: (cb) => conn.db.event_log.onDelete(cb),
        removeOnInsert: (cb) => conn.db.event_log.removeOnInsert(cb),
        removeOnUpdate: (cb) => conn.db.event_log.removeOnUpdate(cb),
        removeOnDelete: (cb) => conn.db.event_log.removeOnDelete(cb),
        iter: () => conn.db.event_log.iter(),
      },
    },
    reducers: {
      txEvent: (params) => conn.reducers.txEvent(params),
    },
    subscriptionBuilder: () => {
      const subBuilder = conn.subscriptionBuilder();
      return {
        onApplied: (cb) => {
          subBuilder.onApplied((ctx) => {
            cb({
              db: {
                event_log: {
                  iter: () => ctx.db.event_log.iter(),
                },
              },
            });
          });
          return {
            subscribe: (queries) => subBuilder.subscribe(queries),
          };
        },
      };
    },
    disconnect: () => conn.disconnect(),
  };
}

/**
 * Adapts a concrete SpacetimeDB 2.15 `DbConnectionBuilder` into `SpacetimeLiveConnectionBuilderLike`
 * without unsafe type casts.
 */
function createTypedSdkBuilder(): SpacetimeLiveConnectionBuilderLike {
  const sdkBuilder = new DbConnectionBuilder<SpacetimeDbConnection>(
    SPACETIME_REMOTE_MODULE,
    (config) => new DbConnectionImpl(config),
  );

  const wrapper: SpacetimeLiveConnectionBuilderLike = {
    withUri(uri) {
      sdkBuilder.withUri(uri);
      return wrapper;
    },
    withDatabaseName(name) {
      sdkBuilder.withDatabaseName(name);
      return wrapper;
    },
    withAutomaticReconnect() {
      sdkBuilder.withAutomaticReconnect();
      return wrapper;
    },
    withToken(token) {
      sdkBuilder.withToken(token);
      return wrapper;
    },
    onConnect(cb) {
      sdkBuilder.onConnect((conn, identity) => cb(adaptSpacetimeConnection(conn), identity));
      return wrapper;
    },
    onAutomaticReconnect(cb) {
      sdkBuilder.onAutomaticReconnect((conn, identity) =>
        cb(adaptSpacetimeConnection(conn), identity),
      );
      return wrapper;
    },
    onConnectError(cb) {
      sdkBuilder.onConnectError((ctx, error) => cb(ctx, error));
      return wrapper;
    },
    onDisconnect(cb) {
      sdkBuilder.onDisconnect((ctx, error) => cb(ctx, error));
      return wrapper;
    },
    build() {
      return adaptSpacetimeConnection(sdkBuilder.build());
    },
  };

  return wrapper;
}

/**
 * Offline Sandbox SpacetimeDB Engine
 * Executes deterministic transactions in-memory with ISO-8601 UTC timestamps
 * and dispatches committed state events to listeners via unidirectional data flow.
 */
export class OfflineSandboxSpacetimeAdapter implements SpacetimeClientAdapter {
  readonly mode = "offline-sandbox" as const;
  private connected = true;
  private currentIdentity: string | null = "sandbox_node_local";
  private currentError: string | null = null;
  private connectionStateListeners = new Set<(connected: boolean) => void>();
  private identityListeners = new Set<SpacetimeIdentityCallback>();
  private errorListeners = new Set<SpacetimeErrorCallback>();
  private snapshotListeners = new Map<string, Set<SpacetimeSnapshotCallback<EventLogRecord>>>();
  private insertListeners = new Map<string, Set<SpacetimeEventCallback<EventLogRecord>>>();
  private updateListeners = new Map<string, Set<SpacetimeEventCallback<EventLogRecord>>>();
  private deleteListeners = new Map<string, Set<SpacetimeDeleteCallback>>();

  readonly reducers: SpacetimeReducersClient = {
    txEvent: (params) => this.executeTxEvent(params),
  };

  constructor(private initialSnapshot?: EventLogRecord[]) {}

  get isConnected(): boolean {
    return this.connected;
  }

  get identity(): string | null {
    return this.currentIdentity;
  }

  get lastError(): string | null {
    return this.currentError;
  }

  setIdentity(identity: string): void {
    this.currentIdentity = identity;
    this.notifyIdentityChange();
  }

  onConnectionStateChange(cb: (connected: boolean) => void): () => void {
    this.connectionStateListeners.add(cb);
    return () => {
      this.connectionStateListeners.delete(cb);
    };
  }

  onIdentityChange(cb: SpacetimeIdentityCallback): () => void {
    this.identityListeners.add(cb);
    return () => {
      this.identityListeners.delete(cb);
    };
  }

  onErrorChange(cb: SpacetimeErrorCallback): () => void {
    this.errorListeners.add(cb);
    return () => {
      this.errorListeners.delete(cb);
    };
  }

  private notifyConnectionState() {
    for (const cb of this.connectionStateListeners) {
      cb(this.connected);
    }
  }

  private notifyIdentityChange() {
    for (const cb of this.identityListeners) {
      cb(this.currentIdentity);
    }
  }

  private setError(error: string | null) {
    this.currentError = error;
    for (const cb of this.errorListeners) {
      cb(this.currentError);
    }
  }

  async connect(): Promise<void> {
    this.connected = true;
    this.currentIdentity = this.currentIdentity ?? "sandbox_node_local";
    this.setError(null);
    this.notifyConnectionState();
    this.notifyIdentityChange();
    if (this.initialSnapshot !== undefined) {
      this.emitSnapshot(this.initialSnapshot);
    }
  }

  disconnect(): void {
    this.connected = false;
    this.currentIdentity = null;
    this.notifyConnectionState();
    this.notifyIdentityChange();
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
   * Dispatches a bulk table snapshot in sandbox mode (mirrors Live `onApplied` hydration).
   */
  emitSnapshot(rows: EventLogRecord[]): void {
    const listeners = this.snapshotListeners.get("event_log");
    if (listeners) {
      for (const listener of listeners) {
        listener(rows);
      }
    }
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

  callReducer<K extends SpacetimeReducerName>(
    name: K,
    params: SpacetimeReducerParamsMap[K],
  ): Promise<SpacetimeTransactionResult> {
    return this.reducers[name](params);
  }

  private async executeTxEvent(params: TxReducerParams): Promise<SpacetimeTransactionResult> {
    const start = performance.now();

    if (!this.connected) {
      const error = "Offline sandbox adapter is disconnected";
      this.setError(error);
      return {
        status: "failed",
        executionDurationMs: Math.round((performance.now() - start) * 100) / 100,
        error,
      };
    }

    const newRecord: EventLogRecord = {
      id: createShortId("rec"),
      sender: this.currentIdentity ?? "sandbox_node_local",
      action: params.action,
      payload: params.payload,
      timestamp: new Date().toISOString(),
    };

    // Microtask async dispatch following real event loop
    await Promise.resolve();

    const listeners = this.insertListeners.get("event_log");
    if (listeners) {
      for (const listener of listeners) {
        listener(newRecord);
      }
    }

    this.setError(null);
    const duration = Math.round((performance.now() - start) * 100) / 100;
    return {
      status: "committed",
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
 * awaits real WebSocket handshake (`onConnect` / `onConnectError`), syncs server Identity,
 * clears stale identity on disconnect, clears errors on automatic reconnect,
 * subscribes to `event_log` (including empty-table snapshot sync), and exposes typed reducer methods.
 */
export class LiveSpacetimeAdapter implements SpacetimeClientAdapter {
  readonly mode = "live" as const;
  private connected = false;
  private currentIdentity: string | null = null;
  private currentError: string | null = null;
  private connection: SpacetimeLiveConnectionLike | null = null;
  private unbindTableHandlers: (() => void) | null = null;
  private abortPendingConnect: ((reason: Error) => void) | null = null;
  private connectionStateListeners = new Set<(connected: boolean) => void>();
  private identityListeners = new Set<SpacetimeIdentityCallback>();
  private errorListeners = new Set<SpacetimeErrorCallback>();
  private snapshotListeners = new Map<string, Set<SpacetimeSnapshotCallback<EventLogRecord>>>();
  private insertListeners = new Map<string, Set<SpacetimeEventCallback<EventLogRecord>>>();
  private updateListeners = new Map<string, Set<SpacetimeEventCallback<EventLogRecord>>>();
  private deleteListeners = new Map<string, Set<SpacetimeDeleteCallback>>();

  readonly reducers: SpacetimeReducersClient = {
    txEvent: (params) => this.executeLiveReducer("txEvent", params),
  };

  constructor(private options?: SpacetimeConnectionOptions) {}

  get isConnected(): boolean {
    return this.connected;
  }

  get identity(): string | null {
    return this.currentIdentity;
  }

  get lastError(): string | null {
    return this.currentError;
  }

  onConnectionStateChange(cb: (connected: boolean) => void): () => void {
    this.connectionStateListeners.add(cb);
    return () => {
      this.connectionStateListeners.delete(cb);
    };
  }

  onIdentityChange(cb: SpacetimeIdentityCallback): () => void {
    this.identityListeners.add(cb);
    return () => {
      this.identityListeners.delete(cb);
    };
  }

  onErrorChange(cb: SpacetimeErrorCallback): () => void {
    this.errorListeners.add(cb);
    return () => {
      this.errorListeners.delete(cb);
    };
  }

  private notifyConnectionState() {
    for (const cb of this.connectionStateListeners) {
      cb(this.connected);
    }
  }

  private notifyIdentityChange() {
    for (const cb of this.identityListeners) {
      cb(this.currentIdentity);
    }
  }

  private setError(error: string | null) {
    this.currentError = error;
    for (const cb of this.errorListeners) {
      cb(this.currentError);
    }
  }

  private bindTableSubscription(conn: SpacetimeLiveConnectionLike) {
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

    // 2. Subscribe to event_log table and always hydrate snapshot on apply (including empty `[]`)
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
        if (listeners) {
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
  }

  connect(): Promise<void> {
    if (this.connection) {
      this.disconnect();
    }

    const uri =
      this.options?.uri ||
      (typeof import.meta !== "undefined" && import.meta.env?.VITE_SPACETIMEDB_URI) ||
      DEFAULT_SPACETIMEDB_URI;
    const databaseName =
      this.options?.databaseName ||
      (typeof import.meta !== "undefined" && import.meta.env?.VITE_SPACETIMEDB_NAME) ||
      DEFAULT_SPACETIMEDB_NAME;

    return new Promise<void>((resolveConnect, rejectConnect) => {
      let settled = false;

      const finishResolve = () => {
        if (!settled) {
          settled = true;
          this.abortPendingConnect = null;
          resolveConnect();
        }
      };

      const finishReject = (err: Error) => {
        if (!settled) {
          settled = true;
          this.abortPendingConnect = null;
          rejectConnect(err);
        }
      };

      this.abortPendingConnect = finishReject;

      const builder = (
        this.options?.createBuilder ? this.options.createBuilder() : createTypedSdkBuilder()
      )
        .withUri(uri)
        .withDatabaseName(databaseName)
        .withAutomaticReconnect();

      if (this.options?.token) {
        builder.withToken(this.options.token);
      }

      builder.onConnect((conn, identity) => {
        this.connected = true;
        this.currentIdentity = identity.toHexString();
        this.setError(null);
        this.notifyConnectionState();
        this.notifyIdentityChange();
        this.bindTableSubscription(conn);
        finishResolve();
      });

      builder.onAutomaticReconnect((conn, identity) => {
        this.connected = true;
        this.currentIdentity = identity.toHexString();
        this.setError(null);
        this.notifyConnectionState();
        this.notifyIdentityChange();
        this.bindTableSubscription(conn);
      });

      builder.onConnectError((_ctx, error) => {
        this.connected = false;
        this.currentIdentity = null;
        this.setError(error.message);
        this.notifyConnectionState();
        this.notifyIdentityChange();
        finishReject(error);
      });

      builder.onDisconnect((_ctx, error) => {
        this.connected = false;
        this.currentIdentity = null;
        if (error) {
          this.setError(error.message);
        }
        this.notifyConnectionState();
        this.notifyIdentityChange();
        finishReject(error ?? new Error("SpacetimeDB disconnected before handshake completed"));
      });

      try {
        this.connection = builder.build();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        this.connected = false;
        this.currentIdentity = null;
        this.setError(error.message);
        this.notifyConnectionState();
        this.notifyIdentityChange();
        finishReject(error);
      }
    });
  }

  disconnect(): void {
    this.abortPendingConnect?.(new Error("SpacetimeDB connection aborted by disconnect"));
    this.unbindTableHandlers?.();
    this.unbindTableHandlers = null;
    if (this.connection) {
      this.connection.disconnect();
      this.connection = null;
    }
    this.connected = false;
    this.currentIdentity = null;
    this.notifyConnectionState();
    this.notifyIdentityChange();
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

  callReducer<K extends SpacetimeReducerName>(
    name: K,
    params: SpacetimeReducerParamsMap[K],
  ): Promise<SpacetimeTransactionResult> {
    return this.reducers[name](params);
  }

  private async executeLiveReducer<K extends SpacetimeReducerName>(
    name: K,
    params: SpacetimeReducerParamsMap[K],
  ): Promise<SpacetimeTransactionResult> {
    const start = performance.now();

    if (!this.connection || !this.connected) {
      const error = "SpacetimeDB live connection is not active";
      this.setError(error);
      return {
        status: "failed",
        executionDurationMs: Math.round((performance.now() - start) * 100) / 100,
        error,
      };
    }

    try {
      await this.connection.reducers[name](params);
      this.setError(null);
      return {
        status: "committed",
        executionDurationMs: Math.round((performance.now() - start) * 100) / 100,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.setError(error);
      return {
        status: "failed",
        executionDurationMs: Math.round((performance.now() - start) * 100) / 100,
        error,
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
