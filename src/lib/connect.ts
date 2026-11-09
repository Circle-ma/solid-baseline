import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";

/**
 * ConnectRPC Client Architecture
 *
 * ConnectRPC operates over standard HTTP/1.1 and HTTP/2 fetch APIs.
 * Connect clients can be instantiated with transport pointing to a backend microservice
 * or payment gateway.
 */

const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const transport = createConnectTransport({
  baseUrl,
});

/**
 * Helper to instantiate typed service clients from generated service definitions.
 */
export function getServiceClient<T extends Parameters<typeof createClient>[0]>(service: T) {
  return createClient(service, transport);
}
