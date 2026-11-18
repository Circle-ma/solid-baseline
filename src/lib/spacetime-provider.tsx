import type { ParentComponent } from "solid-js";
import {
  createContext,
  createSignal,
  createStore,
  onCleanup,
  onSettled,
  untrack,
  useContext,
} from "solid-js";
import type {
  EventLogRecord,
  SpacetimeClientAdapter,
  SpacetimeContextValue,
  SpacetimeProviderProps,
  SpacetimeTransactionResult,
  TxReducerParams,
} from "~/schema";
import { createSpacetimeAdapter, reconcileTableStore } from "./spacetime";

const MAX_EVENT_LOG_RECORDS = 50;

const SpacetimeContext = createContext<SpacetimeContextValue>();

/**
 * Single-Responsibility SpacetimeDB Provider
 *
 * Manages realtime database connection state, deterministic client identity,
 * subscription streams, and fine-grained draft mutations on the `event_log` store.
 */
export const SpacetimeProvider: ParentComponent<SpacetimeProviderProps> = (props) => {
  const initialMode = untrack(() => props.initialMode ?? "local-cache");

  const [connectionMode, setConnectionMode] = createSignal<"live" | "local-cache">(initialMode, {
    name: "spacetime-connection-mode",
  });
  const [clientIdentity, setClientIdentity] = createSignal<string>("usr_local_node_01", {
    name: "spacetime-client-identity",
  });
  const [latencyMs, setLatencyMs] = createSignal<number | null>(null, {
    name: "spacetime-latency",
  });

  let adapter: SpacetimeClientAdapter = untrack(
    () =>
      props.adapter ?? createSpacetimeAdapter(initialMode === "live" ? "live" : "offline-sandbox"),
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

    const unsubSnapshot = currentAdapter.onSnapshot("event_log", (initialRows) => {
      reconcileTableStore(setRecords, initialRows.slice(0, MAX_EVENT_LOG_RECORDS), "id");
    });

    // Fine-grained Solid 2.0 Draft mutation: avoids full-array spread copying and reconcile
    const unsubInsert = currentAdapter.onInsert("event_log", (newRecord) => {
      setRecords((draft) => {
        draft.unshift(newRecord);
        if (draft.length > MAX_EVENT_LOG_RECORDS) {
          draft.pop();
        }
      });
    });

    const unsubUpdate = currentAdapter.onUpdate("event_log", (updatedRecord) => {
      setRecords((draft) => {
        const index = draft.findIndex((item) => item.id === updatedRecord.id);
        if (index !== -1) {
          draft[index] = updatedRecord;
        }
      });
    });

    const unsubDelete = currentAdapter.onDelete("event_log", (deletedId) => {
      setRecords((draft) => {
        const index = draft.findIndex((item) => item.id === deletedId);
        if (index !== -1) {
          draft.splice(index, 1);
        }
      });
    });

    const unsubConn = currentAdapter.onConnectionStateChange((connected) => {
      setIsConnected(connected);
    });

    cleanupListeners = () => {
      unsubSnapshot();
      unsubInsert();
      unsubUpdate();
      unsubDelete();
      unsubConn();
    };
  }

  bindAdapterListeners(adapter);

  onCleanup(() => {
    cleanupListeners?.();
    adapter.disconnect();
  });

  // Client-only dynamic identity generation after hydration settles
  onSettled(() => {
    setClientIdentity(`usr_${Math.random().toString(36).substring(2, 8)}`);
  });

  async function callReducer(params: TxReducerParams): Promise<SpacetimeTransactionResult | null> {
    try {
      const res = await adapter.callReducer(params);
      setLatencyMs(res.executionDurationMs);
      return res;
    } catch {
      setLatencyMs(null);
      return null;
    }
  }

  function toggleSimulationMode() {
    const nextMode = untrack(() => connectionMode()) === "live" ? "local-cache" : "live";
    setConnectionMode(nextMode);
    adapter.disconnect();
    adapter = createSpacetimeAdapter(nextMode === "live" ? "live" : "offline-sandbox");
    setIsConnected(adapter.isConnected);
    bindAdapterListeners(adapter);
    if (nextMode === "live") {
      void adapter.connect();
    }
  }

  function clearRecords() {
    setRecords((draft) => {
      draft.length = 0;
    });
  }

  const value: SpacetimeContextValue = {
    isConnected,
    connectionMode,
    clientIdentity,
    latencyMs,
    records,
    callReducer,
    toggleSimulationMode,
    clearRecords,
  };

  return <SpacetimeContext value={value}>{props.children}</SpacetimeContext>;
};

/**
 * Consumes the SpacetimeDB context. Throws if invoked outside `<SpacetimeProvider>`.
 */
export function useSpacetime(): SpacetimeContextValue {
  return useContext(SpacetimeContext);
}
