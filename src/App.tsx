import { createMemo, createSignal, For, Show } from "solid-js";
import "./index.css";
import {
  Badge,
  Box,
  Button,
  Card,
  Code,
  Container,
  Dialog,
  Divider,
  Grid,
  Heading,
  HStack,
  Text,
  VStack,
} from "~/components/ui";
import { checkSystemHealth, isRpcPending, rpcLatencyMs, rpcResponse } from "~/lib/connect";
import {
  callReducer,
  clientIdentity,
  connectionMode,
  isConnected,
  latencyMs,
  records,
} from "~/lib/spacetime";

export default function App() {
  // Fine-grained reactive counter
  const [count, setCount] = createSignal(0);
  const double = createMemo(() => count() * 2);

  return (
    <Box minH="100vh" bg="bg.canvas" color="fg.default" p="12">
      <Container maxW="4xl" p="0">
        <VStack gap="8" alignItems="stretch">
          {/* Header */}
          <VStack gap="3" alignItems="stretch">
            <HStack gap="3" alignItems="center">
              <Heading as="h1" size="2xl" letterSpacing="tight">
                Solid 2.0 Baseline Architecture
              </Heading>
              <Badge variant="subtle">2026 Core</Badge>
            </HStack>
            <Text size="sm" color="fg.muted" lineHeight="relaxed">
              High-performance, type-safe SPA starter engineered with Bun, Vite, Solid 2.0, Ark UI,
              Panda CSS, SpacetimeDB, ConnectRPC, Oxlint, and Biome.
            </Text>
          </VStack>

          <Divider borderColor="border.subtle" />

          {/* Feature Grid */}
          <Grid columns={2} gap="6">
            {/* Card 1: Fine-Grained Reactivity */}
            <Card.Root>
              <Card.Header>
                <Card.Title>Fine-Grained Reactivity</Card.Title>
                <Card.Description>
                  Zero VDOM. Signals update specific DOM nodes directly.
                </Card.Description>
              </Card.Header>
              <Card.Body>
                <VStack gap="4" alignItems="stretch">
                  <HStack
                    justifyContent="space-between"
                    alignItems="center"
                    p="4"
                    bg="bg.subtle"
                    borderRadius="l2"
                  >
                    <VStack gap="1" alignItems="flex-start">
                      <Text size="xs" color="fg.muted">
                        COUNTER SIGNAL
                      </Text>
                      <Text size="2xl" fontWeight="bold">
                        {count()}
                      </Text>
                    </VStack>
                    <VStack gap="1" alignItems="flex-end">
                      <Text size="xs" color="fg.muted">
                        DERIVED MEMO (2x)
                      </Text>
                      <Text size="2xl" fontWeight="bold" color="accent.default">
                        {double()}
                      </Text>
                    </VStack>
                  </HStack>

                  <HStack gap="2">
                    <Button variant="outline" size="sm" onClick={() => setCount((c) => c - 1)}>
                      - Decrement
                    </Button>
                    <Button variant="solid" size="sm" onClick={() => setCount((c) => c + 1)}>
                      + Increment
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setCount(0)}>
                      Reset
                    </Button>
                  </HStack>
                </VStack>
              </Card.Body>
            </Card.Root>

            {/* Card 2: Headless State Machines */}
            <Card.Root>
              <Card.Header>
                <Card.Title>Ark UI Headless Modal</Card.Title>
                <Card.Description>
                  Accessible primitives powered by Zag.js state machines.
                </Card.Description>
              </Card.Header>
              <Card.Body>
                <VStack gap="4" alignItems="flex-start">
                  <Text size="sm" color="fg.muted">
                    Triggers are polymorphic elements. Autonomous physical DOM teardown on ESC or
                    dismissal with zero ghost overlays.
                  </Text>

                  <Dialog.Root lazyMount unmountOnExit>
                    <Dialog.Trigger variant="outline">Open Accessible Dialog</Dialog.Trigger>

                    <Dialog.Portal>
                      <Dialog.Backdrop />
                      <Dialog.Positioner>
                        <Dialog.Content>
                          <Dialog.CloseTrigger />

                          <Dialog.Header>
                            <Dialog.Title>Zag.js State Machine</Dialog.Title>
                            <Dialog.Description>
                              Encapsulated modal architecture powered by Zag.js and Panda CSS design
                              tokens.
                            </Dialog.Description>
                          </Dialog.Header>

                          <Dialog.Body>
                            <Text size="sm">
                              This modal encapsulates container padding, responsive max-width, focus
                              restoration, and keyboard Escape dismissal.
                            </Text>
                          </Dialog.Body>

                          <Dialog.Footer>
                            <Dialog.CloseTrigger variant="outline" size="sm">
                              Cancel
                            </Dialog.CloseTrigger>
                            <Dialog.CloseTrigger variant="solid" size="sm">
                              Confirm & Close
                            </Dialog.CloseTrigger>
                          </Dialog.Footer>
                        </Dialog.Content>
                      </Dialog.Positioner>
                    </Dialog.Portal>
                  </Dialog.Root>
                </VStack>
              </Card.Body>
            </Card.Root>
          </Grid>

          {/* Card 3: SpacetimeDB Realtime Engine */}
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

          {/* Card 4: ConnectRPC Service Integration */}
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

          <Divider borderColor="border.subtle" />

          {/* Footer */}
          <HStack justifyContent="space-between" alignItems="center">
            <Text size="xs" color="fg.muted">
              Systematic UI Primitives · Container Layout · Schema SSOT
            </Text>
            <Text size="xs" color="fg.muted">
              Verified with Oxlint & Biome
            </Text>
          </HStack>
        </VStack>
      </Container>
    </Box>
  );
}
