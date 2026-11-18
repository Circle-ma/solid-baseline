import { create, type DescService } from "@bufbuild/protobuf";
import type { Client } from "@connectrpc/connect";
import type { ParentComponent } from "solid-js";
import {
  affects,
  createContext,
  createMemo,
  createSignal,
  isPending,
  onCleanup,
  onFlush,
  refresh,
  resolve,
  untrack,
  useContext,
} from "solid-js";
import {
  type HealthCheckQueryResult,
  type HealthCheckRequest,
  HealthCheckRequestSchema,
  type RpcContextValue,
  type RpcProviderProps,
  type RpcQueryHandle,
  type RpcQueryOptions,
  SystemService,
} from "~/schema/connect";
import { createServiceClient, TransportProvider, useTransport } from "./connect";

const RpcContext = createContext<RpcContextValue | undefined>(undefined);

const RpcClientScope: ParentComponent = (props) => {
  const transport = useTransport();
  const clientCache = new WeakMap<DescService, Client<DescService>>();

  function getClient<T extends DescService>(service: T): Client<T> {
    const cached = clientCache.get(service);
    if (cached) {
      return cached as Client<T>;
    }
    const client = createServiceClient(service, transport);
    clientCache.set(service, client as Client<DescService>);
    return client;
  }

  const value: RpcContextValue = {
    transport,
    getClient,
  };

  return <RpcContext value={value}>{props.children}</RpcContext>;
};

/**
 * Extensible Single-Responsibility ConnectRPC Provider
 *
 * Wraps an isolated `<TransportProvider>` and provides a lazy per-service typed
 * client registry. Routes and components instantiate declarative Solid 2.0 async queries
 * on demand via `useRpcClient()` and `createRpcQuery()` instead of binding endpoints
 * eagerly at the application root.
 */
export const RpcProvider: ParentComponent<RpcProviderProps> = (props) => {
  return (
    <TransportProvider transport={props.transport} baseUrl={props.baseUrl}>
      <RpcClientScope>{props.children}</RpcClientScope>
    </TransportProvider>
  );
};

/**
 * Returns the enclosing ConnectRPC context if mounted inside `<RpcProvider>`,
 * or `undefined` otherwise (mirroring `useOptionalSpacetime()`).
 */
export function useOptionalRpc(): RpcContextValue | undefined {
  return useContext(RpcContext);
}

/**
 * Consumes the ConnectRPC context. Throws a descriptive error if invoked outside `<RpcProvider>`.
 */
export function useRpc(): RpcContextValue {
  const ctx = useContext(RpcContext);
  if (!ctx) {
    throw new Error("useRpc() must be called inside an <RpcProvider> boundary.");
  }
  return ctx;
}

/**
 * Returns a memoized, tree-scoped ConnectRPC client for the given Protobuf service.
 */
export function useRpcClient<T extends DescService>(service: T): Client<T> {
  return useRpc().getClient(service);
}

/**
 * Composable Solid 2.0 Declarative Async RPC Query Primitive
 *
 * Uses native `createMemo` returning a Promise + `isPending()` + `affects()` / `refresh()`,
 * coordinates `execute()` through `onFlush()` + `resolve()` without forced synchronous `flush()`,
 * and aborts superseded or unmounted in-flight requests via `AbortController` + `onCleanup()`.
 */
export function createRpcQuery<TParams, TData>(
  options: RpcQueryOptions<TParams, TData>,
): RpcQueryHandle<TParams, TData> {
  const [requestState, setRequestState] = createSignal<{ params: TParams } | null>(
    options.initialParams !== undefined && options.initialParams !== null
      ? { params: options.initialParams }
      : null,
    { name: `${options.name}-params` },
  );

  const query = createMemo<TData | null>(
    () => {
      const state = requestState();
      if (state === null) {
        return null;
      }
      const controller = new AbortController();
      onCleanup(() => {
        controller.abort();
      });
      return options.fetcher(state.params, controller.signal);
    },
    { name: options.name },
  );

  const pending = createMemo(() => isPending(() => query()), {
    name: `${options.name}-pending`,
  });

  const execute = ((...args: [] | [TParams]): Promise<TData | null> => {
    setRequestState({ params: args[0] as TParams });
    return new Promise<TData | null>((resolvePromise, rejectPromise) => {
      onFlush(() => {
        resolve(() => query()).then(resolvePromise, rejectPromise);
      });
    });
  }) as RpcQueryHandle<TParams, TData>["execute"];

  function refreshQuery(): Promise<TData | null> {
    const current = untrack(() => requestState());
    if (current === null) {
      return Promise.resolve(null);
    }
    affects(query);
    return refresh(query);
  }

  return {
    data: query,
    isPending: pending,
    execute,
    refresh: refreshQuery,
  };
}

/**
 * Route/component-scoped declarative `SystemService.CheckHealth` query hook.
 * Propagates `AbortSignal` into ConnectRPC `checkHealth(req, { signal })`.
 */
export function createHealthCheckQuery(
  initialRequest?: Partial<HealthCheckRequest> | null,
): RpcQueryHandle<Partial<HealthCheckRequest>, HealthCheckQueryResult> {
  const systemClient = useRpcClient(SystemService);

  return createRpcQuery<Partial<HealthCheckRequest>, HealthCheckQueryResult>({
    name: "rpc-health-query",
    initialParams: initialRequest ?? null,
    fetcher: async (reqParams, signal) => {
      const start = performance.now();
      const req = create(HealthCheckRequestSchema, reqParams);
      const response = await systemClient.checkHealth(req, { signal });
      const latencyMs = Math.round((performance.now() - start) * 10) / 10;
      return { response, latencyMs };
    },
  });
}
