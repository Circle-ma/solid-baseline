import { createRouterTransport } from "@connectrpc/connect";
import {
  assertBudget,
  captureArtifact,
  expectNoDiagnostics,
  expectNoWaste,
} from "@solidjs/diagnostics";
import { createRouter, defineRoute, defineRoutes, memoryHistory } from "@solidjs/router";
import { render } from "@solidjs/web";
import { action, createMemo, createSignal, flush, isPending, untrack } from "solid-js";
import { describe, expect, it } from "vitest";
import { createAppRouter } from "~/App";
import {
  AsyncBoundary,
  Box,
  Dialog,
  HStack,
  Input,
  NavLink,
  Text,
  ThemeToggle,
} from "~/components/ui";
import {
  OfflineSandboxSpacetimeAdapter,
  RpcProvider,
  SpacetimeProvider,
  useRpc,
  useSpacetime,
} from "~/lib";
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

  // Scenario 2: Controlled Input typing + external reset & uncontrolled Input without UNCOMMITTED_INPUT_OVERWRITTEN
  it("Scenario 2: Controlled Input typing, external state reset, and uncontrolled Input have zero diagnostics", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const [controlledVal, setControlledVal] = createSignal("start", {
      name: "test-controlled-input",
    });
    const [isInvalid, setIsInvalid] = createSignal(false, {
      name: "test-uncontrolled-invalid",
    });

    const dispose = render(
      () => (
        <Box>
          <Input
            data-testid="controlled"
            value={controlledVal()}
            onValueChange={setControlledVal}
            placeholder="Controlled..."
          />
          <Input
            data-testid="uncontrolled"
            defaultValue="initial-uncontrolled"
            invalid={isInvalid()}
            placeholder="Uncontrolled..."
          />
        </Box>
      ),
      container,
    );

    const controlledEl = container.querySelector(
      "input[data-testid='controlled']",
    ) as HTMLInputElement | null;
    const uncontrolledEl = container.querySelector(
      "input[data-testid='uncontrolled']",
    ) as HTMLInputElement | null;
    expect(controlledEl).not.toBeNull();
    expect(uncontrolledEl).not.toBeNull();
    expect(controlledEl?.value).toBe("start");
    expect(uncontrolledEl?.value).toBe("initial-uncontrolled");

    const { artifact } = await captureArtifact(
      async () => {
        if (controlledEl) {
          // 1. Consecutive typing on controlled input
          controlledEl.value = "start-1";
          controlledEl.dispatchEvent(new Event("input", { bubbles: true }));
          flush();
          controlledEl.value = "start-123";
          controlledEl.dispatchEvent(new Event("input", { bubbles: true }));
          flush();
        }
        expect(untrack(() => controlledVal())).toBe("start-123");

        // 2. External form reset (e.g. setInputText("")) seamlessly clears DOM value
        setControlledVal("");
        flush();
        expect(controlledEl?.value).toBe("");

        // 3. Typing in uncontrolled input while sibling attribute (`invalid`) updates
        if (uncontrolledEl) {
          uncontrolledEl.value = "user-typed-text";
          uncontrolledEl.dispatchEvent(new Event("input", { bubbles: true }));
        }
        setIsInvalid(true);
        flush();
        expect(uncontrolledEl?.value).toBe("user-typed-text");
      },
      { scenario: "scenario-2-input-controlled-reset-and-uncontrolled" },
    );

    expect(artifact).toBeDefined();
    expectNoDiagnostics(artifact);
    expectNoWaste(artifact);
    assertBudget(artifact, { maxSilentHoldMs: 0 });
    expect(untrack(() => controlledVal())).toBe("");
    expect(controlledEl?.value).toBe("");

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
                  <Input defaultValue="" placeholder="Dialog input" />
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

  // Scenario 4: Declarative ConnectRPC async query via RpcProvider (zero OPTIMISTIC_REVERTED)
  it("Scenario 4: Declarative ConnectRPC async query & refresh has zero diagnostics and zero silent holds", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    let callCount = 0;
    const routerTransport = createRouterTransport((router) => {
      router.service(SystemService, {
        async checkHealth(_req) {
          callCount += 1;
          return {
            status: HealthCheckStatus.SERVING,
            version: `2026.2.${callCount}`,
            uptimeSeconds: 100 + callCount,
          };
        },
      });
    });

    let rpcRef!: ReturnType<typeof useRpc>;
    function Consumer() {
      rpcRef = useRpc();
      const pending = createMemo(() => isPending(() => rpcRef.healthQuery()), {
        name: "test-rpc-pending",
      });
      return (
        <AsyncBoundary>
          <Box>
            <Text data-testid="rpc-pending">{pending() ? "Pending" : "Idle"}</Text>
            <Text data-testid="rpc-version">
              {rpcRef.healthQuery()?.response.version ?? "uncalled"}
            </Text>
          </Box>
        </AsyncBoundary>
      );
    }

    const dispose = render(
      () => (
        <RpcProvider transport={routerTransport}>
          <Consumer />
        </RpcProvider>
      ),
      container,
    );

    expect(rpcRef).toBeDefined();
    expect(container.textContent).toContain("uncalled");

    const { artifact } = await captureArtifact(
      async () => {
        // 1. First declarative query invocation
        const first = await rpcRef.refreshHealth({});
        expect(first?.response.status).toBe(HealthCheckStatus.SERVING);
        expect(first?.response.version).toBe("2026.2.1");

        // 2. Subsequent declarative refresh via `affects(healthQuery) + refresh(healthQuery)`
        const second = await rpcRef.refreshHealth();
        expect(second?.response.version).toBe("2026.2.2");
      },
      { scenario: "scenario-4-declarative-connectrpc-query" },
    );

    expect(artifact).toBeDefined();
    // Strict zero-exception diagnostics check (no OPTIMISTIC_REVERTED allowlist!)
    expectNoDiagnostics(artifact);
    expectNoWaste(artifact);
    assertBudget(artifact, { maxSilentHoldMs: 0 });
    expect(container.textContent).toContain("2026.2.2");
    expect(callCount).toBe(2);

    dispose();
    container.remove();
  });

  // Scenario 5: SPA Route Navigation via Solid Router 2.0 + NavLink (zero page reload)
  it("Scenario 5: SPA NavLink navigation switches route and updates aria-current without page reload", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const history = memoryHistory("/");
    const testRoutes = defineRoutes([
      defineRoute({
        path: "/",
        component: () => <Text data-testid="route-view">Home Route View</Text>,
      }),
      defineRoute({
        path: "/realtime",
        component: () => <Text data-testid="route-view">Realtime Route View</Text>,
      }),
    ]);

    const TestRouter = createRouter({ routes: testRoutes, history });

    const dispose = render(
      () => (
        <TestRouter>
          {(props) => (
            <Box>
              <HStack as="nav">
                <NavLink href="/" end activeClass="nav-is-active" inactiveClass="nav-is-inactive">
                  Home
                </NavLink>
                <NavLink
                  href="/realtime"
                  activeClass="nav-is-active"
                  inactiveClass="nav-is-inactive"
                >
                  Realtime
                </NavLink>
              </HStack>
              <Box as="main">{props.children}</Box>
            </Box>
          )}
        </TestRouter>
      ),
      container,
    );

    const homeLink = container.querySelector("a[href='/']") as HTMLAnchorElement | null;
    const realtimeLink = container.querySelector("a[href='/realtime']") as HTMLAnchorElement | null;
    expect(homeLink).not.toBeNull();
    expect(realtimeLink).not.toBeNull();
    expect(homeLink?.getAttribute("aria-current")).toBe("page");
    expect(realtimeLink?.getAttribute("aria-current")).toBeNull();
    expect(container.textContent).toContain("Home Route View");

    const { artifact } = await captureArtifact(
      async () => {
        const clickEvent = new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          button: 0,
        });
        realtimeLink?.dispatchEvent(clickEvent);
        // Solid Router 2.0 native click delegation calls preventDefault() for SPA navigation
        expect(clickEvent.defaultPrevented).toBe(true);
        flush();
      },
      { scenario: "scenario-5-spa-navlink-navigation" },
    );

    expect(artifact).toBeDefined();
    expectNoDiagnostics(artifact);
    assertBudget(artifact, {
      maxSilentHoldMs: 0,
      scopes: { "nav-link-active": 2, "nav-link-current": 2 },
    });
    expect(history.get()).toBe("/realtime");
    expect(container.textContent).toContain("Realtime Route View");
    expect(homeLink?.getAttribute("aria-current")).toBeNull();
    expect(realtimeLink?.getAttribute("aria-current")).toBe("page");
    expect(realtimeLink?.className).toContain("nav-is-active");
    expect(homeLink?.className).toContain("nav-is-inactive");

    dispose();
    container.remove();
  });

  // Scenario 6: SpacetimeDB SpacetimeProvider fine-grained store draft mutations
  it("Scenario 6: SpacetimeProvider incremental draft mutations have zero diagnostics and zero waste", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const sandboxAdapter = new OfflineSandboxSpacetimeAdapter();
    let spacetimeRef!: ReturnType<typeof useSpacetime>;

    function StoreConsumer() {
      spacetimeRef = useSpacetime();
      return (
        <Box>
          <Text data-testid="record-count">{spacetimeRef.records.length}</Text>
          <Text data-testid="first-action">{spacetimeRef.records[0]?.action ?? "empty"}</Text>
        </Box>
      );
    }

    const dispose = render(
      () => (
        <SpacetimeProvider adapter={sandboxAdapter}>
          <StoreConsumer />
        </SpacetimeProvider>
      ),
      container,
    );

    expect(spacetimeRef.records.length).toBe(2);

    const { artifact } = await captureArtifact(
      async () => {
        await spacetimeRef.callReducer({
          action: "TX_DRAFT_INSERT",
          payload: "Fine-grained draft unshift",
        });
        flush();

        const insertedId = spacetimeRef.records[0]?.id;
        expect(insertedId).toBeDefined();

        if (insertedId) {
          sandboxAdapter.emitUpdate({
            id: insertedId,
            sender: "sandbox_node_local",
            action: "TX_DRAFT_UPDATED",
            payload: "In-place draft mutation",
            timestamp: "00:00:01",
          });
          flush();
          expect(spacetimeRef.records[0]?.action).toBe("TX_DRAFT_UPDATED");

          sandboxAdapter.emitDelete(insertedId);
          flush();
          expect(spacetimeRef.records.length).toBe(2);
        }
      },
      { scenario: "scenario-6-spacetime-draft-mutations" },
    );

    expect(artifact).toBeDefined();
    expectNoDiagnostics(artifact);
    expectNoWaste(artifact);
    assertBudget(artifact, { maxSilentHoldMs: 0 });

    dispose();
    container.remove();
  });

  // Scenario 7: AsyncBoundary suspending and error self-healing
  it("Scenario 7: AsyncBoundary suspending & error self-healing with zero diagnostics and zero waste", async () => {
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
      { scenario: "scenario-7-async-boundary-healing" },
    );

    expect(artifact).toBeDefined();
    expectNoDiagnostics(artifact);
    expectNoWaste(artifact);
    assertBudget(artifact, { maxSilentHoldMs: 0 });
    expect(container.textContent).toContain("Recovered Content");

    dispose();
    container.remove();
  });

  // Scenario 8: Zero-flicker ThemeToggle (pure CSS _dark + cookie sync) & SSR-isolated createAppRouter
  it("Scenario 8: ThemeToggle renders both icons without hydration flicker, syncs cookie, and createAppRouter isolates instances", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    document.documentElement.classList.remove("dark");

    const dispose = render(() => <ThemeToggle />, container);
    const button = container.querySelector("button");
    expect(button).not.toBeNull();
    // Both Sun and Moon <Icon> SVGs are rendered upfront so CSS `_dark` swaps them with zero flicker
    expect(container.querySelectorAll("svg").length).toBe(2);

    const { artifact } = await captureArtifact(
      async () => {
        button?.click();
        flush();
      },
      { scenario: "scenario-8-theme-toggle-zero-flicker" },
    );

    expect(artifact).toBeDefined();
    expectNoDiagnostics(artifact);
    expectNoWaste(artifact);
    assertBudget(artifact, { maxSilentHoldMs: 0 });
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.cookie).toContain("theme=dark");

    // SSR isolation: each createAppRouter() call returns an independent Router component
    const routerA = createAppRouter();
    const routerB = createAppRouter();
    expect(routerA).not.toBe(routerB);

    document.documentElement.classList.remove("dark");
    dispose();
    container.remove();
  });
});
