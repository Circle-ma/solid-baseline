import type { Transport } from "@connectrpc/connect";
import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";

/**
 * ConnectRPC Client Architecture
 *
 * ConnectRPC operates over standard HTTP/1.1 and HTTP/2 fetch APIs.
 * Connect clients can be instantiated with transport pointing to a backend microservice,
 * with support for custom transport injection (e.g. in-memory router transport for tests).
 */

const defaultBaseUrl =
  (typeof process !== "undefined" && process.env?.VITE_API_URL) ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "http://localhost:8080";

let activeTransport: Transport = createConnectTransport({
  baseUrl: defaultBaseUrl,
});

export function setGlobalTransport(transport: Transport) {
  activeTransport = transport;
}

export function getGlobalTransport(): Transport {
  return activeTransport;
}

/**
 * Helper to instantiate typed service clients from generated service definitions.
 */
export function getServiceClient<T extends Parameters<typeof createClient>[0]>(
  service: T,
  transport?: Transport,
) {
  return createClient(service, transport ?? activeTransport);
}
