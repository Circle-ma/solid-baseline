import type { ComponentProps } from "@solidjs/web";
import type { Component } from "solid-js";
import { createSignal, Show, untrack } from "solid-js";
import { cx } from "styled-system/css";
import { type InputVariant, input } from "styled-system/recipes";
import { omitProps, toClass } from "./tokens";

export interface InputProps extends Omit<ComponentProps<"input">, "style" | "size"> {
  size?: InputVariant["size"];
  invalid?: boolean;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

const ControlledInput: Component<InputProps> = (props) => {
  const rest = omitProps(
    props,
    "size",
    "invalid",
    "onValueChange",
    "class",
    "value",
    "defaultValue",
    "onInput",
    "style",
  );

  const [draft, setDraft] = createSignal(() => String(props.value ?? ""), {
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

const UncontrolledInput: Component<InputProps> = (props) => {
  const rest = omitProps(
    props,
    "size",
    "invalid",
    "onValueChange",
    "class",
    "value",
    "defaultValue",
    "onInput",
    "style",
  );

  return (
    <input
      {...rest}
      defaultValue={props.defaultValue}
      onInput={(e) => {
        const val = e.currentTarget.value;
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

/**
 * Systematic Input Primitive
 *
 * Explicitly separates controlled (`value` provided) and uncontrolled (`defaultValue` only)
 * modes via `<Show>` to eliminate `UNCOMMITTED_INPUT_OVERWRITTEN` and `EFFECT_RELAY_TEAR`:
 * - Controlled mode: synchronizes typing and external resets (e.g. `setInputText("")`)
 *   via a Solid 2.0 derived signal (`createSignal(() => String(props.value ?? ""))`).
 * - Uncontrolled mode: binds `defaultValue` only without reactive `value` tracking so
 *   sibling attribute updates (such as `invalid` or `class`) never overwrite typed text.
 */
export const Input: Component<InputProps> = (props) => {
  const isControlled = untrack(() => props.value !== undefined);
  return (
    <Show when={isControlled} fallback={<UncontrolledInput {...props} />}>
      <ControlledInput {...props} />
    </Show>
  );
};

export default Input;
