import { create } from "@bufbuild/protobuf";
import type { ParentComponent } from "solid-js";
import {
  action,
  createContext,
  createOptimistic,
  createSignal,
  createStore,
  onCleanup,
  onSettled,
  untrack,
  useContext,
} from "solid-js";
import {
  type EventLogRecord,
  type HealthCheckRequest,
  HealthCheckRequestSchema,
  type HealthCheckResponse,
  type SpacetimeClientAdapter,
  SystemService,
  type TelemetryContextValue,
  type TxReducerParams,
} from "~/schema";
import { getServiceClient } from "./connect";
import { createSpacetimeAdapter, reconcileTableStore } from "./spacetime";

const TelemetryContext = createContext<TelemetryContextValue>();

/**
 * SSR-Safe Unified Telemetry Context Provider
 * Mounts at the root application shell. Uses deterministic hydration seeds
 * and fine-grained Solid 2.0 signals with diagnostic attribution.
 */
export const TelemetryProvider: ParentComponent = (props) => {
  // SpacetimeDB Reactive Signals (with named diagnostics attribution)
  const [connectionMode, setConnectionMode] = createSignal<"live" | "local-cache">("local-cache", {
    name: "spacetime-connection-mode",
  });
  const [clientIdentity, setClientIdentity] = createSignal<string>("usr_local_node_01", {
    name: "spacetime-client-identity",
  });
  const [latencyMs, setLatencyMs] = createSignal<number | null>(null, {
    name: "spacetime-latency",
  });

  // Dual-mode SpacetimeDB adapter
  let adapter: SpacetimeClientAdapter = createSpacetimeAdapter(
    untrack(() => connectionMode()) === "live" ? "live" : "offline-sandbox",
  );

  const [isConnected, setIsConnected] = createSignal(adapter.isConnected, {
    name: "spacetime-connected",
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

  let cleanupListeners: (() => void) | null = null;

  function bindAdapterListeners(currentAdapter: SpacetimeClientAdapter) {
    cleanupListeners?.();

    const unsubInsert = currentAdapter.onInsert("event_log", (newRecord) => {
      const current = untrack(() => records);
      const updated = [newRecord, ...current.slice(0, 49)];
      reconcileTableStore(setRecords, updated, "id");
    });

    const unsubConn = currentAdapter.onConnectionStateChange((connected) => {
      setIsConnected(connected);
    });

    cleanupListeners = () => {
      unsubInsert();
      unsubConn();
    };
  }

  // Subscribe to adapter events to update store via unidirectional data flow
  bindAdapterListeners(adapter);

  onCleanup(() => {
    cleanupListeners?.();
    adapter.disconnect();
  });

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

  // Transition-coordinated action making real ConnectRPC network call
  const checkSystemHealth = action(function* (request?: Partial<HealthCheckRequest>) {
    setIsRpcPending(true);
    const start = performance.now();
    try {
      const client = getServiceClient(SystemService);
      const req = create(HealthCheckRequestSchema, request ?? {});
      const result: HealthCheckResponse = yield client.checkHealth(req);
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
    adapter
      .callReducer(params)
      .then((res) => {
        setLatencyMs(res.executionDurationMs);
      })
      .catch(() => {
        setLatencyMs(null);
      });
  }

  function toggleSimulationMode() {
    const nextMode = connectionMode() === "live" ? "local-cache" : "live";
    setConnectionMode(nextMode);
    adapter.disconnect();
    adapter = createSpacetimeAdapter(nextMode === "live" ? "live" : "offline-sandbox");
    setIsConnected(adapter.isConnected);
    bindAdapterListeners(adapter);
    if (nextMode === "live") {
      adapter.connect();
    }
  }

  function clearRecords() {
    reconcileTableStore(setRecords, [], "id");
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
