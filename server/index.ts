import { createConnectRouter } from "@connectrpc/connect";
import { createFetchHandler } from "@connectrpc/connect/protocol";
import { HealthCheckStatus, PaymentService, SystemService } from "../src/schema/connect";

export const router = createConnectRouter();

// 1. Register SystemService
router.service(SystemService, {
  async checkHealth(req) {
    return {
      status: HealthCheckStatus.SERVING,
      version: "1.0.0",
      uptimeSeconds: process.uptime(),
    };
  },
});

// 2. Register PaymentService
router.service(PaymentService, {
  async createCheckoutSession(req) {
    const sessionId = `cs_live_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return {
      sessionId,
      checkoutUrl: `https://checkout.stripe.com/pay/${sessionId}`,
      status: "OPEN",
    };
  },
});

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Connect-Protocol-Version, Connect-Timeout-Ms, X-User-Agent, X-Grpc-Web",
  "Access-Control-Max-Age": "86400",
};

export function handleRequest(req: Request): Promise<Response> | Response {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  const url = new URL(req.url);

  if (url.pathname === "/healthz" && req.method === "GET") {
    return new Response(JSON.stringify({ status: "ok", uptime: process.uptime() }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...CORS_HEADERS,
      },
    });
  }

  const handler = router.handlers.find((h) => h.requestPath === url.pathname);

  if (handler) {
    const fetchHandler = createFetchHandler(handler);
    return fetchHandler(req).then((res) => {
      // Merge CORS headers into response
      const headers = new Headers(res.headers);
      for (const [k, v] of Object.entries(CORS_HEADERS)) {
        headers.set(k, v);
      }
      return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers,
      });
    });
  }

  return new Response("Not Found", {
    status: 404,
    headers: CORS_HEADERS,
  });
}

const port = Number(process.env.PORT || 8080);

export const server = Bun.serve({
  port,
  fetch(req) {
    return handleRequest(req);
  },
});

console.log(`[ConnectRPC Server] Online at http://localhost:${server.port}`);

process.on("SIGINT", () => {
  server.stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  server.stop();
  process.exit(0);
});
