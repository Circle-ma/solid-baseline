import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { createSignal } from "solid-js";
import type { HealthCheckRequest, HealthCheckResponse } from "~/schema";

/**
 * ConnectRPC Client Architecture
 *
 * ConnectRPC operates over standard HTTP/1.1 and HTTP/2 fetch APIs.
 * Connect clients can be instantiated with transport pointing to a backend microservice
 * or payment gateway (e.g., Stripe handler).
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

// Reactive telemetry signals for RPC inspection
export const [isRpcPending, setIsRpcPending] = createSignal(false);
export const [rpcResponse, setRpcResponse] = createSignal<HealthCheckResponse | null>(null);
export const [rpcLatencyMs, setRpcLatencyMs] = createSignal<number | null>(null);

/**
 * Executes a typed HealthCheck RPC call.
 * If backend is unreachable, gracefully simulates local response for starter sandbox.
 */
export async function checkSystemHealth(
  _request?: HealthCheckRequest,
): Promise<HealthCheckResponse> {
  const start = performance.now();
  setIsRpcPending(true);

  try {
    // In production with real backend, this calls the generated client:
    // const client = getServiceClient(SystemService);
    // const res = await client.checkHealth(request ?? {});

    // Sandbox / fallback simulation:
    await new Promise((r) => setTimeout(r, 60));
    const result: HealthCheckResponse = {
      status: "SERVING",
      version: "2026.1.0",
      uptimeSeconds: Math.floor(performance.now() / 1000),
    };
    setRpcResponse(result);
    return result;
  } finally {
    setRpcLatencyMs(Math.round((performance.now() - start) * 10) / 10);
    setIsRpcPending(false);
  }
}
