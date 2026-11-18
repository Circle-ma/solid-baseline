import type { Component, ComponentProps } from "solid-js";
import { createSignal } from "solid-js";
import { cx } from "styled-system/css";
import { type InputVariant, input } from "styled-system/recipes";
import { omitProps, toClass } from "./tokens";

export interface InputProps extends Omit<ComponentProps<"input">, "style" | "size"> {
  size?: InputVariant["size"];
  invalid?: boolean;
  onValueChange?: (value: string) => void;
}

/**
 * Systematic Input Primitive
 * Uses Solid 2.0 native derived signal paradigm to eliminate EFFECT_RELAY_TEAR
 * and owned writes while keeping typing and external value changes in sync.
 */
export const Input: Component<InputProps> = (props) => {
  const rest = omitProps(
    props,
    "size",
    "invalid",
    "onValueChange",
    "class",
    "value",
    "onInput",
    "style",
  );

  const [draft, setDraft] = createSignal(() => props.value ?? "", {
    name: "input-draft",
  });

  return (
    <input
      {...rest}
      value={draft()}
      onInput={(e) => {
        const val = e.currentTarget.value;
        setDraft(val);
        props.onValueChange?.(val);
        if (typeof props.onInput === "function") {
          props.onInput(e);
        }
      }}
      class={cx(
        input({
          size: props.size,
          invalid: props.invalid,
        }),
        toClass(props.class),
      )}
    />
  );
};

export default Input;
