import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";

/**
 * ConnectRPC Client Setup
 *
 * ConnectRPC works over HTTP/1.1 and HTTP/2 using standard web fetch.
 * When integrating with third parties (e.g. Stripe checkout / payments),
 * calls should route through your backend Connect handler to protect API secrets.
 */

export const transport = createConnectTransport({
  baseUrl: import.meta.env.VITE_API_URL || "http://localhost:8080",
});

/**
 * Helper to instantiate typed service clients
 * Example usage:
 *   import { PaymentService } from "~/gen/payment/v1/payment_pb"
 *   export const paymentClient = getServiceClient(PaymentService)
 */
export function getServiceClient<T extends Parameters<typeof createClient>[0]>(service: T) {
  return createClient(service, transport);
}
