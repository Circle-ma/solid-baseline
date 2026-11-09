/**
 * ConnectRPC Canonical Schema (Single Source of Truth - SSOT)
 *
 * Defines the request/response payload contracts and service specifications.
 * ConnectRPC works over HTTP/1.1 and HTTP/2 with JSON and Protobuf serialization.
 * All client and server RPC types MUST originate from these schemas.
 */

export interface SchemaPrimitiveMap {
  string: string;
  number: number;
  boolean: boolean;
}

export const HEALTH_CHECK_STATUSES = ["SERVING", "NOT_SERVING", "UNKNOWN"] as const;
export type HealthCheckStatus = (typeof HEALTH_CHECK_STATUSES)[number];

// Checkout Session Schema Definition
export const CheckoutSessionSchema = {
  service: "payment.v1.PaymentService",
  method: "CreateCheckoutSession",
  request: {
    amount: "number",
    currency: "string",
    successUrl: "string",
    cancelUrl: "string",
  },
  response: {
    sessionId: "string",
    checkoutUrl: "string",
    status: "string",
  },
} as const;

// Health Check Schema Definition
export const HealthCheckSchema = {
  service: "system.v1.SystemService",
  method: "CheckHealth",
  request: {
    service: { type: "string", optional: true },
  },
  response: {
    status: { type: "enum", values: HEALTH_CHECK_STATUSES },
    version: { type: "string", optional: false },
    uptimeSeconds: { type: "number", optional: false },
  },
} as const;

// Universal Schema Inference Engine
type InferSchemaField<T> = T extends keyof SchemaPrimitiveMap
  ? SchemaPrimitiveMap[T]
  : T extends { type: "enum"; values: readonly (infer V)[] }
    ? V
    : T extends { type: keyof SchemaPrimitiveMap; optional: true }
      ? SchemaPrimitiveMap[T["type"]] | undefined
      : T extends { type: keyof SchemaPrimitiveMap; optional: false }
        ? SchemaPrimitiveMap[T["type"]]
        : T extends { type: keyof SchemaPrimitiveMap }
          ? SchemaPrimitiveMap[T["type"]]
          : never;

export type InferSchemaMessage<T extends Record<string, unknown>> = {
  [K in keyof T as T[K] extends { optional: true } ? never : K]: InferSchemaField<T[K]>;
} & {
  [K in keyof T as T[K] extends { optional: true } ? K : never]?: InferSchemaField<T[K]>;
};

// Inferred ConnectRPC Request & Response Types directly derived from Schemas
export type CheckoutSessionRequest = InferSchemaMessage<typeof CheckoutSessionSchema.request>;
export type CheckoutSessionResponse = InferSchemaMessage<typeof CheckoutSessionSchema.response>;

export type HealthCheckRequest = InferSchemaMessage<typeof HealthCheckSchema.request>;
export type HealthCheckResponse = InferSchemaMessage<typeof HealthCheckSchema.response>;
