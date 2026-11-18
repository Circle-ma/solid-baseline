import { createMemo, Errored, For, Show } from "solid-js";
import { css } from "styled-system/css";
import {
  AsyncBoundary,
  Badge,
  Button,
  Card,
  Code,
  HStack,
  Icon,
  Text,
  VStack,
} from "~/components/ui";
import {
  createHealthCheckQuery,
  SpacetimeProvider,
  useOptionalSpacetime,
  useSpacetime,
} from "~/lib";
import {
  type HealthCheckQueryResult,
  type HealthCheckRequest,
  HealthCheckStatus,
  type RpcQueryHandle,
} from "~/schema";

type HealthQueryHandle = RpcQueryHandle<Partial<HealthCheckRequest>, HealthCheckQueryResult>;

const toolbarBarClass = css({
  justifyContent: "space-between",
  p: "3",
  bg: "bg.subtle",
  borderRadius: "l2",
});

const resultPanelClass = css({
  justifyContent: "space-between",
  p: "3",
  bg: "bg.canvas",
  borderRadius: "l2",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.subtle",
});

const eventLogListClass = css({
  maxH: "48",
  overflowY: "auto",
  p: "2",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.subtle",
  borderRadius: "l2",
});

const eventLogItemClass = css({
  justifyContent: "space-between",
  p: "2",
  bg: "bg.canvas",
  borderRadius: "l1",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.subtle",
});

function formatUtcTimestamp(isoTimestamp: string): string {
  const parsed = new Date(isoTimestamp);
  if (Number.isNaN(parsed.getTime())) {
    return isoTimestamp;
  }
  return `${parsed.toISOString().slice(11, 19)} UTC`;
}

function HealthCheckStatusBadgeContent(props: { query: HealthQueryHandle }) {
  const status = createMemo(() => props.query.data()?.response.status ?? null, {
    name: "rpc-health-status",
  });

  return (
    <Badge
      variant="subtle"
      intent={
        status() === HealthCheckStatus.SERVING
          ? "success"
          : status() !== null
            ? "danger"
            : "default"
      }
    >
      {status() !== null
        ? `Status: ${status() === HealthCheckStatus.SERVING ? "SERVING" : "NOT_SERVING"}`
        : "Uncalled"}
    </Badge>
  );
}

function HealthCheckStatusBadge(props: { query: HealthQueryHandle }) {
  return (
    <Errored
      fallback={() => (
        <Badge variant="subtle" intent="danger">
          Status: ERROR
        </Badge>
      )}
    >
      <HealthCheckStatusBadgeContent query={props.query} />
    </Errored>
  );
}

function HealthCheckResultPanel(props: { query: HealthQueryHandle }) {
  return (
    <Show when={props.query.data()}>
      {(result) => (
        <HStack class={resultPanelClass}>
          <HStack gap="2" alignItems="center">
            <Badge
              variant="solid"
              intent={result().response.status === HealthCheckStatus.SERVING ? "success" : "danger"}
              size="sm"
            >
              {result().response.status === HealthCheckStatus.SERVING ? "SERVING" : "NOT_SERVING"}
            </Badge>
            <Text size="xs" tone="muted">
              Version: {result().response.version}
            </Text>
            <Text size="xs" tone="accent" tabular>
              ({result().latencyMs}ms)
            </Text>
          </HStack>
          <Text size="xs" tone="muted" tabular>
            Uptime: {result().response.uptimeSeconds}s
          </Text>
        </HStack>
      )}
    </Show>
  );
}

function RealtimeView() {
  const spacetime = useSpacetime();
  const healthQuery = createHealthCheckQuery();

  return (
    <VStack as="section" gap="6" alignItems="stretch">
      {/* SpacetimeDB Realtime Engine */}
      <Card.Root>
        <Card.Header>
          <HStack justifyContent="space-between" alignItems="center">
            <VStack gap="1" alignItems="flex-start">
              <Card.Title>SpacetimeDB Realtime Engine</Card.Title>
              <Card.Description>
                Schema-first in-memory relational cache with transactional reducers.
              </Card.Description>
            </VStack>
            <HStack gap="2" alignItems="center">
              <Badge variant="subtle" intent={spacetime.isConnected() ? "success" : "warning"}>
                {spacetime.connectionMode() === "live" ? "Live WebSocket" : "Reactive Local Cache"}
              </Badge>
              <Badge variant="outline" intent="default">
                {spacetime.clientIdentity()}
              </Badge>
            </HStack>
          </HStack>
        </Card.Header>

        <Card.Body>
          <VStack gap="4" alignItems="stretch">
            <HStack class={toolbarBarClass}>
              <HStack gap="4" alignItems="center">
                <Text size="xs" tone="muted">
                  RECORDS:{" "}
                  <Text as="span" weight="bold" tone="default" tabular>
                    {spacetime.records.length}
                  </Text>
                </Text>
                <Show when={spacetime.latencyMs() !== null}>
                  <Text size="xs" tone="accent">
                    LATENCY:{" "}
                    <Text as="span" weight="bold" tabular>
                      {spacetime.latencyMs()}ms
                    </Text>
                  </Text>
                </Show>
              </HStack>
              <HStack gap="2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => spacetime.toggleSimulationMode()}
                >
                  {spacetime.connectionMode() === "live" ? "Use Local Cache" : "Connect Live"}
                </Button>
                <Button variant="danger" size="sm" onClick={() => spacetime.clearRecords()}>
                  Clear Store
                </Button>
                <Button
                  variant="solid"
                  size="sm"
                  onClick={() => {
                    void spacetime.reducers.txEvent({
                      action: "TX_EVENT",
                      payload: `Mutation @ ${new Date().toISOString()}`,
                    });
                  }}
                >
                  <Icon size="sm">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </Icon>
                  Dispatch Reducer
                </Button>
              </HStack>
            </HStack>

            <Show when={spacetime.lastError()}>
              {(errMsg) => (
                <Text size="xs" tone="danger">
                  SpacetimeDB Error: {errMsg()}
                </Text>
              )}
            </Show>

            <VStack
              as="ul"
              aria-label="Realtime event log"
              aria-live="polite"
              gap="2"
              class={eventLogListClass}
            >
              <For
                each={spacetime.records}
                fallback={
                  <Text size="xs" tone="muted">
                    No event records in store. Dispatch a reducer to populate.
                  </Text>
                }
              >
                {(record) => (
                  <HStack as="li" class={eventLogItemClass}>
                    <HStack gap="2" alignItems="center">
                      <Badge variant="outline" intent="default" size="sm">
                        {record.action}
                      </Badge>
                      <Badge variant="subtle" intent="default" size="sm" title={record.sender}>
                        {record.sender.slice(0, 12)}
                      </Badge>
                      <Text size="xs" weight="medium" tone="default">
                        {record.payload}
                      </Text>
                    </HStack>
                    <Code size="xs" tone="muted" tabular title={record.timestamp}>
                      {formatUtcTimestamp(record.timestamp)}
                    </Code>
                  </HStack>
                )}
              </For>
            </VStack>
          </VStack>
        </Card.Body>
      </Card.Root>

      {/* ConnectRPC Declarative Async Query Pipeline */}
      <Card.Root>
        <Card.Header>
          <HStack justifyContent="space-between" alignItems="center">
            <VStack gap="1" alignItems="flex-start">
              <Card.Title>ConnectRPC Client Pipeline</Card.Title>
              <Card.Description>
                Type-safe Protobuf and JSON RPC via Solid 2.0 declarative async memos and
                AsyncBoundary.
              </Card.Description>
            </VStack>
            <HealthCheckStatusBadge query={healthQuery} />
          </HStack>
        </Card.Header>

        <Card.Body>
          <VStack gap="4" alignItems="stretch">
            <HStack class={toolbarBarClass}>
              <HStack gap="4" alignItems="center">
                <Text size="xs" tone="muted">
                  SERVICE:{" "}
                  <Text as="span" weight="bold" tone="default">
                    system.v1.SystemService
                  </Text>
                </Text>
                <Show when={healthQuery.isPending()}>
                  <Badge variant="subtle" intent="info" size="sm">
                    In Flight
                  </Badge>
                </Show>
              </HStack>
              <Button
                variant="solid"
                size="sm"
                disabled={healthQuery.isPending()}
                onClick={() => {
                  void healthQuery
                    .execute({ service: "system.v1.SystemService" })
                    .catch(() => undefined);
                }}
              >
                <Icon size="sm">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </Icon>
                {healthQuery.isPending() ? "Calling RPC..." : "Invoke HealthCheck RPC"}
              </Button>
            </HStack>

            <AsyncBoundary
              onRetry={() => {
                void healthQuery.refresh().catch(() => undefined);
              }}
            >
              <HealthCheckResultPanel query={healthQuery} />
            </AsyncBoundary>
          </VStack>
        </Card.Body>
      </Card.Root>
    </VStack>
  );
}

/**
 * Route-scoped Realtime & Telemetry view.
 * Self-provisions `<SpacetimeProvider>` at the `/realtime` boundary so routes like `/`
 * incur zero SpacetimeDB initialization overhead, while still honoring an enclosing
 * provider injected by tests.
 */
export default function Realtime() {
  const existingSpacetime = useOptionalSpacetime();
  return (
    <>
      {existingSpacetime ? (
        <RealtimeView />
      ) : (
        <SpacetimeProvider>
          <RealtimeView />
        </SpacetimeProvider>
      )}
    </>
  );
}
