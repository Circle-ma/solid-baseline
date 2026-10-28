/**
 * ConnectRPC Canonical Schema (Single Source of Truth - SSOT)
 *
 * Defines the request/response payload contracts and service specifications.
 * ConnectRPC works over HTTP/1.1 and HTTP/2 with JSON and Protobuf serialization.
 * All client and server RPC types MUST originate from these schemas.
 */

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

export type CheckoutSessionRequest = {
  amount: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
};

export type CheckoutSessionResponse = {
  sessionId: string;
  checkoutUrl: string;
  status: string;
};

// Health Check Schema Definition
export const HealthCheckSchema = {
  service: "system.v1.SystemService",
  method: "CheckHealth",
  response: {
    status: "string",
    version: "string",
    uptimeSeconds: "number",
  },
} as const;

export type HealthCheckResponse = {
  status: "SERVING" | "NOT_SERVING" | "UNKNOWN";
  version: string;
  uptimeSeconds: number;
};
