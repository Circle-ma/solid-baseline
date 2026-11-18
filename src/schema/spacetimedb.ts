import type { Accessor } from "solid-js";

/**
 * SpacetimeDB Canonical Schema (Single Source of Truth - SSOT)
 *
 * Defines the relational schema, column definitions, reducer parameters,
 * adapter interface, and reactive provider contract.
 * All application layers MUST derive their types from these schemas.
 */

// Column type definitions mapping schema identifiers to runtime primitive types
export interface ColumnTypeMap {
  string: string;
  number: number;
  boolean: boolean;
  timestamp: string;
}

export type ColumnType = keyof ColumnTypeMap;

// Schema definition for event_log table
export const EventLogTableSchema = {
  name: "event_log",
  primaryKey: "id",
  columns: {
    id: { type: "string", description: "Unique record identifier" },
    sender: { type: "string", description: "Identity of client/user" },
    action: { type: "string", description: "Reducer action name" },
    payload: { type: "string", description: "Serialized event payload" },
    timestamp: { type: "string", description: "Client/Server timestamp" },
  },
} as const;

// Utility type to infer strongly-typed table rows directly from table schemas
export type InferTableRow<T extends { columns: Record<string, { type: ColumnType }> }> = {
  [K in keyof T["columns"]]: ColumnTypeMap[T["columns"][K]["type"]];
};

// Inferred Table Row Record Type from Schema (100% mathematically derived)
export type EventLogRecord = InferTableRow<typeof EventLogTableSchema>;

// Schema definition for Reducer Calls (Transactions)
export const TxReducerSchema = {
  name: "tx_event",
  parameters: {
    action: { type: "string", required: true },
    payload: { type: "string", required: true },
  },
} as const;

// Utility type to infer reducer parameter types directly from reducer schemas
export type InferReducerParams<T extends { parameters: Record<string, { type: ColumnType }> }> = {
  [K in keyof T["parameters"]]: ColumnTypeMap[T["parameters"][K]["type"]];
};

// Inferred Reducer Parameters Type from Schema (100% mathematically derived)
export type TxReducerParams = InferReducerParams<typeof TxReducerSchema>;

/**
 * Connection options for SpacetimeDB client connections.
 */
export interface SpacetimeConnectionOptions {
  uri?: string;
  databaseName?: string;
  token?: string;
}

export type SpacetimeEventCallback<T> = (row: T) => void;
export type SpacetimeSnapshotCallback<T> = (rows: T[]) => void;
export type SpacetimeDeleteCallback = (rowId: string) => void;
export type SpacetimeTransactionStatus = "committed" | "failed";

export interface SpacetimeTransactionResult {
  status: SpacetimeTransactionStatus;
  txHash: string;
  executionDurationMs: number;
}

export interface SpacetimeClientAdapter {
  readonly mode: "live" | "offline-sandbox";
  readonly isConnected: boolean;
  connect(): Promise<void>;
  disconnect(): void;
  onConnectionStateChange(cb: (connected: boolean) => void): () => void;
  onSnapshot(tableName: string, callback: SpacetimeSnapshotCallback<EventLogRecord>): () => void;
  onInsert(tableName: string, callback: SpacetimeEventCallback<EventLogRecord>): () => void;
  onUpdate(tableName: string, callback: SpacetimeEventCallback<EventLogRecord>): () => void;
  onDelete(tableName: string, callback: SpacetimeDeleteCallback): () => void;
  callReducer(params: TxReducerParams): Promise<SpacetimeTransactionResult>;
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
 * Manages realtime connection state, identity, fine-grained table store, and reducers only.
 */
export interface SpacetimeContextValue {
  isConnected: Accessor<boolean>;
  connectionMode: Accessor<"live" | "local-cache">;
  clientIdentity: Accessor<string>;
  latencyMs: Accessor<number | null>;
  records: EventLogRecord[];
  callReducer: (params: TxReducerParams) => Promise<SpacetimeTransactionResult | null>;
  toggleSimulationMode: () => void;
  clearRecords: () => void;
}
