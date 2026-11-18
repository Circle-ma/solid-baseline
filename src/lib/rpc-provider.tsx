import { create } from "@bufbuild/protobuf";
import type { ParentComponent } from "solid-js";
import {
  affects,
  createContext,
  createMemo,
  createSignal,
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
  SystemService,
} from "~/schema";
import { createServiceClient, TransportProvider, useTransport } from "./connect";

const RpcContext = createContext<RpcContextValue>();

const RpcQueryScope: ParentComponent<Pick<RpcProviderProps, "initialHealthRequest">> = (props) => {
  const transport = useTransport();
  const systemClient = createServiceClient(SystemService, transport);

  const [healthRequest, setHealthRequest] = createSignal<Partial<HealthCheckRequest> | null>(
    untrack(() => props.initialHealthRequest ?? null),
    { name: "rpc-health-request" },
  );

  const fetchHealth = async (
    reqParams: Partial<HealthCheckRequest>,
  ): Promise<HealthCheckQueryResult> => {
    const start = performance.now();
    const req = create(HealthCheckRequestSchema, reqParams);
    const response = await systemClient.checkHealth(req);
    const latencyMs = Math.round((performance.now() - start) * 10) / 10;
    return { response, latencyMs };
  };

  // Solid 2.0 native declarative async memo — pending state is read via `isPending(() => healthQuery())`
  // and errors/loading are handled declaratively by `<AsyncBoundary>`.
  const healthQuery = createMemo<HealthCheckQueryResult | null>(
    () => {
      const reqParams = healthRequest();
      if (reqParams === null) {
        return null;
      }
      return fetchHealth(reqParams);
    },
    { name: "rpc-health-query" },
  );

  function refreshHealth(
    request?: Partial<HealthCheckRequest>,
  ): Promise<HealthCheckQueryResult | null> {
    const current = untrack(() => healthRequest());
    if (current === null || request !== undefined) {
      setHealthRequest(request ?? {});
      return Promise.resolve().then(() => resolve(() => healthQuery()));
    }
    affects(healthQuery);
    return refresh(healthQuery);
  }

  const value: RpcContextValue = {
    healthQuery,
    refreshHealth,
  };

  return <RpcContext value={value}>{props.children}</RpcContext>;
};

/**
 * Single-Responsibility ConnectRPC Provider
 *
 * Wraps an SSR-isolated `<TransportProvider>` and exposes declarative Solid 2.0
 * async queries without imperative pending/response/latency state machines or
 * `createOptimistic(false)` loading workarounds.
 */
export const RpcProvider: ParentComponent<RpcProviderProps> = (props) => {
  return (
    <TransportProvider transport={props.transport} baseUrl={props.baseUrl}>
      <RpcQueryScope initialHealthRequest={props.initialHealthRequest}>
        {props.children}
      </RpcQueryScope>
    </TransportProvider>
  );
};

/**
 * Consumes the ConnectRPC query context. Throws if invoked outside `<RpcProvider>`.
 */
export function useRpc(): RpcContextValue {
  return useContext(RpcContext);
}
