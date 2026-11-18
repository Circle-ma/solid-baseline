import type { JSX } from "@solidjs/web";
import type { ParentComponent } from "solid-js";
import { Errored, Loading, untrack } from "solid-js";
import { Button } from "./button";
import { Card } from "./card";
import { VStack } from "./layout";
import { Code, Text } from "./typography";

export interface AsyncBoundaryProps {
  children?: JSX.Element;
  on?: unknown;
  loadingFallback?: JSX.Element;
  errorFallback?: (err: () => unknown, reset: () => void) => JSX.Element;
}

function DefaultLoadingFallback() {
  return (
    <Card.Root>
      <Card.Body>
        <VStack gap="2" alignItems="center">
          <Text size="sm" tone="muted">
            Loading state in flight...
          </Text>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

/**
 * Systematic Async & Error Boundary Primitive
 * Coordinates Solid 2.0 <Errored> with getter err() / reset action and <Loading on={props.on}>.
 * Renders consistent design token UI surfaces upon suspended or rejected computations.
 */
export const AsyncBoundary: ParentComponent<AsyncBoundaryProps> = (props) => {
  return (
    <Errored
      fallback={(err, reset) => {
        if (props.errorFallback) {
          return props.errorFallback(err, reset);
        }
        const raw = untrack(() => err());
        const errMsg = String(raw instanceof Error ? raw.message : raw);
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
                  {errMsg}
                </Code>
              </VStack>
            </Card.Body>
            <Card.Footer>
              <Button variant="outline" size="sm" onClick={reset}>
                Retry
              </Button>
            </Card.Footer>
          </Card.Root>
        );
      }}
    >
      <Loading on={props.on} fallback={props.loadingFallback ?? <DefaultLoadingFallback />}>
        {props.children}
      </Loading>
    </Errored>
  );
};

export default AsyncBoundary;
