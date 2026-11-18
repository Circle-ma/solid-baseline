import type { Transport } from "@connectrpc/connect";
import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import type { ParentComponent } from "solid-js";
import { createContext, untrack, useContext } from "solid-js";
import type { TransportProviderProps } from "~/schema";

/**
 * ConnectRPC Client Architecture (SSR-Isolated)
 *
 * Eliminates module-level mutable transport singletons so concurrent SSR requests
 * and isolated test suites never share or overwrite transport state.
 * Provide a custom transport (e.g. `createRouterTransport`) via `<TransportProvider>`.
 */

const DEFAULT_API_BASE_URL =
  (typeof process !== "undefined" && process.env?.VITE_API_URL) ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "http://localhost:8080";

/**
 * Creates a fresh ConnectRPC HTTP/Fetch transport instance scoped to a provider or request.
 */
export function createDefaultTransport(baseUrl?: string): Transport {
  return createConnectTransport({
    baseUrl: baseUrl ?? DEFAULT_API_BASE_URL,
  });
}

/**
 * Request/Tree-Scoped ConnectRPC Transport Context.
 * Default-less so missing providers fail loudly rather than leaking global state.
 */
export const TransportContext = createContext<Transport>();

/**
 * SSR-Safe ConnectRPC Transport Provider.
 * Instantiates a fresh default transport per provider mount unless one is injected.
 */
export const TransportProvider: ParentComponent<TransportProviderProps> = (props) => {
  const transport = untrack(() => props.transport ?? createDefaultTransport(props.baseUrl));
  return <TransportContext value={transport}>{props.children}</TransportContext>;
};

/**
 * Reads the active ConnectRPC Transport from the enclosing `<TransportProvider>`.
 */
export function useTransport(): Transport {
  return useContext(TransportContext);
}

/**
 * Instantiates a typed ConnectRPC service client bound to an explicit transport.
 */
export function createServiceClient<T extends Parameters<typeof createClient>[0]>(
  service: T,
  transport: Transport,
) {
  return createClient(service, transport);
}

/**
 * Instantiates a typed ConnectRPC service client bound to the enclosing `<TransportProvider>`.
 */
export function useServiceClient<T extends Parameters<typeof createClient>[0]>(
  service: T,
  transport?: Transport,
) {
  return createClient(service, transport ?? useTransport());
}
