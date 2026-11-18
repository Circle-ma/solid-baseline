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
  SpacetimeReducerName,
  SpacetimeReducerParamsMap,
  SpacetimeReducersClient,
  SpacetimeTransactionResult,
} from "~/schema/spacetimedb";
import { createShortId, createSpacetimeAdapter, reconcileTableStore } from "./spacetime";

const MAX_EVENT_LOG_RECORDS = 50;
const GENESIS_TIMESTAMP_ISO = "2026-01-01T00:00:00.000Z";

function createLocalSeedRecords(): EventLogRecord[] {
  return [
    {
      id: "rec_001",
      sender: "system",
      action: "INIT_GENESIS",
      payload: "Database schema initialized from SSOT",
      timestamp: GENESIS_TIMESTAMP_ISO,
    },
    {
      id: "rec_002",
      sender: "system",
      action: "STORE_BOUND",
      payload: "Fine-grained Solid 2.0 store attached to schema",
      timestamp: GENESIS_TIMESTAMP_ISO,
    },
  ];
}

const SpacetimeContext = createContext<SpacetimeContextValue | undefined>(undefined);

/**
 * Single-Responsibility SpacetimeDB Provider
 *
 * Manages realtime database connection state, server-assigned or local client identity,
 * subscription streams, error reporting, and fine-grained draft mutations on the `event_log` store.
 */
export const SpacetimeProvider: ParentComponent<SpacetimeProviderProps> = (props) => {
  const initialMode = untrack(() => props.initialMode ?? "local-cache");

  let adapter: SpacetimeClientAdapter = untrack(
    () =>
      props.adapter ?? createSpacetimeAdapter(initialMode === "live" ? "live" : "offline-sandbox"),
  );

  const [connectionMode, setConnectionMode] = createSignal<"live" | "local-cache">(initialMode, {
    name: "spacetime-connection-mode",
  });
  let localClientIdentity = untrack(() =>
    props.adapter ? (props.adapter.identity ?? "usr_local_node_01") : "usr_local_node_01",
  );
  const [clientIdentity, setClientIdentity] = createSignal<string>(
    initialMode === "live" ? (adapter.identity ?? "connecting...") : localClientIdentity,
    {
      name: "spacetime-client-identity",
    },
  );
  const [latencyMs, setLatencyMs] = createSignal<number | null>(null, {
    name: "spacetime-latency",
  });
  const [lastError, setLastError] = createSignal<string | null>(adapter.lastError, {
    name: "spacetime-last-error",
  });
  const [isConnected, setIsConnected] = createSignal(adapter.isConnected, {
    name: "spacetime-connected",
  });

  // Live mode starts empty and awaits the authoritative `onSnapshot`; local-cache starts with deterministic seeds.
  const [records, setRecords] = createStore<EventLogRecord[]>(
    initialMode === "live" ? [] : createLocalSeedRecords(),
  );

  let cleanupListeners: (() => void) | null = null;
  let disposed = false;

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
      if (connected) {
        setLastError(null);
      }
    });

    const unsubIdentity = currentAdapter.onIdentityChange((nextIdentity) => {
      if (nextIdentity) {
        setClientIdentity(nextIdentity);
      } else if (untrack(() => connectionMode()) === "live") {
        setClientIdentity("disconnected");
      }
    });

    const unsubError = currentAdapter.onErrorChange((nextError) => {
      setLastError(nextError);
    });

    cleanupListeners = () => {
      unsubSnapshot();
      unsubInsert();
      unsubUpdate();
      unsubDelete();
      unsubConn();
      unsubIdentity();
      unsubError();
    };
  }

  bindAdapterListeners(adapter);

  onCleanup(() => {
    disposed = true;
    cleanupListeners?.();
    adapter.disconnect();
  });

  // Connect live adapter after hydration settles, or assign & sync client-local sandbox identity
  onSettled(() => {
    if (initialMode === "live") {
      const targetAdapter = adapter;
      void targetAdapter.connect().catch((err) => {
        if (disposed || adapter !== targetAdapter) return;
        setLastError(err instanceof Error ? err.message : String(err));
        setClientIdentity("disconnected");
      });
    } else if (!props.adapter) {
      localClientIdentity = createShortId("usr");
      if (adapter.setIdentity) {
        adapter.setIdentity(localClientIdentity);
      } else {
        setClientIdentity(localClientIdentity);
      }
    }
  });

  async function callReducer<K extends SpacetimeReducerName>(
    name: K,
    params: SpacetimeReducerParamsMap[K],
  ): Promise<SpacetimeTransactionResult> {
    const targetAdapter = adapter;
    try {
      const res = await targetAdapter.callReducer(name, params);
      if (!disposed && adapter === targetAdapter) {
        setLatencyMs(res.executionDurationMs);
        setLastError(res.status === "failed" ? (res.error ?? "Reducer execution failed") : null);
      }
      return res;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!disposed && adapter === targetAdapter) {
        setLatencyMs(null);
        setLastError(message);
      }
      return {
        status: "failed",
        executionDurationMs: 0,
        error: message,
      };
    }
  }

  const reducers: SpacetimeReducersClient = {
    txEvent: (params) => callReducer("txEvent", params),
  };

  function toggleSimulationMode() {
    const nextMode = untrack(() => connectionMode()) === "live" ? "local-cache" : "live";
    setConnectionMode(nextMode);
    setLatencyMs(null);
    setLastError(null);
    const previousAdapter = adapter;
    const nextAdapter = createSpacetimeAdapter(nextMode === "live" ? "live" : "offline-sandbox");
    adapter = nextAdapter;
    previousAdapter.disconnect();
    setIsConnected(nextAdapter.isConnected);
    bindAdapterListeners(nextAdapter);
    if (nextMode === "live") {
      // Clear local-cache seed/simulated rows immediately so live snapshot starts from a clean slate.
      clearRecords();
      setClientIdentity("connecting...");
      void nextAdapter.connect().catch((err) => {
        if (disposed || adapter !== nextAdapter) return;
        setLastError(err instanceof Error ? err.message : String(err));
        setClientIdentity("disconnected");
      });
    } else {
      // Re-initialize a clean local dataset when returning to local-cache mode.
      reconcileTableStore(setRecords, createLocalSeedRecords(), "id");
      if (nextAdapter.setIdentity) {
        nextAdapter.setIdentity(localClientIdentity);
      } else {
        setClientIdentity(nextAdapter.identity ?? localClientIdentity);
      }
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
    lastError,
    records,
    reducers,
    callReducer,
    toggleSimulationMode,
    clearRecords,
  };

  return <SpacetimeContext value={value}>{props.children}</SpacetimeContext>;
};

/**
 * Returns the enclosing SpacetimeDB context if mounted inside `<SpacetimeProvider>`,
 * or `undefined` otherwise (enabling route-level self-provisioning with test-override support).
 */
export function useOptionalSpacetime(): SpacetimeContextValue | undefined {
  return useContext(SpacetimeContext);
}

/**
 * Consumes the SpacetimeDB context. Throws if invoked outside `<SpacetimeProvider>`.
 */
export function useSpacetime(): SpacetimeContextValue {
  const ctx = useContext(SpacetimeContext);
  if (!ctx) {
    throw new Error("useSpacetime() must be called inside a <SpacetimeProvider> boundary.");
  }
  return ctx;
}
