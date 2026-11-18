import { createMemo, createSignal } from "solid-js";
import { css } from "styled-system/css";
import { Button, Card, Dialog, Grid, HStack, Input, Text, VStack } from "~/components/ui";

const metricSummaryBarClass = css({
  justifyContent: "space-between",
  p: "4",
  bg: "bg.subtle",
  borderRadius: "l2",
});

export default function Overview() {
  const [count, setCount] = createSignal(0, { name: "counter-value" });
  const double = createMemo(() => count() * 2, { name: "counter-double" });
  const [inputText, setInputText] = createSignal("Solid 2.0 Paved Path", {
    name: "overview-input-text",
  });

  return (
    <VStack as="section" gap="6" alignItems="stretch">
      <Grid columns={{ base: 1, md: 2 }} gap="6">
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
              <HStack class={metricSummaryBarClass}>
                <VStack gap="1" alignItems="flex-start">
                  <Text size="xs" tone="muted">
                    COUNTER SIGNAL
                  </Text>
                  <Text size="2xl" weight="bold" tabular>
                    {count()}
                  </Text>
                </VStack>
                <VStack gap="1" alignItems="flex-end">
                  <Text size="xs" tone="muted">
                    DERIVED MEMO (2x)
                  </Text>
                  <Text size="2xl" weight="bold" tone="accent" tabular>
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

              <VStack gap="2" alignItems="stretch" py="1">
                <Text as="label" for="overview-controlled-input" size="xs" tone="muted">
                  CONTROLLED INPUT PRIMITIVE
                </Text>
                <HStack gap="2" alignItems="center">
                  <Input
                    id="overview-controlled-input"
                    aria-label="Controlled input primitive"
                    value={inputText()}
                    onValueChange={setInputText}
                    placeholder="Type to test controlled synchronization..."
                  />
                  <Button variant="ghost" size="sm" onClick={() => setInputText("")}>
                    Clear
                  </Button>
                </HStack>
                <HStack gap="2" alignItems="center">
                  <Text size="xs" tone="muted">
                    State Echo:
                  </Text>
                  <Text size="xs" weight="medium">
                    {inputText()}
                  </Text>
                </HStack>
              </VStack>
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
              <Text size="sm" tone="muted">
                Triggers are polymorphic elements. Autonomous physical DOM teardown on ESC or
                dismissal with zero ghost overlays.
              </Text>

              <Dialog.Root lazyMount unmountOnExit>
                <Dialog.Trigger variant="outline">Open Accessible Dialog</Dialog.Trigger>

                <Dialog.Portal>
                  <Dialog.Backdrop />
                  <Dialog.Positioner>
                    <Dialog.Content>
                      <Dialog.CloseButton />

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
                        <VStack gap="2" alignItems="stretch" py="1">
                          <Text as="label" for="dialog-uncontrolled-input" size="xs" tone="muted">
                            Interactive Uncontrolled Dialog Input
                          </Text>
                          <Input
                            id="dialog-uncontrolled-input"
                            aria-label="Interactive uncontrolled dialog input"
                            size="sm"
                            defaultValue=""
                            placeholder="Modal encapsulated input..."
                          />
                        </VStack>
                      </Dialog.Body>

                      <Dialog.Footer>
                        <Dialog.CloseTrigger
                          asChild={(triggerProps) => (
                            <Button {...triggerProps()} variant="outline" size="sm">
                              Cancel
                            </Button>
                          )}
                        />
                        <Dialog.CloseTrigger
                          asChild={(triggerProps) => (
                            <Button {...triggerProps()} variant="solid" size="sm">
                              Confirm & Close
                            </Button>
                          )}
                        />
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
