import type { Accessor } from "solid-js";
import type { HealthCheckRequest, HealthCheckResponse } from "./connect";
import type { EventLogRecord, TxReducerParams } from "./spacetimedb";

/**
 * Telemetry Context Contract
 * Formal interface for SSR-safe unified state across SpacetimeDB and ConnectRPC.
 */
export interface TelemetryContextValue {
  // SpacetimeDB State & Actions
  isConnected: Accessor<boolean>;
  connectionMode: Accessor<"live" | "local-cache">;
  clientIdentity: Accessor<string>;
  latencyMs: Accessor<number | null>;
  records: EventLogRecord[];
  callReducer: (params: TxReducerParams) => void;
  toggleSimulationMode: () => void;
  clearRecords: () => void;

  // ConnectRPC State & Actions
  isRpcPending: Accessor<boolean>;
  rpcResponse: Accessor<HealthCheckResponse | null>;
  rpcLatencyMs: Accessor<number | null>;
  checkSystemHealth: (request?: HealthCheckRequest) => Promise<HealthCheckResponse>;
}
