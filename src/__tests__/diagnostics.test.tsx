import { createRouterTransport } from "@connectrpc/connect";
import {
  assertBudget,
  captureArtifact,
  expectNoDiagnostics,
  expectNoWaste,
} from "@solidjs/diagnostics";
import { render } from "@solidjs/web";
import { action, createMemo, createSignal, flush } from "solid-js";
import { describe, expect, it } from "vitest";
import { AsyncBoundary, Box, Dialog, Input, Text } from "~/components/ui";
import { TelemetryProvider, useTelemetry } from "~/lib";
import { setGlobalTransport } from "~/lib/connect";
import Overview from "~/routes/overview";
import { HealthCheckStatus, SystemService } from "~/schema";

describe("Solid 2.0 Reactive Diagnostics Verification Matrix", () => {
  // Scenario 1: Fine-grained counter and derived memo
  it("Scenario 1: Fine-grained counter & derived calculation has zero diagnostics and zero waste", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const dispose = render(() => <Overview />, container);

    const buttons = container.querySelectorAll("button");
    const incrementBtn = Array.from(buttons).find((b) => b.textContent?.includes("+ Increment"));
    expect(incrementBtn).toBeDefined();

    const { artifact } = await captureArtifact(
      async () => {
        incrementBtn?.click();
      },
      { scenario: "scenario-1-counter-increment" },
    );

    expect(artifact).toBeDefined();
    expectNoDiagnostics(artifact);
    expectNoWaste(artifact);
    assertBudget(artifact, { maxSilentHoldMs: 0 });

    dispose();
    container.remove();
  });

  // Scenario 2: Controlled / derived Input consecutive typing
  it("Scenario 2: Controlled / derived Input consecutive typing has zero diagnostics and zero waste", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    let currentVal = "start";
    const dispose = render(
      () => (
        <Input
          value={currentVal}
          onValueChange={(val) => {
            currentVal = val;
          }}
          placeholder="Type here..."
        />
      ),
      container,
    );

    const inputEl = container.querySelector("input");
    expect(inputEl).toBeDefined();

    const { artifact } = await captureArtifact(
      async () => {
        if (inputEl) {
          inputEl.value = "start-1";
          inputEl.dispatchEvent(new Event("input", { bubbles: true }));
          inputEl.value = "start-12";
          inputEl.dispatchEvent(new Event("input", { bubbles: true }));
          inputEl.value = "start-123";
          inputEl.dispatchEvent(new Event("input", { bubbles: true }));
        }
      },
      { scenario: "scenario-2-input-typing" },
    );

    expect(artifact).toBeDefined();
    expectNoDiagnostics(artifact);
    expectNoWaste(artifact);
    assertBudget(artifact, { maxSilentHoldMs: 0 });
    expect(currentVal).toBe("start-123");

    dispose();
    container.remove();
  });

  // Scenario 3: Headless Dialog state machine and Portal DOM lifecycle
  it("Scenario 3: Headless Dialog open, type, and dismiss cleans up Portal DOM with zero diagnostics", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    function TestDialog() {
      return (
        <Dialog.Root>
          <Dialog.Trigger>Open Test Dialog</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content>
                <Dialog.Header>
                  <Dialog.Title>Modal Title</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  <Input placeholder="Dialog input" />
                </Dialog.Body>
                <Dialog.Footer>
                  <Dialog.CloseTrigger>Close Modal</Dialog.CloseTrigger>
                </Dialog.Footer>
              </Dialog.Content>
            </Dialog.Positioner>
          </Dialog.Portal>
        </Dialog.Root>
      );
    }

    const dispose = render(() => <TestDialog />, container);
    const triggerBtn = container.querySelector("button");
    expect(triggerBtn).toBeDefined();

    // 1. Open the dialog
    triggerBtn?.click();
    await Promise.resolve();
    flush();

    const input = document.body.querySelector("input[placeholder='Dialog input']");
    expect(input).toBeDefined();
    const allButtons = Array.from(document.body.querySelectorAll("button"));
    const closeBtn = allButtons.find((b) => b.textContent?.includes("Close Modal"));
    expect(closeBtn).toBeDefined();

    // 2. Capture interaction within modal: fine-grained typing
    const { artifact } = await captureArtifact(
      async () => {
        if (input) {
          (input as HTMLInputElement).value = "modal test content";
          input.dispatchEvent(new Event("input", { bubbles: true }));
        }
        flush();
      },
      { scenario: "scenario-3-dialog-lifecycle" },
    );

    expect(artifact).toBeDefined();
    expectNoDiagnostics(artifact);
    expectNoWaste(artifact);
    assertBudget(artifact, { maxSilentHoldMs: 0 });

    // 3. Dismiss modal and verify Portal DOM teardown
    (closeBtn as HTMLButtonElement)?.click();
    await Promise.resolve();
    flush();

    expect(document.body.querySelector("input[placeholder='Dialog input']")).toBeNull();

    dispose();
    container.remove();
  });

  // Scenario 4: Real ConnectRPC async call and optimistic hold (Loop 4)
  it("Scenario 4: ConnectRPC async invocation with optimistic hold has zero silent hold and zero diagnostics", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    // Configure in-memory transport using real SystemService schema
    const routerTransport = createRouterTransport((router) => {
      router.service(SystemService, {
        async checkHealth(_req) {
          return {
            status: HealthCheckStatus.SERVING,
            version: "2026.1.0",
            uptimeSeconds: 123.45,
          };
        },
      });
    });
    setGlobalTransport(routerTransport);

    let telemetryRef!: ReturnType<typeof useTelemetry>;
    function Consumer() {
      telemetryRef = useTelemetry();
      return (
        <Box>
          <Text>{telemetryRef.isRpcPending() ? "Hold Active" : "Idle"}</Text>
          <Text>{telemetryRef.rpcResponse()?.version ?? "no-version"}</Text>
        </Box>
      );
    }

    const dispose = render(
      () => (
        <TelemetryProvider>
          <Consumer />
        </TelemetryProvider>
      ),
      container,
    );

    expect(telemetryRef).toBeDefined();

    const { artifact } = await captureArtifact(
      async () => {
        await telemetryRef.checkSystemHealth({});
      },
      { scenario: "scenario-4-connectrpc-optimistic-hold" },
    );

    expect(artifact).toBeDefined();
    expectNoDiagnostics(artifact, { allow: ["OPTIMISTIC_REVERTED"] });
    expectNoWaste(artifact);
    assertBudget(artifact, { maxSilentHoldMs: 0, allow: ["OPTIMISTIC_REVERTED"] });
    expect(telemetryRef.rpcResponse()?.status).toBe(HealthCheckStatus.SERVING);
    expect(telemetryRef.rpcResponse()?.version).toBe("2026.1.0");

    dispose();
    container.remove();
  });

  // Scenario 5: AsyncBoundary suspending and error self-healing
  it("Scenario 5: AsyncBoundary suspending & error self-healing with zero diagnostics and zero waste", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const [status, setStatus] = createSignal("initial", {
      name: "test-boundary-status",
    });

    const content = createMemo(
      () => {
        if (status() === "failing") {
          throw new Error("Simulated computation failure");
        }
        return status() === "recovered" ? "Recovered Content" : "Initial Content";
      },
      { name: "fallible-content" },
    );

    const dispose = render(
      () => (
        <AsyncBoundary>
          <Text>{content()}</Text>
        </AsyncBoundary>
      ),
      container,
    );

    // 1. Trigger error condition before capture to test self-healing lifecycle
    setStatus("failing");
    flush();
    expect(container.textContent).toContain("Application Error");

    // eslint-disable-next-line require-yield
    const heal = action(function* () {
      setStatus("recovered");
      const retryBtn = container.querySelector("button");
      expect(retryBtn).toBeDefined();
      expect(retryBtn?.textContent).toContain("Retry");
      retryBtn?.click();
    });

    // 2. Capture the self-healing recovery interaction
    const { artifact } = await captureArtifact(
      async () => {
        await heal();
        flush();
      },
      { scenario: "scenario-5-async-boundary-healing" },
    );

    expect(artifact).toBeDefined();
    expectNoDiagnostics(artifact);
    expectNoWaste(artifact);
    assertBudget(artifact, { maxSilentHoldMs: 0 });
    expect(container.textContent).toContain("Recovered Content");

    dispose();
    container.remove();
  });
});
