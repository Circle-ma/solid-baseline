/**
 * SpacetimeDB Canonical Schema (Single Source of Truth - SSOT)
 *
 * Defines the relational schema, column definitions, and reducer parameters.
 * All application layers MUST derive their types from these schemas.
 * Declaring arbitrary, loose TypeScript interfaces for database entities is strictly prohibited.
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
