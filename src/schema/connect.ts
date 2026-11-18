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
