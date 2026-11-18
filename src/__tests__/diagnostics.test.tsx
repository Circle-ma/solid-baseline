import { Code, ConnectError, createRouterTransport } from "@connectrpc/connect";
import {
  assertBudget,
  captureArtifact,
  expectNoDiagnostics,
  expectNoWaste,
} from "@solidjs/diagnostics";
import { createRouter, defineRoute, defineRoutes, memoryHistory } from "@solidjs/router";
import { render } from "@solidjs/web";
import { action, createMemo, createSignal, flush, untrack } from "solid-js";
import { describe, expect, it } from "vitest";
import { router } from "~/App";
import {
  AsyncBoundary,
  Box,
  Button,
  Card,
  Dialog,
  HStack,
  Icon,
  Input,
  NavLink,
  Text,
  ThemeToggle,
} from "~/components/ui";
import {
  createHealthCheckQuery,
  LiveSpacetimeAdapter,
  OfflineSandboxSpacetimeAdapter,
  RpcProvider,
  SpacetimeProvider,
  useSpacetime,
} from "~/lib";
import Overview from "~/routes/overview";
import Realtime from "~/routes/realtime";
import {
  HealthCheckStatus,
  type SpacetimeIdentityLike,
  type SpacetimeLiveConnectionBuilderLike,
  type SpacetimeLiveConnectionLike,
  SystemService,
} from "~/schema";

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

    let healthQueryRef!: ReturnType<typeof createHealthCheckQuery>;
    function Consumer() {
      healthQueryRef = createHealthCheckQuery();
      return (
        <AsyncBoundary>
          <Box>
            <Text data-testid="rpc-pending">{healthQueryRef.isPending() ? "Pending" : "Idle"}</Text>
            <Text data-testid="rpc-version">
              {healthQueryRef.data()?.response.version ?? "uncalled"}
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

    expect(healthQueryRef).toBeDefined();
    expect(container.textContent).toContain("uncalled");

    const { artifact } = await captureArtifact(
      async () => {
        // 1. First declarative query invocation via deterministic flush() + resolve()
        const first = await healthQueryRef.execute({});
        expect(first?.response.status).toBe(HealthCheckStatus.SERVING);
        expect(first?.response.version).toBe("2026.2.1");

        // 2. Subsequent declarative refresh via `affects(query) + refresh(query)`
        const second = await healthQueryRef.refresh();
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
        await spacetimeRef.reducers.txEvent({
          action: "TX_DRAFT_INSERT",
          payload: "Fine-grained draft unshift",
        });
        flush();

        const insertedId = spacetimeRef.records[0]?.id;
        expect(insertedId).toBeDefined();
        // Verify ISO-8601 UTC timestamp format from OfflineSandboxSpacetimeAdapter
        expect(spacetimeRef.records[0]?.timestamp).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        );

        if (insertedId) {
          sandboxAdapter.emitUpdate({
            id: insertedId,
            sender: "sandbox_node_local",
            action: "TX_DRAFT_UPDATED",
            payload: "In-place draft mutation",
            timestamp: "2026-01-01T00:00:01.000Z",
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

    // Verify unified disconnect resets identity and notifies listeners
    let observedIdentity: string | null = "initial";
    const unsubIdentity = sandboxAdapter.onIdentityChange((id) => {
      observedIdentity = id;
    });
    sandboxAdapter.disconnect();
    expect(sandboxAdapter.isConnected).toBe(false);
    expect(sandboxAdapter.identity).toBeNull();
    expect(observedIdentity).toBeNull();
    unsubIdentity();

    dispose();
    container.remove();

    // Verify default SpacetimeProvider syncs client identity with sandbox adapter record.sender
    const defaultContainer = document.createElement("div");
    document.body.appendChild(defaultContainer);
    let defaultSpacetime!: ReturnType<typeof useSpacetime>;
    function DefaultIdentityConsumer() {
      defaultSpacetime = useSpacetime();
      return <Text>{defaultSpacetime.clientIdentity()}</Text>;
    }
    const disposeDefault = render(
      () => (
        <SpacetimeProvider>
          <DefaultIdentityConsumer />
        </SpacetimeProvider>
      ),
      defaultContainer,
    );
    await Promise.resolve();
    flush();

    const badgeIdentity = untrack(() => defaultSpacetime.clientIdentity());
    expect(badgeIdentity).toMatch(/^usr_/);
    await defaultSpacetime.callReducer("txEvent", {
      action: "TX_IDENTITY_SYNC",
      payload: "Sender must equal badge identity",
    });
    flush();
    expect(defaultSpacetime.records[0]?.sender).toBe(badgeIdentity);

    disposeDefault();
    defaultContainer.remove();
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

  // Scenario 8: Zero-flicker ThemeToggle (pure CSS _dark + cookie sync) & type-safe module-level router
  it("Scenario 8: ThemeToggle renders both icons without hydration flicker, syncs cookie, and router exposes typed paths", async () => {
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

    // Module-level router exposes type-safe paths without hardcoded route strings
    expect(router.paths()).toBe("/");
    expect(router.paths.realtime()).toBe("/realtime");

    document.documentElement.classList.remove("dark");
    dispose();
    container.remove();
  });

  // Scenario 9: Real RPC rejection -> AsyncBoundary Retry -> self-healing recovery (zero cheating)
  it("Scenario 9: AsyncBoundary recovers from a real RPC rejection upon clicking Retry while keeping Card.Header mounted", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    let attempt = 0;
    const flakyTransport = createRouterTransport((rpcRouter) => {
      rpcRouter.service(SystemService, {
        async checkHealth(_req) {
          attempt += 1;
          if (attempt === 1) {
            throw new ConnectError("Upstream temporarily unavailable", Code.Unavailable);
          }
          return {
            status: HealthCheckStatus.SERVING,
            version: "2026.3.recovered",
            uptimeSeconds: 42,
          };
        },
      });
    });

    const dispose = render(
      () => (
        <SpacetimeProvider adapter={new OfflineSandboxSpacetimeAdapter()}>
          <RpcProvider transport={flakyTransport}>
            <Realtime />
          </RpcProvider>
        </SpacetimeProvider>
      ),
      container,
    );

    const invokeBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Invoke HealthCheck RPC"),
    );
    expect(invokeBtn).toBeDefined();

    // 1. Trigger the first RPC call which genuinely rejects
    invokeBtn?.click();
    await new Promise((resolveWait) => setTimeout(resolveWait, 20));
    flush();

    expect(attempt).toBe(1);
    expect(container.textContent).toContain("Application Error");
    expect(container.textContent).toContain("Upstream temporarily unavailable");
    // Fine-grained AsyncBoundary keeps Card.Header, error status badge, and trigger button intact
    expect(container.textContent).toContain("ConnectRPC Client Pipeline");
    expect(container.textContent).toContain("Status: ERROR");
    expect(
      Array.from(container.querySelectorAll("button")).some((b) =>
        b.textContent?.includes("Invoke HealthCheck RPC"),
      ),
    ).toBe(true);

    // 2. Click Retry directly without mutating any state beforehand
    const retryBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Retry",
    );
    expect(retryBtn).toBeDefined();

    const { artifact } = await captureArtifact(
      async () => {
        retryBtn?.click();
        await new Promise((resolveWait) => setTimeout(resolveWait, 20));
        flush();
      },
      { scenario: "scenario-9-rpc-rejection-retry-recovery" },
    );

    expect(artifact).toBeDefined();
    expectNoDiagnostics(artifact);
    assertBudget(artifact, {
      maxSilentHoldMs: 0,
      scopes: { "rpc-health-query": 1 },
    });
    expect(attempt).toBe(2);
    expect(container.textContent).not.toContain("Application Error");
    expect(container.textContent).toContain("2026.3.recovered");
    expect(container.textContent).toContain("Status: SERVING");

    dispose();
    container.remove();
  });

  // Scenario 10: Native Solid 2.0 array/object class pass-through & explicit Dialog.CloseButton / CloseTrigger asChild
  it("Scenario 10: Button and Card preserve array & reactive object class values, and Dialog separates CloseButton from unstyled CloseTrigger", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const [active, setActive] = createSignal(true, { name: "test-class-active" });

    const dispose = render(
      () => (
        <Box>
          <Button
            data-testid="class-btn"
            variant="solid"
            class={["custom-btn", { active: active(), inactive: !active() }]}
          >
            Class Button
          </Button>
          <Card.Root
            data-testid="class-card"
            class={["custom-card", { active: active(), muted: !active() }]}
          >
            <Card.Body>Body</Card.Body>
          </Card.Root>
          <Dialog.Root defaultOpen>
            <Dialog.Portal>
              <Dialog.Content>
                <Dialog.CloseButton data-testid="custom-icon-close" aria-label="Close modal">
                  <Icon size="sm">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </Icon>
                </Dialog.CloseButton>
                <Dialog.Footer>
                  <Dialog.CloseTrigger
                    asChild={(triggerProps) => (
                      <Button
                        {...triggerProps()}
                        data-testid="text-footer-close"
                        variant="outline"
                        size="sm"
                      >
                        Close
                      </Button>
                    )}
                  />
                </Dialog.Footer>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </Box>
      ),
      container,
    );

    flush();

    const btn = container.querySelector("button[data-testid='class-btn']");
    const card = container.querySelector("div[data-testid='class-card']");
    const closeTrigger = document.body.querySelector("button[data-testid='custom-icon-close']");
    const textCloseTrigger = document.body.querySelector("button[data-testid='text-footer-close']");

    expect(btn).not.toBeNull();
    expect(card).not.toBeNull();
    expect(closeTrigger).not.toBeNull();
    expect(textCloseTrigger).not.toBeNull();

    // Initial array + object class preservation alongside Panda recipe classes
    expect(btn?.classList.contains("button")).toBe(true);
    expect(btn?.classList.contains("custom-btn")).toBe(true);
    expect(btn?.classList.contains("active")).toBe(true);
    expect(btn?.classList.contains("inactive")).toBe(false);

    expect(card?.classList.contains("card__root")).toBe(true);
    expect(card?.classList.contains("custom-card")).toBe(true);
    expect(card?.classList.contains("active")).toBe(true);
    expect(card?.classList.contains("muted")).toBe(false);

    // Explicit Dialog.CloseButton carries the top-right dialog__closeTrigger slot class
    expect(closeTrigger?.classList.contains("dialog__closeTrigger")).toBe(true);
    expect(closeTrigger?.classList.contains("button")).toBe(false);

    // Unstyled Dialog.CloseTrigger composed via asChild renders an inline Button cleanly in flow
    expect(textCloseTrigger?.classList.contains("button")).toBe(true);
    expect(textCloseTrigger?.classList.contains("dialog__closeTrigger")).toBe(false);

    // Verify reactive toggling of object classes without dropping static/recipe classes
    const { artifact } = await captureArtifact(
      async () => {
        setActive(false);
        flush();
      },
      { scenario: "scenario-10-native-array-object-class-toggle" },
    );

    expect(artifact).toBeDefined();
    expectNoDiagnostics(artifact);
    expectNoWaste(artifact);
    assertBudget(artifact, { maxSilentHoldMs: 0 });

    expect(btn?.classList.contains("button")).toBe(true);
    expect(btn?.classList.contains("custom-btn")).toBe(true);
    expect(btn?.classList.contains("active")).toBe(false);
    expect(btn?.classList.contains("inactive")).toBe(true);

    expect(card?.classList.contains("card__root")).toBe(true);
    expect(card?.classList.contains("custom-card")).toBe(true);
    expect(card?.classList.contains("active")).toBe(false);
    expect(card?.classList.contains("muted")).toBe(true);

    dispose();
    container.remove();
  });

  // Scenario 11: Controlled Input strictly stays synchronized when parent rejects or formats input
  it("Scenario 11: Controlled Input immediately reconciles DOM value when parent rejects or formats input with zero diagnostics", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const [digits, setDigits] = createSignal("123", { name: "test-digits-input" });
    const [upper, setUpper] = createSignal("AB", { name: "test-upper-input" });
    const [invalid, setInvalid] = createSignal(false, { name: "test-digits-invalid" });

    const dispose = render(
      () => (
        <Box>
          <Input
            data-testid="digits-only"
            value={digits()}
            invalid={invalid()}
            onValueChange={(next) => {
              if (/^\d*$/.test(next)) {
                setDigits(next);
              }
            }}
          />
          <Input
            data-testid="uppercase-only"
            value={upper()}
            onValueChange={(next) => setUpper(next.toUpperCase())}
          />
        </Box>
      ),
      container,
    );

    const digitsEl = container.querySelector(
      "input[data-testid='digits-only']",
    ) as HTMLInputElement | null;
    const upperEl = container.querySelector(
      "input[data-testid='uppercase-only']",
    ) as HTMLInputElement | null;
    expect(digitsEl?.value).toBe("123");
    expect(upperEl?.value).toBe("AB");

    const { artifact } = await captureArtifact(
      async () => {
        if (digitsEl) {
          // 1. Parent rejects non-numeric character -> DOM reverts immediately
          digitsEl.value = "123a";
          digitsEl.dispatchEvent(new Event("input", { bubbles: true }));
          expect(digitsEl.value).toBe("123");
          expect(untrack(() => digits())).toBe("123");

          // 2. Sibling reactive attribute update does not emit UNCOMMITTED_INPUT_OVERWRITTEN
          setInvalid(true);
          flush();
          expect(digitsEl.value).toBe("123");

          // 3. Parent accepts valid numeric character
          digitsEl.value = "1234";
          digitsEl.dispatchEvent(new Event("input", { bubbles: true }));
          expect(digitsEl.value).toBe("1234");
          expect(untrack(() => digits())).toBe("1234");
        }

        if (upperEl) {
          // 4. Parent formats lowercase -> uppercase and DOM reflects formatted string
          upperEl.value = "ab";
          upperEl.dispatchEvent(new Event("input", { bubbles: true }));
          expect(upperEl.value).toBe("AB");
          expect(untrack(() => upper())).toBe("AB");

          upperEl.value = "abc";
          upperEl.dispatchEvent(new Event("input", { bubbles: true }));
          expect(upperEl.value).toBe("ABC");
          expect(untrack(() => upper())).toBe("ABC");
        }
      },
      { scenario: "scenario-11-controlled-input-rejection-and-formatting" },
    );

    expect(artifact).toBeDefined();
    expectNoDiagnostics(artifact);
    expectNoWaste(artifact);
    assertBudget(artifact, { maxSilentHoldMs: 0 });

    dispose();
    container.remove();
  });

  // Scenario 12: Nested <Text as="span"> inherits parent size instead of overriding to md (16px)
  it("Scenario 12: Nested inline <Text as='span'> inherits parent font-size without injecting text--size_md", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const dispose = render(
      () => (
        <Box>
          <Text size="xs" tone="muted" data-testid="parent-xs">
            RECORDS:{" "}
            <Text as="span" weight="bold" tone="default" data-testid="nested-span">
              42
            </Text>
          </Text>
          <Text data-testid="default-block-text">Default block paragraph</Text>
          <Text as="span" size="lg" data-testid="explicit-size-span">
            Explicit inline size
          </Text>
        </Box>
      ),
      container,
    );

    const parentEl = container.querySelector("[data-testid='parent-xs']");
    const nestedSpan = container.querySelector("[data-testid='nested-span']");
    const defaultBlock = container.querySelector("[data-testid='default-block-text']");
    const explicitSpan = container.querySelector("[data-testid='explicit-size-span']");

    expect(parentEl?.classList.contains("text--size_xs")).toBe(true);
    expect(nestedSpan?.tagName).toBe("SPAN");
    expect(nestedSpan?.classList.contains("text--weight_bold")).toBe(true);
    // Must NOT have text--size_md or any size override class so parent xs size is inherited
    expect(nestedSpan?.classList.contains("text--size_md")).toBe(false);
    expect(Array.from(nestedSpan?.classList ?? []).some((c) => c.startsWith("text--size_"))).toBe(
      false,
    );

    // Block <Text> defaults to md; explicit size on span still applies
    expect(defaultBlock?.classList.contains("text--size_md")).toBe(true);
    expect(explicitSpan?.classList.contains("text--size_lg")).toBe(true);

    dispose();
    container.remove();
  });

  // Scenario 13: LiveSpacetimeAdapter clears identity on disconnect and clears error on automatic reconnect
  it("Scenario 13: LiveSpacetimeAdapter resets identity on disconnect, clears errors on automatic reconnect, and dispatches typed reducers", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    let onConnectCb:
      | ((conn: SpacetimeLiveConnectionLike, identity: SpacetimeIdentityLike) => void)
      | null = null;
    let onAutoReconnectCb:
      | ((conn: SpacetimeLiveConnectionLike, identity: SpacetimeIdentityLike) => void)
      | null = null;
    let onDisconnectCb: ((ctx: unknown, error?: Error | null) => void) | null = null;

    const dispatchedReducers: Array<{ action: string; payload: string }> = [];

    const mockConnection: SpacetimeLiveConnectionLike = {
      db: {
        event_log: {
          onInsert() {},
          onUpdate() {},
          onDelete() {},
          removeOnInsert() {},
          removeOnUpdate() {},
          removeOnDelete() {},
          iter: () => [],
        },
      },
      reducers: {
        async txEvent(params) {
          dispatchedReducers.push(params);
        },
      },
      subscriptionBuilder() {
        return {
          onApplied() {
            return {
              subscribe() {
                return {
                  isEnded: () => false,
                  unsubscribe() {},
                };
              },
            };
          },
        };
      },
      disconnect() {},
    };

    const createMockBuilder = (): SpacetimeLiveConnectionBuilderLike => {
      const builder: SpacetimeLiveConnectionBuilderLike = {
        withUri() {
          return builder;
        },
        withDatabaseName() {
          return builder;
        },
        withAutomaticReconnect() {
          return builder;
        },
        withToken() {
          return builder;
        },
        onConnect(cb) {
          onConnectCb = cb;
          return builder;
        },
        onAutomaticReconnect(cb) {
          onAutoReconnectCb = cb;
          return builder;
        },
        onConnectError() {
          return builder;
        },
        onDisconnect(cb) {
          onDisconnectCb = cb;
          return builder;
        },
        build() {
          return mockConnection;
        },
      };
      return builder;
    };

    const liveAdapter = new LiveSpacetimeAdapter({
      uri: "ws://localhost:3001",
      databaseName: "system_db",
      createBuilder: createMockBuilder,
    });

    const observedIdentities: Array<string | null> = [];
    const unsubId = liveAdapter.onIdentityChange((id) => observedIdentities.push(id));

    let spacetimeRef!: ReturnType<typeof useSpacetime>;
    function LiveConsumer() {
      spacetimeRef = useSpacetime();
      return (
        <Box>
          <Text data-testid="live-connected">
            {spacetimeRef.isConnected() ? "connected" : "offline"}
          </Text>
          <Text data-testid="live-identity">{spacetimeRef.clientIdentity()}</Text>
          <Text data-testid="live-error">{spacetimeRef.lastError() ?? "none"}</Text>
        </Box>
      );
    }

    const dispose = render(
      () => (
        <SpacetimeProvider adapter={liveAdapter} initialMode="live">
          <LiveConsumer />
        </SpacetimeProvider>
      ),
      container,
    );

    await Promise.resolve();
    flush();

    const { artifact } = await captureArtifact(
      async () => {
        // 1. Initial live handshake succeeds
        onConnectCb?.(mockConnection, { toHexString: () => "0xabc123" });
        flush();

        expect(liveAdapter.isConnected).toBe(true);
        expect(liveAdapter.identity).toBe("0xabc123");
        expect(liveAdapter.lastError).toBeNull();
        expect(untrack(() => spacetimeRef.isConnected())).toBe(true);
        expect(untrack(() => spacetimeRef.clientIdentity())).toBe("0xabc123");
        expect(untrack(() => spacetimeRef.lastError())).toBeNull();

        // 2. Typed reducer dispatch works without hardcoded strings
        const txResult = await spacetimeRef.reducers.txEvent({
          action: "TX_LIVE_PING",
          payload: "hello-live",
        });
        expect(txResult.status).toBe("committed");
        expect(dispatchedReducers).toEqual([{ action: "TX_LIVE_PING", payload: "hello-live" }]);

        // 3. Socket disconnects with error -> identity cleared to null and listeners notified
        onDisconnectCb?.({}, new Error("WebSocket closed unexpectedly"));
        flush();

        expect(liveAdapter.isConnected).toBe(false);
        expect(liveAdapter.identity).toBeNull();
        expect(liveAdapter.lastError).toBe("WebSocket closed unexpectedly");
        expect(untrack(() => spacetimeRef.isConnected())).toBe(false);
        expect(untrack(() => spacetimeRef.clientIdentity())).toBe("disconnected");
        expect(untrack(() => spacetimeRef.lastError())).toBe("WebSocket closed unexpectedly");

        // 4. Automatic reconnect succeeds -> error state cleared and new identity synced
        onAutoReconnectCb?.(mockConnection, { toHexString: () => "0xdef456" });
        flush();

        expect(liveAdapter.isConnected).toBe(true);
        expect(liveAdapter.identity).toBe("0xdef456");
        expect(liveAdapter.lastError).toBeNull();
        expect(untrack(() => spacetimeRef.isConnected())).toBe(true);
        expect(untrack(() => spacetimeRef.clientIdentity())).toBe("0xdef456");
        expect(untrack(() => spacetimeRef.lastError())).toBeNull();
      },
      { scenario: "scenario-13-live-spacetime-disconnect-reconnect" },
    );

    expect(observedIdentities).toEqual(["0xabc123", null, "0xdef456"]);
    expect(artifact).toBeDefined();
    expectNoDiagnostics(artifact);
    expectNoWaste(artifact);
    assertBudget(artifact, { maxSilentHoldMs: 0 });

    unsubId();
    dispose();
    container.remove();
  });
});
