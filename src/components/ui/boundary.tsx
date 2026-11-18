import type { JSX } from "@solidjs/web";
import type { ParentComponent } from "solid-js";
import { Errored, Loading } from "solid-js";
import { Button } from "./button";
import { Card } from "./card";
import { VStack } from "./layout";
import { Skeleton } from "./skeleton";
import { Code, Text } from "./typography";

export interface AsyncBoundaryProps {
  children?: JSX.Element;
  on?: unknown;
  onRetry?: () => void;
  loadingFallback?: JSX.Element;
  errorFallback?: (err: () => unknown, reset: () => void) => JSX.Element;
}

function formatBoundaryError(raw: unknown): string {
  return String(raw instanceof Error ? raw.message : raw);
}

function DefaultLoadingFallback() {
  return (
    <Card.Root
      variant="subtle"
      density="compact"
      role="status"
      aria-busy="true"
      aria-label="Loading content"
    >
      <Card.Body>
        <VStack gap="3" alignItems="stretch">
          <Skeleton variant="heading" />
          <Skeleton lines={2} />
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

/**
 * Systematic Async & Error Boundary Primitive
 * Coordinates Solid 2.0 <Loading on={props.on}> around <Errored> so resetting after an error
 * preserves the already-revealed <Loading> boundary and avoids sub-150ms fallback flashes.
 * Invokes `onRetry?.()` before `reset()` so rejected async memos refresh cleanly on retry.
 */
export const AsyncBoundary: ParentComponent<AsyncBoundaryProps> = (props) => {
  return (
    <Loading on={props.on} fallback={props.loadingFallback ?? <DefaultLoadingFallback />}>
      <Errored
        fallback={(err, reset) => {
          const handleRetry = () => {
            props.onRetry?.();
            reset();
          };

          if (props.errorFallback) {
            return props.errorFallback(err, handleRetry);
          }

          return (
            <Card.Root>
              <Card.Header>
                <Card.Title>Application Error</Card.Title>
                <Card.Description>
                  An unhandled error occurred in this reactive boundary.
                </Card.Description>
              </Card.Header>
              <Card.Body>
                <VStack gap="2" alignItems="flex-start">
                  <Text size="sm" tone="danger">
                    Error Details:
                  </Text>
                  <Code size="sm" tone="danger">
                    {formatBoundaryError(err())}
                  </Code>
                </VStack>
              </Card.Body>
              <Card.Footer>
                <Button variant="outline" size="sm" onClick={handleRetry}>
                  Retry
                </Button>
              </Card.Footer>
            </Card.Root>
          );
        }}
      >
        {props.children}
      </Errored>
    </Loading>
  );
};

export default AsyncBoundary;
