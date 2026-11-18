import type { ComponentProps } from "@solidjs/web";
import { type Component, omit, Repeat, Show } from "solid-js";
import { css } from "styled-system/css";
import { type SkeletonVariant, skeleton } from "styled-system/recipes";
import { VStack } from "./layout";

export interface SkeletonProps extends Omit<ComponentProps<"div">, "style" | "children"> {
  variant?: SkeletonVariant["variant"];
  /** Renders multiple stacked text skeleton lines (last line slightly shorter). */
  lines?: number;
}

const shortLineClass = css({
  w: "3/4",
});

/**
 * Systematic Skeleton Primitive
 * Provides calm, motion-safe loading placeholders (`prefers-reduced-motion` respected globally).
 */
export const Skeleton: Component<SkeletonProps> = (props) => {
  const rest = omit(props, "variant", "lines", "class");

  return (
    <Show
      when={(props.lines ?? 1) > 1}
      fallback={
        <div
          aria-hidden="true"
          {...rest}
          class={[skeleton({ variant: props.variant ?? "text" }), props.class]}
        />
      }
    >
      <VStack gap="2" alignItems="stretch" aria-hidden="true" {...rest} class={props.class}>
        <Repeat count={props.lines ?? 1}>
          {(index) => (
            <div
              class={[
                skeleton({ variant: props.variant ?? "text" }),
                index === (props.lines ?? 1) - 1 ? shortLineClass : undefined,
              ]}
            />
          )}
        </Repeat>
      </VStack>
    </Show>
  );
};

export default Skeleton;
