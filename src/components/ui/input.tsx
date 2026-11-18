import type { ComponentProps } from "@solidjs/web";
import type { Component } from "solid-js";
import { omit, onFlush, Show, untrack } from "solid-js";
import { type InputVariant, input } from "styled-system/recipes";
import { invokeTextInputHandler, restoreTextSelectionRange } from "./_form-helpers";

export interface InputProps extends Omit<ComponentProps<"input">, "style" | "size"> {
  size?: InputVariant["size"];
  invalid?: boolean;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

type InputElementEvent = Parameters<
  Extract<ComponentProps<"input">["onInput"], (...args: never[]) => unknown>
>[0];

const ControlledInput: Component<InputProps> = (props) => {
  const rest = omit(
    props,
    "size",
    "invalid",
    "onValueChange",
    "class",
    "value",
    "defaultValue",
    "onInput",
    "aria-invalid",
  );

  const handleInput = (e: InputElementEvent) => {
    const el = e.currentTarget;
    const prevValue = el.value;
    const prevStart = el.selectionStart;
    const prevEnd = el.selectionEnd;

    props.onValueChange?.(prevValue);
    invokeTextInputHandler(props.onInput, e);

    // Reconcile after Solid's batched microtask flush without forcing a synchronous flush().
    onFlush(() => {
      const committed = String(untrack(() => props.value) ?? "");
      if (el.value !== committed) {
        el.value = committed;
        restoreTextSelectionRange(el, prevStart, prevEnd, prevValue.length, committed.length);
      } else if (prevValue !== committed) {
        restoreTextSelectionRange(el, prevStart, prevEnd, prevValue.length, committed.length);
      }
    });
  };

  return (
    <input
      {...rest}
      value={String(props.value ?? "")}
      aria-invalid={props["aria-invalid"] ?? (props.invalid ? "true" : undefined)}
      onInput={handleInput}
      class={[
        input({
          size: props.size,
          invalid: props.invalid,
        }),
        props.class,
      ]}
    />
  );
};

const UncontrolledInput: Component<InputProps> = (props) => {
  const rest = omit(
    props,
    "size",
    "invalid",
    "onValueChange",
    "class",
    "value",
    "defaultValue",
    "onInput",
    "aria-invalid",
  );

  const handleInput = (e: InputElementEvent) => {
    props.onValueChange?.(e.currentTarget.value);
    invokeTextInputHandler(props.onInput, e);
  };

  return (
    <input
      {...rest}
      defaultValue={props.defaultValue}
      aria-invalid={props["aria-invalid"] ?? (props.invalid ? "true" : undefined)}
      onInput={handleInput}
      class={[
        input({
          size: props.size,
          invalid: props.invalid,
        }),
        props.class,
      ]}
    />
  );
};

/**
 * Systematic Input Primitive
 *
 * Synchronously routes controlled (`value` provided) and uncontrolled (`defaultValue` only)
 * modes to dedicated branches with fine-grained attribute bindings:
 * - Controlled mode: binds directly to `props.value` and reconciles DOM drift inside `onFlush()`
 *   (preserving Solid 2.0 microtask batching and selection range) when a parent rejects or formats input.
 * - Uncontrolled mode: binds `defaultValue` only so sibling attribute updates (such as `invalid`
 *   or `class`) never trigger `UNCOMMITTED_INPUT_OVERWRITTEN`.
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
