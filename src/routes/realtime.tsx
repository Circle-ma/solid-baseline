import { createMemo, For, Show } from "solid-js";
import { Badge, Button, Card, Code, HStack, Text, VStack } from "~/components/ui";
import { useTelemetry } from "~/lib";

export default function Realtime() {
  const telemetry = useTelemetry();
  const rpcStatus = createMemo(() => telemetry.rpcResponse()?.status ?? null, {
    name: "rpc-status",
  });

  return (
    <VStack gap="6" alignItems="stretch">
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
              <Badge variant="subtle" intent={telemetry.isConnected() ? "success" : "warning"}>
                {telemetry.connectionMode() === "live" ? "Live WebSocket" : "Reactive Local Cache"}
              </Badge>
              <Badge variant="outline" intent="default">
                {telemetry.clientIdentity()}
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
                    {telemetry.records.length}
                  </Text>
                </Text>
                <Show when={telemetry.latencyMs() !== null}>
                  <Text size="xs" tone="accent">
                    LATENCY:{" "}
                    <Text as="span" weight="bold" tabular>
                      {telemetry.latencyMs()}ms
                    </Text>
                  </Text>
                </Show>
              </HStack>
              <HStack gap="2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => telemetry.toggleSimulationMode()}
                >
                  {telemetry.isConnected() ? "Disconnect" : "Simulate Live"}
                </Button>
                <Button variant="danger" size="sm" onClick={() => telemetry.clearRecords()}>
                  Clear Store
                </Button>
                <Button
                  variant="solid"
                  size="sm"
                  onClick={() =>
                    telemetry.callReducer({
                      action: "TX_EVENT",
                      payload: `Mutation @ ${new Date().toLocaleTimeString()}`,
                    })
                  }
                >
                  ⚡ Dispatch Reducer
                </Button>
              </HStack>
            </HStack>

            <VStack
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
                each={telemetry.records}
                fallback={
                  <Text size="xs" tone="muted">
                    No event records in store. Dispatch a reducer to populate.
                  </Text>
                }
              >
                {(record) => (
                  <HStack
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

      {/* ConnectRPC Service Integration */}
      <Card.Root>
        <Card.Header>
          <HStack justifyContent="space-between" alignItems="center">
            <VStack gap="1" alignItems="flex-start">
              <Card.Title>ConnectRPC Client Pipeline</Card.Title>
              <Card.Description>
                Type-safe Protobuf and JSON RPC over standard HTTP/1.1 and HTTP/2 fetch.
              </Card.Description>
            </VStack>
            <Badge
              variant="subtle"
              intent={rpcStatus() === "SERVING" ? "success" : rpcStatus() ? "danger" : "default"}
            >
              {rpcStatus() ? `Status: ${rpcStatus()}` : "Uncalled"}
            </Badge>
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
                <Show when={telemetry.rpcLatencyMs() !== null}>
                  <Text size="xs" tone="accent">
                    LATENCY:{" "}
                    <Text as="span" weight="bold" tabular>
                      {telemetry.rpcLatencyMs()}ms
                    </Text>
                  </Text>
                </Show>
              </HStack>
              <Button
                variant="solid"
                size="sm"
                disabled={telemetry.isRpcPending()}
                onClick={() => telemetry.checkSystemHealth()}
              >
                {telemetry.isRpcPending() ? "Calling RPC..." : "📡 Invoke HealthCheck RPC"}
              </Button>
            </HStack>

            <Show when={telemetry.rpcResponse()}>
              {(res) => (
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
                      intent={res().status === "SERVING" ? "success" : "danger"}
                      size="sm"
                    >
                      {res().status}
                    </Badge>
                    <Text size="xs" tone="muted">
                      Version: {res().version}
                    </Text>
                  </HStack>
                  <Text size="xs" tone="muted" tabular>
                    Uptime: {res().uptimeSeconds}s
                  </Text>
                </HStack>
              )}
            </Show>
          </VStack>
        </Card.Body>
      </Card.Root>
    </VStack>
  );
}
