// @vitest-environment node
import { Code, ConnectError, createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { describe, expect, it } from "vitest";
import { HealthCheckStatus, SystemService } from "../../src/schema/connect";
import { createRpcHandler, type RequestLogEntry } from "../index";

describe("ConnectRPC Server createRpcHandler()", () => {
  it("responds to GET /healthz with ok JSON and omits wildcard CORS headers by default", async () => {
    const handler = createRpcHandler({ logger: false });
    const res = await handler(new Request("http://localhost:8080/healthz", { method: "GET" }));

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/json");
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();

    const body = (await res.json()) as { status: string; uptime: number };
    expect(body.status).toBe("ok");
    expect(typeof body.uptime).toBe("number");
    expect(body.uptime).toBeGreaterThanOrEqual(0);
  });

  it("handles POST /system.v1.SystemService/CheckHealth over Connect JSON protocol", async () => {
    const handler = createRpcHandler({ logger: false });
    const res = await handler(
      new Request("http://localhost:8080/system.v1.SystemService/CheckHealth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Connect-Protocol-Version": "1",
        },
        body: JSON.stringify({}),
      }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      status: string;
      version: string;
      uptimeSeconds: number;
    };
    expect(body.status).toBe("HEALTH_CHECK_STATUS_SERVING");
    expect(body.version).toBe("1.0.0");
    expect(typeof body.uptimeSeconds).toBe("number");
  });

  it("round-trips typed SystemService.CheckHealth and validates service parameter", async () => {
    const handler = createRpcHandler({ logger: false });
    const customFetch: typeof globalThis.fetch = Object.assign(
      (input: Parameters<typeof globalThis.fetch>[0], init?: RequestInit) =>
        Promise.resolve(
          handler(
            input instanceof Request ? new Request(input, init) : new Request(String(input), init),
          ),
        ),
      { preconnect: globalThis.fetch.preconnect },
    );
    const transport = createConnectTransport({
      baseUrl: "http://localhost:8080",
      fetch: customFetch,
    });
    const client = createClient(SystemService, transport);

    const defaultRes = await client.checkHealth({});
    expect(defaultRes.status).toBe(HealthCheckStatus.SERVING);
    expect(defaultRes.version).toBe("1.0.0");
    expect(defaultRes.uptimeSeconds).toBeGreaterThanOrEqual(0);

    const knownRes = await client.checkHealth({ service: "system.v1.SystemService" });
    expect(knownRes.status).toBe(HealthCheckStatus.SERVING);

    const unknownRes = await client.checkHealth({ service: "payments.v1.BillingService" });
    expect(unknownRes.status).toBe(HealthCheckStatus.UNKNOWN);

    await expect(client.checkHealth({ service: "invalid service name!" })).rejects.toMatchObject({
      code: Code.InvalidArgument,
    } satisfies Partial<ConnectError>);
  });

  it("applies configured CORS_ORIGIN headers and handles OPTIONS preflight", async () => {
    const handler = createRpcHandler({ corsOrigin: "http://localhost:3000", logger: false });

    const preflight = await handler(
      new Request("http://localhost:8080/system.v1.SystemService/CheckHealth", {
        method: "OPTIONS",
      }),
    );
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:3000");
    expect(preflight.headers.get("Vary")).toBe("Origin");

    const rpcRes = await handler(
      new Request("http://localhost:8080/system.v1.SystemService/CheckHealth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Connect-Protocol-Version": "1",
        },
        body: JSON.stringify({}),
      }),
    );
    expect(rpcRes.status).toBe(200);
    expect(rpcRes.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:3000");
    expect(rpcRes.headers.get("Vary")).toBe("Origin");
  });

  it("emits structured JSON request logs and returns 404 for unknown endpoints", async () => {
    const logs: RequestLogEntry[] = [];
    const handler = createRpcHandler({ logger: (entry) => logs.push(entry) });

    const okRes = await handler(new Request("http://localhost:8080/healthz", { method: "GET" }));
    expect(okRes.status).toBe(200);

    const notFoundRes = await handler(
      new Request("http://localhost:8080/unknown", { method: "GET" }),
    );
    expect(notFoundRes.status).toBe(404);

    expect(logs.length).toBe(2);
    expect(logs[0]).toMatchObject({
      level: "info",
      event: "http.request",
      method: "GET",
      path: "/healthz",
      status: 200,
    });
    expect(logs[1]).toMatchObject({
      level: "warn",
      event: "http.request",
      method: "GET",
      path: "/unknown",
      status: 404,
    });
    expect(typeof logs[0].durationMs).toBe("number");
  });
});
