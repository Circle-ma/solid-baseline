import type { ParentComponent } from "solid-js";
import {
  action,
  createContext,
  createOptimistic,
  createSignal,
  createStore,
  onSettled,
  useContext,
} from "solid-js";
import type {
  EventLogRecord,
  HealthCheckRequest,
  HealthCheckResponse,
  TelemetryContextValue,
  TxReducerParams,
} from "~/schema";

const TelemetryContext = createContext<TelemetryContextValue>();

/**
 * SSR-Safe Unified Telemetry Context Provider
 * Mounts at the root application shell. Uses deterministic hydration seeds
 * and fine-grained Solid 2.0 signals with diagnostic attribution.
 */
export const TelemetryProvider: ParentComponent = (props) => {
  // SpacetimeDB Reactive Signals (with named diagnostics attribution)
  const [isConnected, setIsConnected] = createSignal(false, {
    name: "spacetime-connected",
  });
  const [connectionMode, setConnectionMode] = createSignal<"live" | "local-cache">("local-cache", {
    name: "spacetime-connection-mode",
  });
  const [clientIdentity, setClientIdentity] = createSignal<string>("usr_local_node_01", {
    name: "spacetime-client-identity",
  });
  const [latencyMs, setLatencyMs] = createSignal<number | null>(null, {
    name: "spacetime-latency",
  });

  // Reactive Table Store initialized with deterministic SSR seeds
  const [records, setRecords] = createStore<EventLogRecord[]>([
    {
      id: "rec_001",
      sender: "system",
      action: "INIT_GENESIS",
      payload: "Database schema initialized from SSOT",
      timestamp: "00:00:00",
    },
    {
      id: "rec_002",
      sender: "system",
      action: "STORE_BOUND",
      payload: "Fine-grained Solid 2.0 store attached to schema",
      timestamp: "00:00:00",
    },
  ]);

  // ConnectRPC Optimistic Signal and Action Coordination
  const [isRpcPending, setIsRpcPending] = createOptimistic(false, {
    name: "rpc-pending",
  });
  const [rpcResponse, setRpcResponse] = createSignal<HealthCheckResponse | null>(null, {
    name: "rpc-response",
  });
  const [rpcLatencyMs, setRpcLatencyMs] = createSignal<number | null>(null, {
    name: "rpc-latency",
  });

  // Transition-coordinated action acknowledging hold prior to yield
  const checkSystemHealth = action(function* (_request?: HealthCheckRequest) {
    setIsRpcPending(true);
    const start = performance.now();
    try {
      yield new Promise((resolve) => setTimeout(resolve, 60));
      const result: HealthCheckResponse = {
        status: "SERVING",
        version: "2026.1.0",
        uptimeSeconds: Math.floor(performance.now() / 1000),
      };
      setRpcResponse(result);
      setRpcLatencyMs(Math.round((performance.now() - start) * 10) / 10);
      return result;
    } catch (err) {
      setRpcLatencyMs(Math.round((performance.now() - start) * 10) / 10);
      throw err;
    }
  });

  // Client-only dynamic identity generation after SSR hydration settles
  onSettled(() => {
    setClientIdentity(`usr_${Math.random().toString(36).substring(2, 8)}`);
  });

  function callReducer(params: TxReducerParams) {
    const start = performance.now();
    const newRecord: EventLogRecord = {
      id: `rec_${Math.random().toString(36).substring(2, 8)}`,
      sender: clientIdentity(),
      action: params.action,
      payload: params.payload,
      timestamp: new Date().toLocaleTimeString(),
    };

    setRecords((draft) => {
      draft.unshift(newRecord);
      if (draft.length > 50) draft.pop();
    });

    const duration = Math.round((performance.now() - start) * 100) / 100;
    setLatencyMs(duration);
  }

  function toggleSimulationMode() {
    setIsConnected((prev) => {
      const next = !prev;
      setConnectionMode(next ? "live" : "local-cache");
      return next;
    });
  }

  function clearRecords() {
    setRecords((draft) => {
      draft.length = 0;
    });
  }

  const value: TelemetryContextValue = {
    isConnected,
    connectionMode,
    clientIdentity,
    latencyMs,
    records,
    callReducer,
    toggleSimulationMode,
    clearRecords,
    isRpcPending,
    rpcResponse,
    rpcLatencyMs,
    checkSystemHealth,
  };

  return <TelemetryContext value={value}>{props.children}</TelemetryContext>;
};

/**
 * Hook to consume the unified Telemetry context.
 * Throws in development if invoked outside of TelemetryProvider.
 */
export function useTelemetry(): TelemetryContextValue {
  return useContext(TelemetryContext);
}
