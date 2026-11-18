import type { Transport } from "@connectrpc/connect";
import type { Accessor } from "solid-js";
import type { HealthCheckRequest, HealthCheckResponse } from "../gen/system/v1/system_pb";

/**
 * ConnectRPC Schema (SSOT via Protobuf and buf generate)
 *
 * Generated via Buf from `proto/system/v1/system.proto` and `proto/payment/v1/payment.proto`
 * into `src/gen/`.
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
 * Health check status string representations for consumer ergonomics.
 */
export const HEALTH_CHECK_STATUSES = ["SERVING", "NOT_SERVING", "UNKNOWN", "UNSPECIFIED"] as const;

export type HealthCheckStatusString = (typeof HEALTH_CHECK_STATUSES)[number];

// Payment Service Contracts
export type {
  CheckoutSessionRequest,
  CheckoutSessionResponse,
} from "../gen/payment/v1/payment_pb";
export {
  CheckoutSessionRequestSchema,
  CheckoutSessionResponseSchema,
  PaymentService,
} from "../gen/payment/v1/payment_pb";

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
 */
export interface RpcProviderProps extends TransportProviderProps {
  /** Optional initial request to trigger an eager declarative query on mount. */
  initialHealthRequest?: Partial<HealthCheckRequest>;
}

/**
 * Single-Responsibility RPC Context Contract
 * Exposes declarative Solid 2.0 async `createMemo` queries and refresh triggers.
 * Pending and error states are observed natively via `isPending()` and `<AsyncBoundary>`.
 */
export interface RpcContextValue {
  healthQuery: Accessor<HealthCheckQueryResult | null>;
  refreshHealth: (request?: Partial<HealthCheckRequest>) => Promise<HealthCheckQueryResult | null>;
}
