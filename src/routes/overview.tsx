import { createMemo, createSignal } from "solid-js";
import { Button, Card, Dialog, Grid, HStack, Text, VStack } from "~/components/ui";

export default function Overview() {
  const [count, setCount] = createSignal(0);
  const double = createMemo(() => count() * 2);

  return (
    <VStack gap="6" alignItems="stretch">
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
    </VStack>
  );
}
