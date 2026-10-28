/**
 * SpacetimeDB Canonical Schema (Single Source of Truth - SSOT)
 *
 * Defines the relational schema, column definitions, and reducer parameters.
 * All application layers MUST derive their types from these schemas.
 * Declaring arbitrary, loose TypeScript interfaces for database entities is strictly prohibited.
 */

// Column type definitions
export type ColumnType = "string" | "number" | "boolean" | "timestamp";

// Schema definition for event_log table
export const EventLogTableSchema = {
  name: "event_log",
  primaryKey: "id",
  columns: {
    id: { type: "string" as ColumnType, description: "Unique record identifier" },
    sender: { type: "string" as ColumnType, description: "Identity of client/user" },
    action: { type: "string" as ColumnType, description: "Reducer action name" },
    payload: { type: "string" as ColumnType, description: "Serialized event payload" },
    timestamp: { type: "string" as ColumnType, description: "Client/Server timestamp" },
  },
} as const;

// Inferred Table Row Record Type from Schema
export type EventLogRecord = {
  [K in keyof typeof EventLogTableSchema.columns]: string;
};

// Schema definition for Reducer Calls (Transactions)
export const TxReducerSchema = {
  name: "tx_event",
  parameters: {
    action: { type: "string" as ColumnType, required: true },
    payload: { type: "string" as ColumnType, required: true },
  },
} as const;

// Inferred Reducer Parameters Type from Schema
export type TxReducerParams = {
  action: string;
  payload: string;
};
