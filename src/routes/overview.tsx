import { createMemo, createSignal, Show } from "solid-js";
import { css } from "styled-system/css";
import {
  Badge,
  Box,
  Button,
  Card,
  Code,
  Dialog,
  Divider,
  Grid,
  Heading,
  HStack,
  Icon,
  Input,
  Link,
  Skeleton,
  Text,
  Textarea,
  VStack,
} from "~/components/ui";

const metricSummaryBarClass = css({
  justifyContent: "space-between",
  p: "4",
  bg: "bg.subtle",
  borderRadius: "l2",
});

const emptyStateIconBoxClass = css({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  w: "9",
  h: "9",
  borderRadius: "l2",
  bg: "bg.default",
  color: "fg.muted",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.subtle",
});

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SUMMARY_LENGTH = 120;

export default function Overview() {
  // Fine-grained counter & derived memo
  const [count, setCount] = createSignal(0, { name: "counter-value" });
  const double = createMemo(() => count() * 2, { name: "counter-double" });

  // Accessible form validation state (controlled Input + Textarea vs. uncontrolled Input)
  const [slug, setSlug] = createSignal("solid-baseline", { name: "overview-slug" });
  const [slugTouched, setSlugTouched] = createSignal(false, { name: "overview-slug-touched" });
  const [summary, setSummary] = createSignal(
    "Zero-VDOM UI primitives with Panda CSS 2.5 design tokens.",
    { name: "overview-summary" },
  );
  const [summaryTouched, setSummaryTouched] = createSignal(false, {
    name: "overview-summary-touched",
  });
  const [submitted, setSubmitted] = createSignal(false, { name: "overview-form-submitted" });
  const [savedNotice, setSavedNotice] = createSignal<string | null>(null, {
    name: "overview-saved-notice",
  });

  // Dialog interaction & preview state
  const [dialogDraft, setDialogDraft] = createSignal("", { name: "overview-dialog-draft" });
  const [lastDialogAction, setLastDialogAction] = createSignal<string | null>(null, {
    name: "overview-last-dialog-action",
  });
  const [previewState, setPreviewState] = createSignal<"skeleton" | "empty">("skeleton", {
    name: "overview-preview-state",
  });

  const slugError = createMemo(
    () => {
      const value = slug().trim();
      if (value.length < 3) return "Slug must be at least 3 characters.";
      if (!SLUG_PATTERN.test(value)) {
        return "Use lowercase letters, numbers, and single hyphens only.";
      }
      return null;
    },
    { name: "overview-slug-error" },
  );

  const summaryError = createMemo(
    () => {
      const value = summary().trim();
      if (value.length === 0) return "Release summary is required.";
      if (value.length > MAX_SUMMARY_LENGTH) {
        return `Keep summary under ${MAX_SUMMARY_LENGTH} characters.`;
      }
      return null;
    },
    { name: "overview-summary-error" },
  );

  const showSlugError = createMemo(() => (slugTouched() || submitted()) && slugError() !== null, {
    name: "overview-show-slug-error",
  });
  const showSummaryError = createMemo(
    () => (summaryTouched() || submitted()) && summaryError() !== null,
    { name: "overview-show-summary-error" },
  );

  const handleFormSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setSlugTouched(true);
    setSummaryTouched(true);

    if (slugError() || summaryError()) {
      setSavedNotice(null);
      return;
    }

    setSavedNotice(`Validated "${slug()}" (${summary().trim().length} chars)`);
  };

  const handleFormReset = () => {
    setSlug("solid-baseline");
    setSummary("Zero-VDOM UI primitives with Panda CSS 2.5 design tokens.");
    setSlugTouched(false);
    setSummaryTouched(false);
    setSubmitted(false);
    setSavedNotice(null);
  };

  return (
    <VStack as="section" gap="6" alignItems="stretch">
      <Grid columns={{ base: 1, md: 2 }} gap="6">
        {/* Card 1: Elevated Form Validation + Fine-Grained Reactivity */}
        <Card.Root variant="elevated">
          <Card.Header>
            <HStack justifyContent="space-between" alignItems="center">
              <Card.Title>Forms &amp; Fine-Grained Signals</Card.Title>
              <Badge variant="subtle" intent={savedNotice() ? "success" : "default"}>
                {savedNotice() ? "Validated" : "Interactive"}
              </Badge>
            </HStack>
            <Card.Description>
              Zero-VDOM reactivity paired with accessible post-interaction validation and controlled
              vs. uncontrolled input synchronization.
            </Card.Description>
          </Card.Header>

          <Card.Body>
            <VStack gap="5" alignItems="stretch">
              {/* Fine-Grained Counter & Derived Memo */}
              <VStack gap="3" alignItems="stretch">
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
              </VStack>

              <Divider color="border.subtle" />

              {/* Systematic Accessible Form Validation */}
              <VStack as="form" novalidate gap="4" alignItems="stretch" onSubmit={handleFormSubmit}>
                <VStack gap="1.5" alignItems="stretch">
                  <HStack justifyContent="space-between" alignItems="center">
                    <Text as="label" for="overview-slug-input" size="xs" weight="medium">
                      Workspace Slug (Controlled)
                    </Text>
                    <Code size="xs" tone="muted">
                      {slug() || "(empty)"}
                    </Code>
                  </HStack>
                  <Input
                    id="overview-slug-input"
                    value={slug()}
                    invalid={showSlugError()}
                    aria-invalid={showSlugError() ? "true" : "false"}
                    aria-describedby={showSlugError() ? "overview-slug-error" : undefined}
                    onValueChange={(next) => {
                      setSlug(next.toLowerCase().replace(/\s+/g, "-"));
                      setSavedNotice(null);
                    }}
                    onBlur={() => setSlugTouched(true)}
                    placeholder="e.g. solid-baseline"
                  />
                  <Show when={showSlugError()}>
                    <Text id="overview-slug-error" size="xs" tone="danger">
                      {slugError()}
                    </Text>
                  </Show>
                </VStack>

                <VStack gap="1.5" alignItems="stretch">
                  <HStack justifyContent="space-between" alignItems="center">
                    <Text as="label" for="overview-summary-textarea" size="xs" weight="medium">
                      Release Summary (Controlled Textarea)
                    </Text>
                    <Text
                      size="xs"
                      tone={summary().length > MAX_SUMMARY_LENGTH ? "danger" : "muted"}
                      tabular
                    >
                      {summary().length}/{MAX_SUMMARY_LENGTH}
                    </Text>
                  </HStack>
                  <Textarea
                    id="overview-summary-textarea"
                    size="sm"
                    value={summary()}
                    invalid={showSummaryError()}
                    aria-invalid={showSummaryError() ? "true" : "false"}
                    aria-describedby={showSummaryError() ? "overview-summary-error" : undefined}
                    onValueChange={(next) => {
                      setSummary(next);
                      setSavedNotice(null);
                    }}
                    onBlur={() => setSummaryTouched(true)}
                    placeholder="Summarize architecture updates..."
                  />
                  <Show when={showSummaryError()}>
                    <Text id="overview-summary-error" size="xs" tone="danger">
                      {summaryError()}
                    </Text>
                  </Show>
                </VStack>

                <VStack gap="1.5" alignItems="stretch">
                  <Text as="label" for="overview-uncontrolled-input" size="xs" weight="medium">
                    Uncontrolled Draft Tag (Sibling-Safe)
                  </Text>
                  <Input
                    id="overview-uncontrolled-input"
                    size="sm"
                    defaultValue="v2.0-rc"
                    placeholder="Remains intact when sibling state changes..."
                  />
                </VStack>

                <HStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="2">
                  <HStack gap="2">
                    <Button type="submit" variant="solid" size="sm">
                      Validate Form
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={handleFormReset}>
                      Reset Fields
                    </Button>
                  </HStack>
                  <Show when={savedNotice()}>
                    {(notice) => (
                      <Text size="xs" tone="success" weight="medium">
                        {notice()}
                      </Text>
                    )}
                  </Show>
                </HStack>
              </VStack>
            </VStack>
          </Card.Body>
        </Card.Root>

        {/* Card 2: Ark UI Dialog (Exit Animations) + Skeleton & Empty State Primitives */}
        <VStack gap="6" alignItems="stretch">
          <Card.Root variant="outline">
            <Card.Header>
              <HStack justifyContent="space-between" alignItems="center">
                <Card.Title>Ark UI Presence Dialog</Card.Title>
                <Badge variant="outline" intent="info">
                  Zag.js
                </Badge>
              </HStack>
              <Card.Description>
                Presence-aware modal lifecycle with real CSS exit animations, focus restoration, and
                clean Portal teardown.
              </Card.Description>
            </Card.Header>

            <Card.Body>
              <VStack gap="4" alignItems="flex-start">
                <Text size="sm" tone="muted">
                  Portal mounting binds to Ark UI&apos;s presence state machine so{" "}
                  <Code size="xs">overlayFadeOut</Code> and <Code size="xs">dialogScaleOut</Code>{" "}
                  finish cleanly before unmounting DOM nodes.
                </Text>

                <HStack gap="3" alignItems="center" flexWrap="wrap">
                  <Dialog.Root>
                    <Dialog.Trigger variant="outline" size="sm">
                      Open Accessible Dialog
                    </Dialog.Trigger>

                    <Dialog.Portal>
                      <Dialog.Backdrop />
                      <Dialog.Positioner>
                        <Dialog.Content>
                          <Dialog.CloseButton />

                          <Dialog.Header>
                            <Dialog.Title>Presence-Aware Modal</Dialog.Title>
                            <Dialog.Description>
                              Dismiss via Escape, backdrop click, or action buttons to observe full
                              exit animation and Portal cleanup.
                            </Dialog.Description>
                          </Dialog.Header>

                          <Dialog.Body>
                            <VStack gap="2" alignItems="stretch">
                              <Text as="label" for="dialog-note-input" size="xs" weight="medium">
                                Quick Audit Note
                              </Text>
                              <Input
                                id="dialog-note-input"
                                size="sm"
                                value={dialogDraft()}
                                onValueChange={setDialogDraft}
                                placeholder="Enter a note to confirm back to the card..."
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
                                <Button
                                  {...triggerProps()}
                                  variant="solid"
                                  size="sm"
                                  onClick={(e) => {
                                    const draft = dialogDraft().trim();
                                    setLastDialogAction(
                                      draft ? `Confirmed: "${draft}"` : "Confirmed without note",
                                    );
                                    setDialogDraft("");
                                    const baseClick = triggerProps().onClick;
                                    if (typeof baseClick === "function") {
                                      baseClick(e);
                                    }
                                  }}
                                >
                                  Confirm &amp; Close
                                </Button>
                              )}
                            />
                          </Dialog.Footer>
                        </Dialog.Content>
                      </Dialog.Positioner>
                    </Dialog.Portal>
                  </Dialog.Root>

                  <Show when={lastDialogAction()}>
                    {(actionText) => (
                      <Badge variant="subtle" intent="success" size="sm">
                        {actionText()}
                      </Badge>
                    )}
                  </Show>
                </HStack>
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* Card 3: Skeleton & Empty State Preview */}
          <Card.Root variant="subtle" density="compact">
            <Card.Header>
              <HStack justifyContent="space-between" alignItems="center">
                <Heading as="h3" size="md">
                  Async States &amp; External Links
                </Heading>
                <HStack gap="1.5">
                  <Button
                    variant={previewState() === "skeleton" ? "solid" : "ghost"}
                    size="xs"
                    onClick={() => setPreviewState("skeleton")}
                  >
                    Skeleton
                  </Button>
                  <Button
                    variant={previewState() === "empty" ? "solid" : "ghost"}
                    size="xs"
                    onClick={() => setPreviewState("empty")}
                  >
                    Empty State
                  </Button>
                </HStack>
              </HStack>
            </Card.Header>

            <Card.Body>
              <Show
                when={previewState() === "skeleton"}
                fallback={
                  <VStack gap="2.5" alignItems="center" py="4">
                    <Box class={emptyStateIconBoxClass}>
                      <Icon size="md">
                        <rect x="3" y="4" width="18" height="16" rx="2" />
                        <path d="M3 10h18" />
                      </Icon>
                    </Box>
                    <VStack gap="1" alignItems="center">
                      <Text size="sm" weight="medium">
                        No telemetry snapshots yet
                      </Text>
                      <Text size="xs" tone="muted">
                        Connect a live SpacetimeDB module or trigger an RPC probe to populate rows.
                      </Text>
                    </VStack>
                  </VStack>
                }
              >
                <VStack
                  gap="3"
                  alignItems="stretch"
                  role="status"
                  aria-busy="true"
                  aria-label="Sample loading"
                >
                  <HStack gap="3" alignItems="center">
                    <Skeleton variant="circle" />
                    <VStack gap="2" alignItems="stretch" flex="1">
                      <Skeleton variant="heading" />
                      <Skeleton lines={2} />
                    </VStack>
                  </HStack>
                </VStack>
              </Show>
            </Card.Body>

            <Card.Footer>
              <Link href="https://docs.solidjs.com" external variant="muted" size="xs">
                Solid 2.0 Documentation
                <Icon size="sm">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </Icon>
              </Link>
            </Card.Footer>
          </Card.Root>
        </VStack>
      </Grid>
    </VStack>
  );
}
