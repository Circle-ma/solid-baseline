import { createMemo, For, isPending, Show } from "solid-js";
import { AsyncBoundary, Badge, Button, Card, Code, HStack, Text, VStack } from "~/components/ui";
import { useRpc, useSpacetime } from "~/lib";
import { HealthCheckStatus } from "~/schema";

function HealthCheckStatusBadge() {
  const rpc = useRpc();
  const status = createMemo(() => rpc.healthQuery()?.response.status ?? null, {
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

function HealthCheckResultPanel() {
  const rpc = useRpc();

  return (
    <Show when={rpc.healthQuery()}>
      {(result) => (
        <HStack
          justifyContent="space-between"
          alignItems="center"
          p="3"
          bg="bg.canvas"
          borderRadius="l2"
          borderWidth="1px"
          borderStyle="solid"
          borderColor="border.subtle"
        >
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

export default function Realtime() {
  const spacetime = useSpacetime();
  const rpc = useRpc();
  const isHealthPending = createMemo(() => isPending(() => rpc.healthQuery()), {
    name: "rpc-health-pending",
  });

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
            <HStack
              justifyContent="space-between"
              alignItems="center"
              p="3"
              bg="bg.subtle"
              borderRadius="l2"
            >
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
                  {spacetime.isConnected() ? "Disconnect" : "Simulate Live"}
                </Button>
                <Button variant="danger" size="sm" onClick={() => spacetime.clearRecords()}>
                  Clear Store
                </Button>
                <Button
                  variant="solid"
                  size="sm"
                  onClick={() => {
                    void spacetime.callReducer({
                      action: "TX_EVENT",
                      payload: `Mutation @ ${new Date().toLocaleTimeString()}`,
                    });
                  }}
                >
                  ⚡ Dispatch Reducer
                </Button>
              </HStack>
            </HStack>

            <VStack
              as="ul"
              gap="2"
              alignItems="stretch"
              maxH="48"
              overflowY="auto"
              borderWidth="1px"
              borderStyle="solid"
              borderColor="border.subtle"
              borderRadius="l2"
              p="2"
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
                  <HStack
                    as="li"
                    justifyContent="space-between"
                    alignItems="center"
                    p="2"
                    bg="bg.canvas"
                    borderRadius="sm"
                    borderWidth="1px"
                    borderStyle="solid"
                    borderColor="border.subtle"
                  >
                    <HStack gap="2" alignItems="center">
                      <Badge variant="outline" intent="default" size="sm">
                        {record.action}
                      </Badge>
                      <Text size="xs" weight="medium" tone="default">
                        {record.payload}
                      </Text>
                    </HStack>
                    <Code size="xs" tone="muted" tabular>
                      {record.timestamp}
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
        <AsyncBoundary>
          <Card.Header>
            <HStack justifyContent="space-between" alignItems="center">
              <VStack gap="1" alignItems="flex-start">
                <Card.Title>ConnectRPC Client Pipeline</Card.Title>
                <Card.Description>
                  Type-safe Protobuf and JSON RPC via Solid 2.0 declarative async memos and
                  AsyncBoundary.
                </Card.Description>
              </VStack>
              <HealthCheckStatusBadge />
            </HStack>
          </Card.Header>

          <Card.Body>
            <VStack gap="4" alignItems="stretch">
              <HStack
                justifyContent="space-between"
                alignItems="center"
                p="3"
                bg="bg.subtle"
                borderRadius="l2"
              >
                <HStack gap="4" alignItems="center">
                  <Text size="xs" tone="muted">
                    SERVICE:{" "}
                    <Text as="span" weight="bold" tone="default">
                      system.v1.SystemService
                    </Text>
                  </Text>
                  <Show when={isHealthPending()}>
                    <Badge variant="subtle" intent="info" size="sm">
                      In Flight
                    </Badge>
                  </Show>
                </HStack>
                <Button
                  variant="solid"
                  size="sm"
                  disabled={isHealthPending()}
                  onClick={() => {
                    void rpc.refreshHealth().catch(() => undefined);
                  }}
                >
                  {isHealthPending() ? "Calling RPC..." : "📡 Invoke HealthCheck RPC"}
                </Button>
              </HStack>

              <HealthCheckResultPanel />
            </VStack>
          </Card.Body>
        </AsyncBoundary>
      </Card.Root>
    </VStack>
  );
}
