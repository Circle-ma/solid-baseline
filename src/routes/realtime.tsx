import { For, Show } from "solid-js";
import { Badge, Button, Card, Code, HStack, Text, VStack } from "~/components/ui";
import { checkSystemHealth, isRpcPending, rpcLatencyMs, rpcResponse } from "~/lib/connect";
import {
  callReducer,
  clientIdentity,
  connectionMode,
  isConnected,
  latencyMs,
  records,
} from "~/lib/spacetime";

export default function Realtime() {
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
              <Badge variant={isConnected() ? "solid" : "subtle"}>
                {connectionMode() === "live" ? "Live WebSocket" : "Reactive Local Cache"}
              </Badge>
              <Badge variant="outline">{clientIdentity()}</Badge>
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
                <Text size="xs" color="fg.muted">
                  RECORDS:{" "}
                  <Text as="span" fontWeight="bold" color="fg.default">
                    {records.length}
                  </Text>
                </Text>
                <Show when={latencyMs() !== null}>
                  <Text size="xs" color="accent.default">
                    LATENCY:{" "}
                    <Text as="span" fontWeight="bold">
                      {latencyMs()}ms
                    </Text>
                  </Text>
                </Show>
              </HStack>
              <Button
                variant="solid"
                size="sm"
                onClick={() =>
                  callReducer({
                    action: "TX_EVENT",
                    payload: `Mutation @ ${new Date().toLocaleTimeString()}`,
                  })
                }
              >
                ⚡ Dispatch Reducer
              </Button>
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
              <For each={records}>
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
                      <Badge variant="outline" size="sm">
                        {record.action}
                      </Badge>
                      <Text size="xs" fontWeight="medium" color="fg.default">
                        {record.payload}
                      </Text>
                    </HStack>
                    <Code size="xs" color="fg.muted">
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
            <Badge variant={rpcResponse() ? "solid" : "subtle"}>
              {rpcResponse() ? `Status: ${rpcResponse()?.status}` : "Uncalled"}
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
                <Text size="xs" color="fg.muted">
                  SERVICE:{" "}
                  <Text as="span" fontWeight="bold" color="fg.default">
                    system.v1.SystemService
                  </Text>
                </Text>
                <Show when={rpcLatencyMs() !== null}>
                  <Text size="xs" color="accent.default">
                    LATENCY:{" "}
                    <Text as="span" fontWeight="bold">
                      {rpcLatencyMs()}ms
                    </Text>
                  </Text>
                </Show>
              </HStack>
              <Button
                variant="solid"
                size="sm"
                disabled={isRpcPending()}
                onClick={() => checkSystemHealth()}
              >
                {isRpcPending() ? "Calling RPC..." : "📡 Invoke HealthCheck RPC"}
              </Button>
            </HStack>

            <Show when={rpcResponse()}>
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
                    <Badge variant="solid" size="sm">
                      {res().status}
                    </Badge>
                    <Text size="xs" color="fg.muted">
                      Version: {res().version}
                    </Text>
                  </HStack>
                  <Text size="xs" color="fg.muted">
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
