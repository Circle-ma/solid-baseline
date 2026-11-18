import type { Accessor } from "solid-js";
import {
  type Infer,
  type InferTypeOfParams,
  procedures,
  reducerSchema,
  reducers,
  schema,
  t,
  table,
} from "spacetimedb";

/**
 * SpacetimeDB Canonical Schema (Single Source of Truth - SSOT)
 *
 * Defined directly via SpacetimeDB 2.15 SDK `table()` / `schema()` / `reducers()`.
 * Both runtime RemoteModule metadata and TypeScript row/reducer types derive
 * mathematically from this single definition.
 */

export const EventLogTable = table(
  { name: "event_log", public: true },
  {
    id: t.string().primaryKey(),
    sender: t.string(),
    action: t.string(),
    payload: t.string(),
    timestamp: t.string(),
  },
);

export const SpacetimeTablesSchema = schema({
  event_log: EventLogTable,
});

export const TxEventReducer = reducerSchema("tx_event", {
  action: t.string(),
  payload: t.string(),
});

export const SpacetimeReducersSchema = reducers(TxEventReducer);

export const SpacetimeProceduresSchema = procedures();

export const SPACETIME_REMOTE_MODULE = {
  ...SpacetimeTablesSchema.schemaType,
  ...SpacetimeReducersSchema.reducersType,
  ...SpacetimeProceduresSchema,
  versionInfo: { cliVersion: "2.0.0" },
};

// Mathematically inferred directly from SpacetimeDB SDK table & reducer schemas
export type EventLogRecord = Infer<typeof EventLogTable.rowType>;
export type TxReducerParams = InferTypeOfParams<typeof TxEventReducer.params.row>;

/**
 * Strongly-typed map of all SpacetimeDB module reducers.
 * Decouples reducer dispatch from hardcoded string literals.
 */
export interface SpacetimeReducerParamsMap {
  txEvent: TxReducerParams;
}

export type SpacetimeReducerName = keyof SpacetimeReducerParamsMap;

export type SpacetimeReducersClient = {
  [K in SpacetimeReducerName]: (
    params: SpacetimeReducerParamsMap[K],
  ) => Promise<SpacetimeTransactionResult>;
};

export interface SpacetimeIdentityLike {
  toHexString(): string;
}

export interface SpacetimeSubscriptionHandleLike {
  isEnded(): boolean;
  unsubscribe(): void;
}

export interface SpacetimeLiveConnectionLike {
  readonly db: {
    readonly event_log: {
      onInsert(cb: (ctx: unknown, row: EventLogRecord) => void): void;
      onUpdate(cb: (ctx: unknown, oldRow: EventLogRecord, newRow: EventLogRecord) => void): void;
      onDelete(cb: (ctx: unknown, row: EventLogRecord) => void): void;
      removeOnInsert(cb: (ctx: unknown, row: EventLogRecord) => void): void;
      removeOnUpdate(
        cb: (ctx: unknown, oldRow: EventLogRecord, newRow: EventLogRecord) => void,
      ): void;
      removeOnDelete(cb: (ctx: unknown, row: EventLogRecord) => void): void;
      iter(): Iterable<EventLogRecord>;
    };
  };
  readonly reducers: {
    txEvent(params: TxReducerParams): Promise<void>;
  };
  subscriptionBuilder(): {
    onApplied(cb: (ctx: { db: { event_log: { iter(): Iterable<EventLogRecord> } } }) => void): {
      subscribe(queries: string[]): SpacetimeSubscriptionHandleLike;
    };
  };
  disconnect(): void;
}

export interface SpacetimeLiveConnectionBuilderLike {
  withUri(uri: string): this;
  withDatabaseName(name: string): this;
  withAutomaticReconnect(): this;
  withToken(token: string): this;
  onConnect(cb: (conn: SpacetimeLiveConnectionLike, identity: SpacetimeIdentityLike) => void): this;
  onAutomaticReconnect(
    cb: (conn: SpacetimeLiveConnectionLike, identity: SpacetimeIdentityLike) => void,
  ): this;
  onConnectError(cb: (ctx: unknown, error: Error) => void): this;
  onDisconnect(cb: (ctx: unknown, error?: Error | null) => void): this;
  build(): SpacetimeLiveConnectionLike;
}

/**
 * Connection options for SpacetimeDB client connections.
 */
export interface SpacetimeConnectionOptions {
  uri?: string;
  databaseName?: string;
  token?: string;
  /** Optional builder factory override for deterministic unit testing. */
  createBuilder?: () => SpacetimeLiveConnectionBuilderLike;
}

export type SpacetimeEventCallback<T> = (row: T) => void;
export type SpacetimeSnapshotCallback<T> = (rows: T[]) => void;
export type SpacetimeDeleteCallback = (rowId: string) => void;
export type SpacetimeIdentityCallback = (identity: string | null) => void;
export type SpacetimeErrorCallback = (error: string | null) => void;
export type SpacetimeTransactionStatus = "committed" | "failed";

export interface SpacetimeTransactionResult {
  status: SpacetimeTransactionStatus;
  executionDurationMs: number;
  error?: string;
}

export interface SpacetimeClientAdapter {
  readonly mode: "live" | "offline-sandbox";
  readonly isConnected: boolean;
  readonly identity: string | null;
  readonly lastError: string | null;
  readonly reducers: SpacetimeReducersClient;
  setIdentity?(identity: string): void;
  connect(): Promise<void>;
  disconnect(): void;
  onConnectionStateChange(cb: (connected: boolean) => void): () => void;
  onIdentityChange(cb: SpacetimeIdentityCallback): () => void;
  onErrorChange(cb: SpacetimeErrorCallback): () => void;
  onSnapshot(tableName: string, callback: SpacetimeSnapshotCallback<EventLogRecord>): () => void;
  onInsert(tableName: string, callback: SpacetimeEventCallback<EventLogRecord>): () => void;
  onUpdate(tableName: string, callback: SpacetimeEventCallback<EventLogRecord>): () => void;
  onDelete(tableName: string, callback: SpacetimeDeleteCallback): () => void;
  callReducer<K extends SpacetimeReducerName>(
    name: K,
    params: SpacetimeReducerParamsMap[K],
  ): Promise<SpacetimeTransactionResult>;
}

/**
 * Single-Responsibility SpacetimeDB Provider Props
 */
export interface SpacetimeProviderProps {
  /** Optional adapter override for deterministic tests or SSR isolation. */
  adapter?: SpacetimeClientAdapter;
  initialMode?: "live" | "local-cache";
}

/**
 * Single-Responsibility SpacetimeDB Context Contract
 * Manages realtime connection state, identity, fine-grained table store, and typed reducers only.
 */
export interface SpacetimeContextValue {
  isConnected: Accessor<boolean>;
  connectionMode: Accessor<"live" | "local-cache">;
  clientIdentity: Accessor<string>;
  latencyMs: Accessor<number | null>;
  lastError: Accessor<string | null>;
  records: EventLogRecord[];
  reducers: SpacetimeReducersClient;
  callReducer: <K extends SpacetimeReducerName>(
    name: K,
    params: SpacetimeReducerParamsMap[K],
  ) => Promise<SpacetimeTransactionResult>;
  toggleSimulationMode: () => void;
  clearRecords: () => void;
}
