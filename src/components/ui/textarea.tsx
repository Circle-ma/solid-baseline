import type { ComponentProps } from "@solidjs/web";
import type { Component } from "solid-js";
import { omit, onFlush, Show, untrack } from "solid-js";
import { type TextareaVariant, textarea } from "styled-system/recipes";
import { invokeTextInputHandler, restoreTextSelectionRange } from "./_form-helpers";

export interface TextareaProps extends Omit<ComponentProps<"textarea">, "style"> {
  size?: TextareaVariant["size"];
  resize?: TextareaVariant["resize"];
  invalid?: boolean;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

type TextareaElementEvent = Parameters<
  Extract<ComponentProps<"textarea">["onInput"], (...args: never[]) => unknown>
>[0];

const ControlledTextarea: Component<TextareaProps> = (props) => {
  const rest = omit(
    props,
    "size",
    "resize",
    "invalid",
    "onValueChange",
    "class",
    "value",
    "defaultValue",
    "onInput",
    "aria-invalid",
  );

  const handleInput = (e: TextareaElementEvent) => {
    const el = e.currentTarget;
    const prevValue = el.value;
    const prevStart = el.selectionStart;
    const prevEnd = el.selectionEnd;

    props.onValueChange?.(prevValue);
    invokeTextInputHandler(props.onInput, e);

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
    <textarea
      {...rest}
      value={String(props.value ?? "")}
      aria-invalid={props["aria-invalid"] ?? (props.invalid ? "true" : undefined)}
      onInput={handleInput}
      class={[
        textarea({
          size: props.size,
          resize: props.resize,
          invalid: props.invalid,
        }),
        props.class,
      ]}
    />
  );
};

const UncontrolledTextarea: Component<TextareaProps> = (props) => {
  const rest = omit(
    props,
    "size",
    "resize",
    "invalid",
    "onValueChange",
    "class",
    "value",
    "defaultValue",
    "onInput",
    "aria-invalid",
  );

  const handleInput = (e: TextareaElementEvent) => {
    props.onValueChange?.(e.currentTarget.value);
    invokeTextInputHandler(props.onInput, e);
  };

  return (
    <textarea
      {...rest}
      defaultValue={props.defaultValue}
      aria-invalid={props["aria-invalid"] ?? (props.invalid ? "true" : undefined)}
      onInput={handleInput}
      class={[
        textarea({
          size: props.size,
          resize: props.resize,
          invalid: props.invalid,
        }),
        props.class,
      ]}
    />
  );
};

/**
 * Systematic Textarea Primitive
 * Mirrors `<Input>` controlled/uncontrolled routing, `onFlush()` reconciliation,
 * and Panda CSS token styling for multi-line text inputs.
 */
export const Textarea: Component<TextareaProps> = (props) => {
  const isControlled = untrack(() => props.value !== undefined);
  return (
    <Show when={isControlled} fallback={<UncontrolledTextarea {...props} />}>
      <ControlledTextarea {...props} />
    </Show>
  );
};

export default Textarea;
