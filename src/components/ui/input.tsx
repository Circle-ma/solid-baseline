import type { Component, ComponentProps } from "solid-js";
import { createEffect, createSignal, untrack } from "solid-js";
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
 * Implements Solid 2.0 draft signal synchronization to prevent [UNCOMMITTED_INPUT_OVERWRITTEN] diagnostics.
 * Styled via Panda CSS input recipe with closed-world tokens.
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
  const [draft, setDraft] = createSignal(
    untrack(() => props.value ?? ""),
    { name: "input-draft" },
  );

  createEffect(
    () => props.value,
    (v) => {
      setDraft(v ?? "");
    },
  );

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
