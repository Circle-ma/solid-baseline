import { create, type DescService } from "@bufbuild/protobuf";
import type { Client } from "@connectrpc/connect";
import type { ParentComponent } from "solid-js";
import {
  affects,
  createContext,
  createMemo,
  createSignal,
  flush,
  isPending,
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

const RpcContext = createContext<RpcContextValue>();

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
 * Wraps an SSR-isolated `<TransportProvider>` and provides a lazy per-service typed
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
 * Consumes the ConnectRPC context. Throws if invoked outside `<RpcProvider>`.
 */
export function useRpc(): RpcContextValue {
  return useContext(RpcContext);
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
 * and settles parameter transitions deterministically via `flush()` + `resolve()` with
 * zero `Promise.resolve().then(...)` microtask races.
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
      return options.fetcher(state.params);
    },
    { name: options.name },
  );

  const pending = createMemo(() => isPending(() => query()), {
    name: `${options.name}-pending`,
  });

  const execute = ((...args: [] | [TParams]): Promise<TData | null> => {
    setRequestState({ params: args[0] as TParams });
    flush();
    return resolve(() => query());
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
 */
export function createHealthCheckQuery(
  initialRequest?: Partial<HealthCheckRequest> | null,
): RpcQueryHandle<Partial<HealthCheckRequest>, HealthCheckQueryResult> {
  const systemClient = useRpcClient(SystemService);

  return createRpcQuery<Partial<HealthCheckRequest>, HealthCheckQueryResult>({
    name: "rpc-health-query",
    initialParams: initialRequest ?? null,
    fetcher: async (reqParams) => {
      const start = performance.now();
      const req = create(HealthCheckRequestSchema, reqParams);
      const response = await systemClient.checkHealth(req);
      const latencyMs = Math.round((performance.now() - start) * 10) / 10;
      return { response, latencyMs };
    },
  });
}
