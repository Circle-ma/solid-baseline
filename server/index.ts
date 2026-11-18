import { Code, ConnectError, createConnectRouter } from "@connectrpc/connect";
import { createFetchHandler } from "@connectrpc/connect/protocol";
import { HealthCheckStatus, SystemService } from "../src/schema/connect";

const SERVER_VERSION = "1.0.0";
const KNOWN_HEALTH_SERVICES = new Set(["", "system", "system.v1.SystemService"]);
const SERVICE_NAME_PATTERN = /^[a-zA-Z0-9._-]+$/;
const MAX_SERVICE_NAME_LENGTH = 128;
const DEFAULT_MAX_BODY_BYTES = 1_048_576; // 1 MiB
const DEFAULT_SHUTDOWN_TIMEOUT_MS = 5_000;

export interface RequestLogEntry {
  ts: string;
  level: "info" | "warn" | "error";
  event:
    | "http.request"
    | "server.start"
    | "server.shutdown.start"
    | "server.shutdown.timeout"
    | "server.shutdown.complete";
  method?: string;
  path?: string;
  status?: number;
  durationMs?: number;
  port?: number;
  signal?: string;
}

export type StructuredLogger = (entry: RequestLogEntry) => void;

export interface RpcHandlerOptions {
  corsOrigin?: string;
  /** Structured request logger; pass `false` to disable logging. */
  logger?: StructuredLogger | false;
  /** Maximum accepted request payload size in bytes (defaults to 1 MiB). */
  maxBodyBytes?: number;
  /** Readiness predicate for `GET /readyz` (defaults to always ready). */
  isReady?: () => boolean;
}

export interface StoppableServer {
  stop(closeActiveConnections?: boolean): Promise<void> | void;
}

export interface GracefulShutdownOptions {
  signal: string;
  timeoutMs?: number;
  logger?: StructuredLogger | false;
}

export function defaultStructuredLogger(entry: RequestLogEntry): void {
  console.log(JSON.stringify(entry));
}

function buildCorsHeaders(corsOrigin: string | undefined): Record<string, string> {
  if (!corsOrigin) {
    return {};
  }
  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Connect-Protocol-Version, Connect-Timeout-Ms, X-User-Agent, X-Grpc-Web",
    "Access-Control-Max-Age": "86400",
  };
  if (corsOrigin !== "*") {
    headers.Vary = "Origin";
  }
  return headers;
}

function validateHealthService(service: string | undefined): HealthCheckStatus {
  if (service === undefined || service === "") {
    return HealthCheckStatus.SERVING;
  }
  if (service.length > MAX_SERVICE_NAME_LENGTH || !SERVICE_NAME_PATTERN.test(service)) {
    throw new ConnectError(
      "Invalid health check service identifier: expected alphanumeric, '.', '_', or '-' (max 128 chars).",
      Code.InvalidArgument,
    );
  }
  if (!KNOWN_HEALTH_SERVICES.has(service)) {
    return HealthCheckStatus.UNKNOWN;
  }
  return HealthCheckStatus.SERVING;
}

/**
 * Reads a request body up to `maxBytes`, aborting early if the streamed payload
 * exceeds the configured bound (protects against missing or spoofed `Content-Length`).
 */
async function readBoundedRequest(req: Request, maxBytes: number): Promise<Request | null> {
  const contentLengthHeader = req.headers.get("content-length");
  if (contentLengthHeader !== null) {
    const parsedLength = Number(contentLengthHeader);
    if (Number.isFinite(parsedLength) && parsedLength > maxBytes) {
      return null;
    }
  }

  if (!req.body) {
    return req;
  }

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const combined = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new Request(req.url, {
    method: req.method,
    headers: req.headers,
    body: combined,
  });
}

/**
 * Two-stage graceful server shutdown:
 * 1. Calls `server.stop(false)` to stop accepting new connections and drain in-flight requests.
 * 2. If draining exceeds `timeoutMs`, escalates to `server.stop(true)` to force-close sockets.
 */
export async function gracefulShutdown(
  server: StoppableServer,
  options: GracefulShutdownOptions,
): Promise<{ forced: boolean }> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_SHUTDOWN_TIMEOUT_MS;
  const logger = options.logger === false ? null : (options.logger ?? defaultStructuredLogger);

  logger?.({
    ts: new Date().toISOString(),
    level: "info",
    event: "server.shutdown.start",
    signal: options.signal,
  });

  let timer: ReturnType<typeof setTimeout> | null = null;
  let forced = false;

  const drainPromise = Promise.resolve(server.stop(false)).then(() => "drained" as const);
  const timeoutPromise = new Promise<"timeout">((resolveTimeout) => {
    timer = setTimeout(() => resolveTimeout("timeout"), timeoutMs);
  });

  const outcome = await Promise.race([drainPromise, timeoutPromise]);
  if (timer !== null) {
    clearTimeout(timer);
  }

  if (outcome === "timeout") {
    forced = true;
    logger?.({
      ts: new Date().toISOString(),
      level: "warn",
      event: "server.shutdown.timeout",
      signal: options.signal,
    });
    await server.stop(true);
  }

  logger?.({
    ts: new Date().toISOString(),
    level: "info",
    event: "server.shutdown.complete",
    signal: options.signal,
  });

  return { forced };
}

/**
 * Pure, side-effect-free ConnectRPC and health/readiness endpoint request handler factory.
 * Safe to import in unit tests and embedded runtimes without binding ports or process signals.
 */
export function createRpcHandler(
  options?: RpcHandlerOptions,
): (req: Request) => Promise<Response> | Response {
  const router = createConnectRouter();

  router.service(SystemService, {
    async checkHealth(req) {
      const status = validateHealthService(req.service);
      return {
        status,
        version: SERVER_VERSION,
        uptimeSeconds: process.uptime(),
      };
    },
  });

  const handlerMap = new Map<string, (req: Request) => Promise<Response>>();
  for (const handler of router.handlers) {
    handlerMap.set(handler.requestPath, createFetchHandler(handler));
  }

  const corsOrigin = options?.corsOrigin ?? process.env.CORS_ORIGIN;
  const corsHeaders = buildCorsHeaders(corsOrigin);
  const logger = options?.logger === false ? null : (options?.logger ?? defaultStructuredLogger);
  const maxBodyBytes = options?.maxBodyBytes ?? DEFAULT_MAX_BODY_BYTES;
  const isReady = options?.isReady ?? (() => true);

  function logResponse(method: string, path: string, status: number, startMs: number): void {
    if (!logger) return;
    const durationMs = Math.round((performance.now() - startMs) * 100) / 100;
    const level: RequestLogEntry["level"] =
      status >= 500 ? "error" : status >= 400 ? "warn" : "info";
    logger({
      ts: new Date().toISOString(),
      level,
      event: "http.request",
      method,
      path,
      status,
      durationMs,
    });
  }

  function withCors(res: Response): Response {
    if (!corsOrigin) {
      return res;
    }
    const headers = new Headers(res.headers);
    for (const [k, v] of Object.entries(corsHeaders)) {
      headers.set(k, v);
    }
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  }

  return function handleRequest(req: Request): Promise<Response> | Response {
    const startMs = performance.now();
    const url = new URL(req.url);

    if (req.method === "OPTIONS") {
      const res = new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
      logResponse(req.method, url.pathname, res.status, startMs);
      return res;
    }

    if (url.pathname === "/healthz" && req.method === "GET") {
      const res = new Response(JSON.stringify({ status: "ok", uptime: process.uptime() }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
      logResponse(req.method, url.pathname, res.status, startMs);
      return res;
    }

    if (url.pathname === "/readyz" && req.method === "GET") {
      const ready = isReady();
      const res = new Response(
        JSON.stringify(
          ready ? { status: "ready", uptime: process.uptime() } : { status: "draining" },
        ),
        {
          status: ready ? 200 : 503,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
      logResponse(req.method, url.pathname, res.status, startMs);
      return res;
    }

    const fetchHandler = handlerMap.get(url.pathname);
    if (fetchHandler) {
      return readBoundedRequest(req, maxBodyBytes).then((boundedReq) => {
        if (boundedReq === null) {
          const res = new Response(
            JSON.stringify({
              code: "resource_exhausted",
              message: `Request payload exceeds maximum allowed size of ${maxBodyBytes} bytes.`,
            }),
            {
              status: 413,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            },
          );
          logResponse(req.method, url.pathname, res.status, startMs);
          return res;
        }

        return fetchHandler(boundedReq).then((res) => {
          logResponse(req.method, url.pathname, res.status, startMs);
          return withCors(res);
        });
      });
    }

    const res = new Response("Not Found", {
      status: 404,
      headers: corsHeaders,
    });
    logResponse(req.method, url.pathname, res.status, startMs);
    return res;
  };
}

if (import.meta.main) {
  const port = Number(process.env.PORT || 8080);
  let ready = true;
  const handleRequest = createRpcHandler({
    isReady: () => ready,
  });

  const server = Bun.serve({
    port,
    fetch(req) {
      return handleRequest(req);
    },
  });

  defaultStructuredLogger({
    ts: new Date().toISOString(),
    level: "info",
    event: "server.start",
    port: server.port,
  });

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    ready = false;
    await gracefulShutdown(server, { signal });
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
}
