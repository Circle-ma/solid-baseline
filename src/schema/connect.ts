import type { DescService } from "@bufbuild/protobuf";
import type { Client, Transport } from "@connectrpc/connect";
import type { Accessor } from "solid-js";
import type { HealthCheckResponse } from "../gen/system/v1/system_pb";

/**
 * ConnectRPC Schema (SSOT via Protobuf and buf generate)
 *
 * Generated via Buf from `proto/system/v1/system.proto` into `src/gen/`.
 * Replaces handwritten type inference templates with standardized Protobuf contracts.
 * All client and server RPC types originate from these schemas.
 */

// System Service Contracts
export type {
  HealthCheckRequest,
  HealthCheckResponse,
} from "../gen/system/v1/system_pb";
export {
  HealthCheckRequestSchema,
  HealthCheckResponseSchema,
  HealthCheckStatus,
  HealthCheckStatusSchema,
  SystemService,
} from "../gen/system/v1/system_pb";

/**
 * SSR-Safe ConnectRPC Transport Provider Props
 * Inject a custom transport (e.g. `createRouterTransport`) per request or test
 * without touching module-level mutable state.
 */
export interface TransportProviderProps {
  transport?: Transport;
  baseUrl?: string;
}

/**
 * Declarative HealthCheck Query Result
 */
export interface HealthCheckQueryResult {
  response: HealthCheckResponse;
  latencyMs: number;
}

/**
 * Single-Responsibility RPC Provider Props
 * Service-agnostic root provider supplying an isolated transport and client cache.
 */
export type RpcProviderProps = TransportProviderProps;

/**
 * Extensible RPC Context Contract
 * Supplies the request/tree-scoped Transport and lazy per-service typed client factory
 * so routes and components can create declarative queries on demand.
 */
export interface RpcContextValue {
  readonly transport: Transport;
  getClient<T extends DescService>(service: T): Client<T>;
}

/**
 * Configuration for route/component-scoped declarative Solid 2.0 RPC queries.
 */
export interface RpcQueryOptions<TParams, TData> {
  /** Diagnostic attribution name for `@solidjs/diagnostics`. */
  name: string;
  fetcher: (params: TParams) => Promise<TData>;
  initialParams?: TParams | null;
}

/**
 * Conditional execute signature:
 * - When `undefined extends TParams`, `execute()` may be called without arguments.
 * - Otherwise, `execute(params)` requires an explicit argument (use `refresh()` to re-run with previous params).
 */
export type RpcQueryExecuteFn<TParams, TData> = undefined extends TParams
  ? (params?: TParams) => Promise<TData | null>
  : (params: TParams) => Promise<TData | null>;

/**
 * Return contract for declarative Solid 2.0 RPC queries.
 */
export interface RpcQueryHandle<TParams, TData> {
  data: Accessor<TData | null>;
  isPending: Accessor<boolean>;
  execute: RpcQueryExecuteFn<TParams, TData>;
  refresh: () => Promise<TData | null>;
}
