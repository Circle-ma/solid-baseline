import { createMemo, createSignal, For, Show } from "solid-js";
import { badge, button } from "styled-system/recipes";
import {
  Box,
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
                Solid 2.0 Foundation Architecture
              </Heading>
              <span class={badge({ variant: "subtle" })}>2026 Core</span>
            </HStack>
            <Text size="sm" color="fg.muted" lineHeight="relaxed">
              Universal fullstack template powered by Bun, Vite (Rolldown), Solid 2.0, Ark UI, Panda
              CSS, Park UI, SpacetimeDB, and ConnectRPC.
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
                    <button
                      type="button"
                      class={button({ variant: "outline", size: "sm" })}
                      onClick={() => setCount((c) => c - 1)}
                    >
                      - Decrement
                    </button>
                    <button
                      type="button"
                      class={button({ variant: "solid", size: "sm" })}
                      onClick={() => setCount((c) => c + 1)}
                    >
                      + Increment
                    </button>
                    <button
                      type="button"
                      class={button({ variant: "ghost", size: "sm" })}
                      onClick={() => setCount(0)}
                    >
                      Reset
                    </button>
                  </HStack>
                </VStack>
              </Card.Body>
            </Card.Root>

            {/* Card 2: Headless State Machines */}
            <Card.Root>
              <Card.Header>
                <Card.Title>Ark UI & Park UI</Card.Title>
                <Card.Description>
                  Accessible primitives powered by Zag.js state machines.
                </Card.Description>
              </Card.Header>
              <Card.Body>
                <VStack gap="4" alignItems="flex-start">
                  <Text size="sm" color="fg.muted">
                    Triggers are polymorphic elements. Systematic component encapsulation with
                    baked-in padding.
                  </Text>

                  <Dialog.Root lazyMount unmountOnExit>
                    <Dialog.Trigger class={button({ variant: "outline" })}>
                      Open Accessible Dialog
                    </Dialog.Trigger>

                    <Dialog.Portal>
                      <Dialog.Backdrop />
                      <Dialog.Positioner>
                        <Dialog.Content>
                          {/* Built-in top-right close trigger */}
                          <Dialog.CloseTrigger />

                          <Dialog.Header>
                            <Dialog.Title>Zag.js State Machine</Dialog.Title>
                            <Dialog.Description>
                              Encapsulated modal architecture powered by Zag.js and Park UI design
                              tokens.
                            </Dialog.Description>
                          </Dialog.Header>

                          <Dialog.Body>
                            <Text size="sm">
                              This modal systematically bakes in 24px container padding, responsive
                              max-width, focus restoration, and keyboard Escape dismissal with zero
                              ghost overlays.
                            </Text>
                          </Dialog.Body>

                          <Dialog.Footer>
                            <Dialog.CloseTrigger class={button({ variant: "outline", size: "sm" })}>
                              Cancel
                            </Dialog.CloseTrigger>
                            <Dialog.CloseTrigger class={button({ variant: "solid", size: "sm" })}>
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

          {/* Card 3: SpacetimeDB Realtime Table & Reducers */}
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
                  <span class={badge({ variant: isConnected() ? "solid" : "subtle" })}>
                    {connectionMode() === "live" ? "Live WebSocket" : "Reactive Local Cache"}
                  </span>
                  <span class={badge({ variant: "outline" })}>{clientIdentity()}</span>
                </HStack>
              </HStack>
            </Card.Header>

            <Card.Body>
              <VStack gap="4" alignItems="stretch">
                {/* Action Bar */}
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
                  <button
                    type="button"
                    class={button({ variant: "solid", size: "sm" })}
                    onClick={() =>
                      callReducer({
                        action: "TX_EVENT",
                        payload: `Mutation @ ${new Date().toLocaleTimeString()}`,
                      })
                    }
                  >
                    ⚡ Dispatch Reducer
                  </button>
                </HStack>

                {/* Table Feed */}
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
                          <span class={badge({ variant: "outline", size: "sm" })}>
                            {record.action}
                          </span>
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
