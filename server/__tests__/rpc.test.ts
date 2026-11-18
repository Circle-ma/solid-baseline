// @vitest-environment node
import { Code, ConnectError, createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { describe, expect, it } from "vitest";
import { HealthCheckStatus, SystemService } from "../../src/schema/connect";
import {
  createRpcHandler,
  gracefulShutdown,
  type RequestLogEntry,
  type StoppableServer,
} from "../index";

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

  it("responds to GET /readyz with 200 when ready and 503 when draining", async () => {
    let ready = true;
    const handler = createRpcHandler({ logger: false, isReady: () => ready });

    const readyRes = await handler(new Request("http://localhost:8080/readyz", { method: "GET" }));
    expect(readyRes.status).toBe(200);
    expect((await readyRes.json()) as { status: string }).toMatchObject({ status: "ready" });

    ready = false;
    const drainingRes = await handler(
      new Request("http://localhost:8080/readyz", { method: "GET" }),
    );
    expect(drainingRes.status).toBe(503);
    expect((await drainingRes.json()) as { status: string }).toMatchObject({ status: "draining" });
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

  it("rejects oversized request bodies (Content-Length and streamed) with 413 and malformed JSON with 400", async () => {
    const handler = createRpcHandler({ logger: false, maxBodyBytes: 64 });

    // 1. Content-Length header exceeds limit
    const headerTooLarge = await handler(
      new Request("http://localhost:8080/system.v1.SystemService/CheckHealth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Connect-Protocol-Version": "1",
          "Content-Length": "1024",
        },
        body: JSON.stringify({ service: "a".repeat(200) }),
      }),
    );
    expect(headerTooLarge.status).toBe(413);

    // 2. Streamed body without Content-Length exceeds limit
    const bigStream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(JSON.stringify({ service: "x".repeat(120) })));
        controller.close();
      },
    });
    const streamTooLarge = await handler(
      new Request("http://localhost:8080/system.v1.SystemService/CheckHealth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Connect-Protocol-Version": "1",
        },
        body: bigStream,
      }),
    );
    expect(streamTooLarge.status).toBe(413);

    // 3. Malformed JSON payload returns ConnectRPC InvalidArgument (HTTP 400)
    const badJson = await handler(
      new Request("http://localhost:8080/system.v1.SystemService/CheckHealth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Connect-Protocol-Version": "1",
        },
        body: "{not-valid-json",
      }),
    );
    expect(badJson.status).toBe(400);
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

  it("executes two-stage gracefulShutdown: drains cleanly via stop(false), escalates to stop(true) on timeout", async () => {
    const cleanCalls: Array<boolean | undefined> = [];
    const cleanServer: StoppableServer = {
      async stop(closeActive) {
        cleanCalls.push(closeActive);
      },
    };
    const cleanOutcome = await gracefulShutdown(cleanServer, {
      signal: "SIGTERM",
      timeoutMs: 100,
      logger: false,
    });
    expect(cleanOutcome).toEqual({ forced: false });
    expect(cleanCalls).toEqual([false]);

    const stuckCalls: Array<boolean | undefined> = [];
    let releaseStuckDrain: (() => void) | null = null;
    const stuckServer: StoppableServer = {
      stop(closeActive) {
        stuckCalls.push(closeActive);
        if (!closeActive) {
          return new Promise<void>((resolveDrain) => {
            releaseStuckDrain = resolveDrain;
          });
        }
        releaseStuckDrain?.();
        return Promise.resolve();
      },
    };
    const forcedOutcome = await gracefulShutdown(stuckServer, {
      signal: "SIGINT",
      timeoutMs: 20,
      logger: false,
    });
    expect(forcedOutcome).toEqual({ forced: true });
    expect(stuckCalls).toEqual([false, true]);
  });
});
